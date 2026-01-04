import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'
import { redeemVoucher } from '@/lib/truewallet'
import {
  checkIdempotency,
  storeIdempotency,
  checkRateLimit,
  logAuditEvent,
  isVoucherUsed,
  validatePlan,
  getIdempotencyKey,
} from '@/lib/security'
import { redeemVoucherAndPurchasePlanAtomic } from '@/lib/payment-security'

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
    const { voucherLink, planId } = body

    if (!voucherLink) {
      return NextResponse.json(
        { error: 'Please provide the gift envelope link' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Extract voucher code
    const voucherCode = voucherLink.replace('https://gift.truemoney.com/campaign/?v=', '')

    // Check if voucher already used (before redeeming)
    const voucherUsed = await isVoucherUsed(voucherCode)
    if (voucherUsed) {
      return NextResponse.json(
        { error: 'Voucher already used' },
        { status: 400 }
      )
    }

    // Validate plan if provided
    if (planId) {
      const planValidation = await validatePlan(planId)
      if (!planValidation.valid) {
        return NextResponse.json(
          { error: planValidation.error || 'Invalid plan' },
          { status: 400 }
        )
      }
    }

    // ดึงเบอร์วอเลทจาก settings
    const { data: settingData, error: settingError } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'truewallet_phone')
      .single()

    if (settingError || !settingData || !settingData.value) {
      return NextResponse.json(
        { error: 'TrueWallet phone number is not configured. Please contact administrator' },
        { status: 400 }
      )
    }

    const truewalletPhone = settingData.value

    // Get old user state for audit log
    const { data: oldUserState } = await supabase
      .from('users')
      .select('balance, plan_id, plan_expires_at')
      .eq('id', user.id)
      .single()

    // เรียก API แลกซอง
    const result = await redeemVoucher(truewalletPhone, voucherLink)

    if (result.status === 'SUCCESS') {
      const amount = result.amount || 0

      if (amount <= 0) {
        await supabase.from('payment_history').insert({
          user_id: user.id,
          plan_id: planId || null,
          amount: 0,
          voucher_code: voucherCode,
          status: 'FAILED',
          reason: 'Invalid voucher amount',
          created_at: new Date().toISOString(),
        })

        return NextResponse.json(
          { error: 'Invalid voucher amount' },
          { status: 400 }
        )
      }

      // Use atomic function to prevent race conditions
      const purchaseResult = await redeemVoucherAndPurchasePlanAtomic(
        user.id,
        voucherCode,
        planId || null,
        amount
      )

      if (!purchaseResult.success) {
        // Log failed payment
        await supabase.from('payment_history').insert({
          user_id: user.id,
          plan_id: planId || null,
          amount: amount,
          voucher_code: voucherCode,
          status: 'FAILED',
          reason: purchaseResult.error || 'Payment processing failed',
          created_at: new Date().toISOString(),
        })

        const response = {
          success: false,
          error: purchaseResult.error || 'Payment processing failed',
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
        'PAYMENT_TOPUP',
        'payment',
        null,
        oldUserState,
        newUserState,
        request
      )

      const response = {
        success: purchaseResult.data?.excessAmount === undefined || purchaseResult.data.excessAmount === 0,
        amount: amount,
        balance: purchaseResult.data?.balance || 0,
        message:
          purchaseResult.data?.excessAmount && purchaseResult.data.excessAmount > 0
            ? `Payment successful! Plan activated. Excess amount added to balance: ฿${purchaseResult.data.excessAmount.toFixed(2)}. Your balance: ฿${purchaseResult.data.balance.toFixed(2)}`
            : purchaseResult.data?.excessAmount === undefined
              ? `Amount added to balance. Your balance: ฿${purchaseResult.data.balance.toFixed(2)}`
              : `Payment successful! Plan activated.`,
      }

      await storeIdempotency(idempotencyKey, response)
      return NextResponse.json(response)
    } else {
      // บันทึกประวัติการล้มเหลว
      await supabase.from('payment_history').insert({
        user_id: user.id,
        plan_id: planId || null,
        amount: 0,
        voucher_code: voucherCode,
        status: 'FAILED',
        reason: result.reason || 'Voucher redemption failed',
        created_at: new Date().toISOString(),
      })

      const response = {
        success: false,
        message: result.reason || 'Payment processing failed',
      }

      await storeIdempotency(idempotencyKey, response)
      return NextResponse.json(response, { status: 400 })
    }
  } catch (error: any) {
    console.error('Payment topup error:', error)
    return NextResponse.json(
      { error: 'System error occurred. Please try again' },
      { status: 500 }
    )
  }
}

