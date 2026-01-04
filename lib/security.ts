import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

// Idempotency key management
export async function checkIdempotency(key: string): Promise<any | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('idempotency_keys')
    .select('result, created_at')
    .eq('key', key)
    .single()

  if (data) {
    // Idempotency keys expire after 24 hours
    const createdAt = new Date(data.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursDiff < 24) {
      return JSON.parse(data.result)
    }
  }

  return null
}

export async function storeIdempotency(key: string, result: any): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('idempotency_keys')
    .insert({
      key,
      result: JSON.stringify(result),
      created_at: new Date().toISOString(),
    })
}

// Rate limiting (in-memory, use Redis in production)
const rateLimitMap = new Map<string, number[]>()

export function checkRateLimit(
  userId: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minute
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const requests = rateLimitMap.get(userId) || []
  const recent = requests.filter((time) => now - time < windowMs)

  if (recent.length >= maxRequests) {
    const oldest = Math.min(...recent)
    const resetAt = oldest + windowMs
    return { allowed: false, remaining: 0, resetAt }
  }

  recent.push(now)
  rateLimitMap.set(userId, recent)

  return {
    allowed: true,
    remaining: maxRequests - recent.length,
    resetAt: now + windowMs,
  }
}

// Audit logging
export async function logAuditEvent(
  userId: number,
  action: string,
  resourceType: string,
  resourceId: number | string | null,
  oldValue: any,
  newValue: any,
  request: NextRequest
): Promise<void> {
  const supabase = await createClient()
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId?.toString() || null,
    old_value: JSON.stringify(oldValue),
    new_value: JSON.stringify(newValue),
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    created_at: new Date().toISOString(),
  })
}

// Voucher deduplication check
export async function isVoucherUsed(voucherCode: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('payment_history')
    .select('id')
    .eq('voucher_code', voucherCode)
    .eq('status', 'SUCCESS')
    .single()

  return !!data
}

// Validate plan is active and valid
export async function validatePlan(planId: number): Promise<{ valid: boolean; plan?: any; error?: string }> {
  const supabase = await createClient()
  const { data: plan, error } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (error || !plan) {
    return { valid: false, error: 'Plan not found' }
  }

  if (!plan.is_active) {
    return { valid: false, error: 'Plan is not active' }
  }

  const planPrice = plan.price ? parseFloat(String(plan.price)) : 0
  if (planPrice < 0) {
    return { valid: false, error: 'Invalid plan price' }
  }

  return { valid: true, plan }
}

// Generate idempotency key from request
export function getIdempotencyKey(request: NextRequest): string | null {
  return request.headers.get('x-idempotency-key')
}

