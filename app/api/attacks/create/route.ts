import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'
import { logApiRequest } from '@/lib/api-logger'
import { logExternalApiRequest } from '@/lib/external-api-logger'
import { getClientIp, normalizeIpAddress } from '@/lib/get-client-ip'


export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let responseData: any = null
  let responseStatus = 200
  let requestBody: any = null
  let user: any = null
  
  try {
    user = await getUser()
    if (!user) {
      responseData = { error: 'Unauthorized' }
      responseStatus = 401
      const response = NextResponse.json(responseData, { status: responseStatus })
      await logRequest(request, user, requestBody, responseData, responseStatus, startTime)
      return response
    }

    requestBody = await request.json()
    const { host, port, method, time, concurrent } = requestBody

    // Validation
    if (!host || !port || !method || !time) {
      responseData = { error: 'host, port, method, and time are required' }
      responseStatus = 400
      const response = NextResponse.json(responseData, { status: responseStatus })
      await logRequest(request, user, requestBody, responseData, responseStatus, startTime)
      return response
    }

    const concurrentNum = concurrent ? parseInt(concurrent.toString()) : 1
    if (isNaN(concurrentNum) || concurrentNum < 1) {
      return NextResponse.json(
        { error: 'concurrent must be at least 1' },
        { status: 400 }
      )
    }

    const portNum = parseInt(port)
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { error: 'port must be between 1 and 65535' },
        { status: 400 }
      )
    }

    const timeNum = parseInt(time)
    if (isNaN(timeNum) || timeNum <= 0) {
      return NextResponse.json(
        { error: 'time must be greater than 0' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if global attack is enabled (admin can bypass)
    const { data: globalAttackSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'global_attack_enabled')
      .single()

    const globalAttackEnabled = globalAttackSetting?.value !== "false" // Default to true if not set
    
    // Get user info to check if admin
    const { data: currentUserData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = currentUserData?.is_admin || false

    // Block non-admin users if global attack is disabled
    if (!globalAttackEnabled && !isAdmin) {
      return NextResponse.json(
        { error: 'Global attack system is currently disabled. Please contact administrator.' },
        { status: 503 }
      )
    }

    // Get user limits and cooldown status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('allowed_methods, max_time, max_concurrent, cooldown_until, plan_id, bypass_global_slot, bypass_cooldown')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 400 }
      )
    }

    const allowedMethods = userData?.allowed_methods || []
    let maxTime = userData?.max_time // Start with user's max_time
    let maxConcurrent = userData?.max_concurrent // Start with user's max_concurrent
    const cooldownUntil = userData?.cooldown_until
    const planId = userData?.plan_id

    // Get limits from plan if user has a plan (plan limits override user limits)
    let cooldownSeconds = 0
    if (planId) {
      const { data: planData } = await supabase
        .from('plans')
        .select('cooldown, max_time, max_concurrent')
        .eq('id', planId)
        .single()
      
      if (planData) {
        cooldownSeconds = planData.cooldown || 0
        // Use plan limits if they exist (plan limits override user limits)
        if (planData.max_time !== null) {
          maxTime = planData.max_time
        }
        if (planData.max_concurrent !== null) {
          maxConcurrent = planData.max_concurrent
        }
      }
    }

    // Check cooldown (skip if user has bypass_cooldown enabled)
    const bypassCooldown = userData?.bypass_cooldown || false
    if (!bypassCooldown && cooldownUntil) {
      const cooldownEnd = new Date(cooldownUntil).getTime()
      const now = Date.now()
      if (now < cooldownEnd) {
        const remainingSeconds = Math.ceil((cooldownEnd - now) / 1000)
        return NextResponse.json(
          {
            error: `Cooldown active. Please wait ${remainingSeconds} seconds before launching another attack.`,
            cooldown_remaining: remainingSeconds
          },
          { status: 429 }
        )
      }
    }

    // Check method access limit
    if (Array.isArray(allowedMethods) && allowedMethods.length > 0) {
      if (!allowedMethods.includes(method)) {
        return NextResponse.json(
          { error: 'You do not have access to this attack method' },
          { status: 403 }
        )
      }
    }

    // Check time limit
    if (maxTime !== null && timeNum > maxTime) {
      return NextResponse.json(
        { error: `Maximum attack duration is ${maxTime} seconds` },
        { status: 400 }
      )
    }

    // Check if method exists and is active (need category for global limit check)
    const { data: methodData, error: methodError } = await supabase
      .from('attack_methods')
      .select('id, name, is_active, api_url_format, category')
      .eq('name', method)
      .eq('is_active', true)
      .single()

    if (methodError || !methodData) {
      return NextResponse.json(
        { error: 'Invalid or inactive attack method' },
        { status: 400 }
      )
    }

    if (!methodData.api_url_format) {
      return NextResponse.json(
        { error: 'Attack method does not have API URL format configured' },
        { status: 400 }
      )
    }

    // Check global concurrent limit by category (L4/L7)
    const { data: globalLimitSettings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['global_concurrent_limit_l4', 'global_concurrent_limit_l7'])

    const globalLimitL4 = globalLimitSettings?.find(s => s.key === 'global_concurrent_limit_l4')?.value
      ? parseInt(globalLimitSettings.find(s => s.key === 'global_concurrent_limit_l4')!.value)
      : null
    const globalLimitL7 = globalLimitSettings?.find(s => s.key === 'global_concurrent_limit_l7')?.value
      ? parseInt(globalLimitSettings.find(s => s.key === 'global_concurrent_limit_l7')!.value)
      : null

    // Get method category to check the appropriate limit
    const methodCategory = methodData.category || 'L4'
    const globalConcurrentLimit = methodCategory === 'L7' ? globalLimitL7 : globalLimitL4

    // Check global concurrent limit (skip if user has bypass_global_slot enabled)
    const bypassGlobalSlot = userData?.bypass_global_slot || false
    if (globalConcurrentLimit !== null && globalConcurrentLimit > 0 && !bypassGlobalSlot) {
      // Get all running/pending attacks
      const { data: allRunningAttacks, error: globalError } = await supabase
        .from('attacks')
        .select('concurrent_count, method')
        .in('status', ['running', 'pending'])

      if (globalError) {
        return NextResponse.json(
          { error: 'Failed to check global concurrent limit' },
          { status: 400 }
        )
      }

      // Get all method categories
      const { data: allMethods, error: methodsError } = await supabase
        .from('attack_methods')
        .select('name, category')

      if (methodsError) {
        return NextResponse.json(
          { error: 'Failed to check global concurrent limit' },
          { status: 400 }
        )
      }

      // Create a map of method name to category
      const methodCategoryMap = new Map<string, string>()
      allMethods?.forEach((m: any) => {
        methodCategoryMap.set(m.name, m.category || 'L4')
      })

      // Filter attacks by category and sum concurrent_count
      const categoryAttacks = allRunningAttacks?.filter((attack: any) => {
        const attackCategory = methodCategoryMap.get(attack.method) || 'L4'
        return attackCategory === methodCategory
      }) || []

      const globalCurrentConcurrent = categoryAttacks.reduce((sum: number, attack: any) => {
        return sum + (attack.concurrent_count || 1)
      }, 0)

      if (globalCurrentConcurrent + concurrentNum > globalConcurrentLimit) {
        const availableSlots = Math.max(0, globalConcurrentLimit - globalCurrentConcurrent)
        return NextResponse.json(
          { 
            error: `Global concurrent ${methodCategory} attack limit reached. Available slots: ${availableSlots}. You tried to use ${concurrentNum} slots.`,
            available_slots: availableSlots
          },
          { status: 429 }
        )
      }
    }

    // Check user concurrent limit
    // Count total concurrent from all running/pending attacks (sum of concurrent_count)
    if (maxConcurrent !== null) {
      const { data: runningAttacks, error: runningError } = await supabase
        .from('attacks')
        .select('concurrent_count')
        .eq('user_id', user.id)
        .in('status', ['running', 'pending'])

      if (runningError) {
        return NextResponse.json(
          { error: 'Failed to check concurrent limit' },
          { status: 400 }
        )
      }

      // Sum all concurrent_count from running/pending attacks
      const currentConcurrent = runningAttacks?.reduce((sum, attack) => {
        return sum + (attack.concurrent_count || 1)
      }, 0) || 0

      if (currentConcurrent + concurrentNum > maxConcurrent) {
        return NextResponse.json(
          { error: `Maximum concurrent attacks limit is ${maxConcurrent}. You currently have ${currentConcurrent} concurrent attacks running/pending.` },
          { status: 400 }
        )
      }
    }

    // Create single attack record with concurrent_count
    // Set started_at immediately when creating the attack to ensure accurate remaining time calculation
    const now = new Date().toISOString()
    const { data: attackData, error: attackError } = await supabase
      .from('attacks')
      .insert({
        user_id: user.id,
        target_url: `${host}:${port}`,
        host,
        port: portNum,
        method,
        time: timeNum,
        duration_seconds: timeNum,
        threads: 1,
        status: 'pending',
        api_key: null, // API key is now part of api_url_format
        concurrent_count: concurrentNum,
        started_at: now, // Set started_at immediately for accurate remaining time
      })
      .select()
      .single()

    if (attackError) {
      return NextResponse.json({ error: attackError.message }, { status: 400 })
    }

    // Call external API for all concurrent attacks
    try {
      // Replace placeholders in API URL format
      // Use methodData.name (from database) instead of method (from request) for security
      let apiUrl = methodData.api_url_format
        .replace(/\[host\]/g, encodeURIComponent(host))
        .replace(/\[port\]/g, port.toString())
        .replace(/\[method\]/g, encodeURIComponent(methodData.name))
        .replace(/\[time\]/g, time.toString())

      // Start all concurrent attacks (fire multiple API requests)
      const attackPromises = []
      const requestHeaders = {
        'Accept': 'application/json',
      }
      
      for (let i = 0; i < concurrentNum; i++) {
        const requestStartTime = Date.now()
        attackPromises.push(
          fetch(apiUrl, {
            method: 'GET',
            headers: requestHeaders,
          })
            .then(async (response) => {
              const duration = Date.now() - requestStartTime
              const responseHeaders: Record<string, string> = {}
              response.headers.forEach((value, key) => {
                responseHeaders[key] = value
              })
              
              // Clone response to read body for logging
              const responseClone = response.clone()
              let responseBody: any = null
              try {
                responseBody = await responseClone.json()
              } catch {
                try {
                  const textClone = response.clone()
                  responseBody = await textClone.text()
                } catch {
                  responseBody = null
                }
              }

              // Log external API request (don't await to avoid blocking)
              logExternalApiRequest({
                attack_id: attackData.id,
                user_id: user.id,
                api_url: apiUrl,
                request_method: 'GET',
                request_headers: requestHeaders,
                response_status: response.status,
                response_body: responseBody,
                response_headers: responseHeaders,
                duration_ms: duration,
              }).catch(err => console.error('Failed to log external API:', err))

              return response
            })
            .catch(async (error) => {
              const duration = Date.now() - requestStartTime
              // Log external API error (don't await to avoid blocking)
              logExternalApiRequest({
                attack_id: attackData.id,
                user_id: user.id,
                api_url: apiUrl,
                request_method: 'GET',
                request_headers: requestHeaders,
                error_message: error.message,
                duration_ms: duration,
              }).catch(err => console.error('Failed to log external API error:', err))
              throw error
            })
        )
      }

      const responses = await Promise.all(attackPromises)
      const apiResponses = await Promise.all(
        responses.map(async (response) => {
          try {
            return await response.json()
          } catch {
            return {
              status: response.status,
              statusText: response.statusText,
              ok: response.ok,
            }
          }
        })
      )

      // Check if all requests succeeded
      const allSucceeded = responses.every((r) => r.ok)
      const firstResponse = apiResponses[0] || {}

      // Update attack with API response (store first response, but status based on all)
      // Keep the original started_at that was set when creating the attack
      await supabase
        .from('attacks')
        .update({
          status: allSucceeded ? 'running' : 'failed',
          api_response: {
            concurrent: concurrentNum,
            responses: apiResponses,
            all_succeeded: allSucceeded,
          },
          // Don't update started_at here - it was already set when creating the attack
        })
        .eq('id', attackData.id)

      // Update user cooldown if attack succeeded and cooldown > 0
      if (allSucceeded && cooldownSeconds > 0) {
        const cooldownUntil = new Date(Date.now() + cooldownSeconds * 1000).toISOString()
        await supabase
          .from('users')
          .update({ cooldown_until: cooldownUntil })
          .eq('id', user.id)
      }

      responseData = {
        attack: {
          ...attackData,
          status: allSucceeded ? 'running' : 'failed',
        },
        concurrent: concurrentNum,
        apiResponse: firstResponse,
      }
      responseStatus = 200
      const response = NextResponse.json(responseData, { status: responseStatus })
      await logRequest(request, user, requestBody, responseData, responseStatus, startTime)
      return response
    } catch (apiError: any) {
      // Update attack as failed
      await supabase
        .from('attacks')
        .update({
          status: 'failed',
          error_message: apiError.message,
          api_response: { error: apiError.message, concurrent: concurrentNum },
        })
        .eq('id', attackData.id)

      responseData = { error: 'Failed to start attack', details: apiError.message }
      responseStatus = 500
      const response = NextResponse.json(responseData, { status: responseStatus })
      await logRequest(request, user, requestBody, responseData, responseStatus, startTime)
      return response
    }
  } catch (error: any) {
    console.error('Create attack error:', error)
    responseData = { error: 'Internal server error', details: error.message }
    responseStatus = 500
    const response = NextResponse.json(responseData, { status: responseStatus })
    await logRequest(request, user, requestBody, responseData, responseStatus, startTime)
    return response
  }
}

async function logRequest(
  request: NextRequest,
  user: any,
  requestBody: any,
  responseData: any,
  responseStatus: number,
  startTime: number
) {
  try {
    const duration = Date.now() - startTime
    const ipAddress = normalizeIpAddress(getClientIp(request))
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    await logApiRequest({
      user_id: user?.id,
      endpoint: '/api/attacks/create',
      method: 'POST',
      request_body: requestBody,
      request_headers: Object.fromEntries(request.headers.entries()),
      response_status: responseStatus,
      response_body: responseData,
      ip_address: ipAddress,
      user_agent: userAgent,
      duration_ms: duration,
    })
  } catch (error) {
    // Don't throw - logging failures shouldn't break the API
    console.error('Failed to log API request:', error)
  }
}

