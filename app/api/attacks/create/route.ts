import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'


export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { host, port, method, time, concurrent } = body

    // Validation
    if (!host || !port || !method || !time) {
      return NextResponse.json(
        { error: 'host, port, method, and time are required' },
        { status: 400 }
      )
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

    // Get user limits and cooldown status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('allowed_methods, max_time, max_concurrent, cooldown_until, plan_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 400 }
      )
    }

    const allowedMethods = userData?.allowed_methods || []
    const maxTime = userData?.max_time
    const maxConcurrent = userData?.max_concurrent
    const cooldownUntil = userData?.cooldown_until
    const planId = userData?.plan_id

    // Get cooldown from plan if user has a plan
    let cooldownSeconds = 0
    if (planId) {
      const { data: planData } = await supabase
        .from('plans')
        .select('cooldown')
        .eq('id', planId)
        .single()
      
      if (planData) {
        cooldownSeconds = planData.cooldown || 0
      }
    }

    // Check cooldown
    if (cooldownUntil) {
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

    // Check concurrent limit
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

    // Check if method exists and is active
    const { data: methodData, error: methodError } = await supabase
      .from('attack_methods')
      .select('id, name, is_active, api_url_format')
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
      for (let i = 0; i < concurrentNum; i++) {
        attackPromises.push(
          fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
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

      return NextResponse.json({
        attack: {
          ...attackData,
          status: allSucceeded ? 'running' : 'failed',
        },
        concurrent: concurrentNum,
        apiResponse: firstResponse,
      })
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

      return NextResponse.json(
        { error: 'Failed to start attack', details: apiError.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Create attack error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

