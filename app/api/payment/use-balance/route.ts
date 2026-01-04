import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'
import {
  checkIdempotency,
  storeIdempotency,
  checkRateLimit,
  logAuditEvent,
  validatePlan,
  getIdempotencyKey,
} from '@/lib/security'
import { purchasePlanWithBalanceAtomic } from '@/lib/payment-security'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limiting
    const rateLimit = checkRateLimit(user.id.toString(), 5, 60000)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
        },
        { status: 429 }
      )
    }

    // Idempotency check
    const idempotencyKey = getIdempotencyKey(request) || crypto.randomUUID()
    const cachedResult = await checkIdempotency(idempotencyKey)
    if (cachedResult) {
      return NextResponse.json(cachedResult)
    }

    const body = await request.json()
    const { planId } = body

    if (!planId) {
      return NextResponse.json(
        { error: 'Please provide plan ID' },
        { status: 400 }
      )
    }

    // Validate plan
    const planValidation = await validatePlan(planId)
    if (!planValidation.valid || !planValidation.plan) {
      return NextResponse.json(
        { error: planValidation.error || 'Invalid plan' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get old user state for audit log
    const { data: oldUserState } = await supabase
      .from('users')
      .select('balance, plan_id, plan_expires_at')
      .eq('id', user.id)
      .single()

    // Use atomic function to prevent race conditions
    const purchaseResult = await purchasePlanWithBalanceAtomic(user.id, planId)

    if (!purchaseResult.success) {
      const response = {
        success: false,
        message: purchaseResult.error || 'Payment processing failed',
      }

      await storeIdempotency(idempotencyKey, response)
      return NextResponse.json(response, { status: 400 })
    }

    // Get new user state for audit log
    const { data: newUserState } = await supabase
      .from('users')
      .select('balance, plan_id, plan_expires_at')
      .eq('id', user.id)
      .single()

    // Audit log
    await logAuditEvent(
      user.id,
      'PLAN_PURCHASE_BALANCE',
      'plan',
      planId,
      oldUserState,
      newUserState,
      request
    )

    const response = {
      success: true,
      amount: planValidation.plan.price ? parseFloat(String(planValidation.plan.price)) : 0,
      balance: purchaseResult.data?.balance || 0,
      message: `Plan purchased successfully using balance! Remaining balance: ฿${purchaseResult.data?.balance.toFixed(2) || '0.00'}`,
    }

    await storeIdempotency(idempotencyKey, response)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Use balance error:', error)
    return NextResponse.json(
      { error: 'System error occurred. Please try again' },
      { status: 500 }
    )
  }
}

