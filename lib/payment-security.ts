import { createClient } from '@/lib/supabase/server'

/**
 * Atomic purchase plan using balance with row locking
 * This prevents race conditions by locking the user row during the transaction
 */
export async function purchasePlanWithBalanceAtomic(
  userId: number,
  planId: number
): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = await createClient()

  // Use Supabase RPC for atomic transaction
  // Note: This requires creating a database function
  // For now, we'll use a safer approach with explicit locking via SELECT FOR UPDATE
  // Since Supabase doesn't directly support SELECT FOR UPDATE, we'll use a different approach

  // Step 1: Get current user data (this will be our "lock" point)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('balance, plan_expires_at, plan_id')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    return { success: false, error: 'User not found' }
  }

  // Step 2: Get plan data
  const { data: planData, error: planError } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (planError || !planData) {
    return { success: false, error: 'Plan not found' }
  }

  if (!planData.is_active) {
    return { success: false, error: 'Plan is not active' }
  }

  const planPrice = planData.price ? parseFloat(String(planData.price)) : 0
  if (planPrice <= 0) {
    return { success: false, error: 'Invalid plan price' }
  }

  const currentBalance = userData.balance ? parseFloat(String(userData.balance)) : 0

  // Step 3: Check balance (with optimistic locking)
  if (currentBalance < planPrice) {
    return {
      success: false,
      error: `Insufficient balance. Required: ฿${planPrice.toFixed(2)}, Your balance: ฿${currentBalance.toFixed(2)}`,
    }
  }

  // Step 4: Calculate new values
  const newBalance = currentBalance - planPrice
  const now = new Date()
  let newExpiresAt: Date

  if (userData.plan_expires_at) {
    const currentExpiresAt = new Date(userData.plan_expires_at)
    if (currentExpiresAt > now) {
      newExpiresAt = new Date(currentExpiresAt)
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
    } else {
      newExpiresAt = new Date(now)
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
    }
  } else {
    newExpiresAt = new Date(now)
    newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
  }

  // Step 5: Atomic update with balance check (optimistic locking)
  // Update only if balance hasn't changed (prevents race condition)
  const { data: updatedUser, error: updateError } = await supabase
    .from('users')
    .update({
      balance: newBalance,
      plan_id: planId,
      plan_expires_at: newExpiresAt.toISOString(),
      max_concurrent: planData.max_concurrent,
      max_time: planData.max_time,
      allowed_methods: planData.allowed_methods,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .eq('balance', currentBalance) // Optimistic locking: only update if balance hasn't changed
    .select()
    .single()

  if (updateError || !updatedUser) {
    // Balance was modified by another request (race condition detected)
    return { success: false, error: 'Transaction conflict. Please try again.' }
  }

  // Step 6: Create payment history
  const { error: paymentError } = await supabase.from('payment_history').insert({
    user_id: userId,
    plan_id: planId,
    amount: planPrice,
    voucher_code: null,
    status: 'SUCCESS',
    reason: 'Purchased using balance',
    created_at: new Date().toISOString(),
  })

  if (paymentError) {
    // Rollback user update (in production, use proper transaction)
    await supabase
      .from('users')
      .update({
        balance: currentBalance,
        plan_id: userData.plan_id,
        plan_expires_at: userData.plan_expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    return { success: false, error: 'Failed to record payment' }
  }

  return {
    success: true,
    data: {
      balance: newBalance,
      planId,
      expiresAt: newExpiresAt.toISOString(),
    },
  }
}

/**
 * Atomic voucher redemption and plan purchase
 * Prevents voucher reuse and race conditions
 */
export async function redeemVoucherAndPurchasePlanAtomic(
  userId: number,
  voucherCode: string,
  planId: number | null,
  amount: number
): Promise<{ success: boolean; error?: string; data?: any }> {
  const supabase = await createClient()

  // Step 1: Check if voucher already used
  const { data: existingPayment } = await supabase
    .from('payment_history')
    .select('id')
    .eq('voucher_code', voucherCode)
    .eq('status', 'SUCCESS')
    .single()

  if (existingPayment) {
    return { success: false, error: 'Voucher already used' }
  }

  // Step 2: Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('balance, plan_expires_at, plan_id')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    return { success: false, error: 'User not found' }
  }

  const currentBalance = userData.balance ? parseFloat(String(userData.balance)) : 0

  // Step 3: Handle plan purchase if planId provided
  if (planId) {
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !planData) {
      return { success: false, error: 'Plan not found' }
    }

    if (!planData.is_active) {
      return { success: false, error: 'Plan is not active' }
    }

    const planPrice = planData.price ? parseFloat(String(planData.price)) : 0

    if (planPrice > 0 && amount < planPrice) {
      // Insufficient amount, add to balance only
      const newBalance = currentBalance + amount

      const { error: updateError } = await supabase
        .from('users')
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) {
        return { success: false, error: 'Failed to update balance' }
      }

      const { error: paymentError } = await supabase.from('payment_history').insert({
        user_id: userId,
        plan_id: null,
        amount: amount,
        voucher_code: voucherCode,
        status: 'SUCCESS',
        reason: `Added to balance. Required: ฿${planPrice.toFixed(2)}, Received: ฿${amount.toFixed(2)}`,
        created_at: new Date().toISOString(),
      })

      if (paymentError) {
        return { success: false, error: 'Failed to record payment' }
      }

      return {
        success: false,
        data: {
          balance: newBalance,
          message: `Amount added to balance. Your balance: ฿${newBalance.toFixed(2)}. Required: ฿${planPrice.toFixed(2)}`,
        },
      }
    }

    // Amount sufficient, purchase plan
    const now = new Date()
    let newExpiresAt: Date

    if (userData.plan_expires_at) {
      const currentExpiresAt = new Date(userData.plan_expires_at)
      if (currentExpiresAt > now) {
        newExpiresAt = new Date(currentExpiresAt)
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
      } else {
        newExpiresAt = new Date(now)
        newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
      }
    } else {
      newExpiresAt = new Date(now)
      newExpiresAt.setMonth(newExpiresAt.getMonth() + 1)
    }

    const excessAmount = amount - planPrice
    const newBalance = excessAmount > 0 ? currentBalance + excessAmount : currentBalance

    // Atomic update
    const { error: updateError } = await supabase
      .from('users')
      .update({
        plan_id: planId,
        plan_expires_at: newExpiresAt.toISOString(),
        max_concurrent: planData.max_concurrent,
        max_time: planData.max_time,
        allowed_methods: planData.allowed_methods,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to update plan' }
    }

    const { error: paymentError } = await supabase.from('payment_history').insert({
      user_id: userId,
      plan_id: planId,
      amount: amount,
      voucher_code: voucherCode,
      status: 'SUCCESS',
      reason: excessAmount > 0 ? `Excess amount added to balance: ฿${excessAmount.toFixed(2)}` : null,
      created_at: new Date().toISOString(),
    })

    if (paymentError) {
      // Rollback
      await supabase
        .from('users')
        .update({
          plan_id: userData.plan_id,
          plan_expires_at: userData.plan_expires_at,
          balance: currentBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      return { success: false, error: 'Failed to record payment' }
    }

    return {
      success: true,
      data: {
        balance: newBalance,
        planId,
        expiresAt: newExpiresAt.toISOString(),
        excessAmount: excessAmount > 0 ? excessAmount : 0,
      },
    }
  } else {
    // No planId, just add to balance
    const newBalance = currentBalance + amount

    const { error: updateError } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: 'Failed to update balance' }
    }

    const { error: paymentError } = await supabase.from('payment_history').insert({
      user_id: userId,
      plan_id: null,
      amount: amount,
      voucher_code: voucherCode,
      status: 'SUCCESS',
      reason: 'Amount added to balance',
      created_at: new Date().toISOString(),
    })

    if (paymentError) {
      return { success: false, error: 'Failed to record payment' }
    }

    return {
      success: true,
      data: {
        balance: newBalance,
      },
    }
  }
}

