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
    const { voucherLink } = body

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
          plan_id: null,
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

      // Add amount to balance only (no plan purchase)
      const currentBalance = oldUserState?.balance ? parseFloat(String(oldUserState.balance)) : 0
      const newBalance = currentBalance + amount

      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        await supabase.from('payment_history').insert({
          user_id: user.id,
          plan_id: null,
          amount: amount,
          voucher_code: voucherCode,
          status: 'FAILED',
          reason: 'Failed to update balance',
          created_at: new Date().toISOString(),
        })

        const response = {
          success: false,
          error: 'Failed to update balance',
        }

        await storeIdempotency(idempotencyKey, response)
        return NextResponse.json(response, { status: 400 })
      }

      // Record payment history
      const { error: paymentError } = await supabase.from('payment_history').insert({
        user_id: user.id,
        plan_id: null,
        amount: amount,
        voucher_code: voucherCode,
        status: 'SUCCESS',
        reason: 'Amount added to balance',
        created_at: new Date().toISOString(),
      })

      if (paymentError) {
        // Rollback balance update
        await supabase
          .from('users')
          .update({
            balance: currentBalance,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        const response = {
          success: false,
          error: 'Failed to record payment',
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
        success: true,
        amount: amount,
        balance: newBalance,
        message: `Amount added to balance. Your balance: ฿${newBalance.toFixed(2)}`,
      }

      await storeIdempotency(idempotencyKey, response)
      return NextResponse.json(response)
    } else {
      // บันทึกประวัติการล้มเหลว
      await supabase.from('payment_history').insert({
        user_id: user.id,
        plan_id: null,
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

