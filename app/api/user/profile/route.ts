import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // ดึงข้อมูล user พร้อม plan
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        plans:plan_id (
          id,
          name,
          description,
          max_concurrent,
          max_time,
          allowed_methods,
          price,
          cooldown
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ดึงประวัติการชำระเงินล่าสุด พร้อม plan name
    const { data: paymentHistory } = await supabase
      .from('payment_history')
      .select(`
        *,
        plans:plan_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // ดึงจำนวน concurrent attacks ที่กำลังรัน
    const { data: runningAttacks } = await supabase
      .from('attacks')
      .select('concurrent_count')
      .eq('user_id', user.id)
      .in('status', ['running', 'pending'])

    const currentConcurrent = runningAttacks?.reduce((sum, attack) => sum + (attack.concurrent_count || 0), 0) || 0

    return NextResponse.json({
      user: {
        ...userData,
        plan: userData.plans || null,
        balance: userData.balance || 0,
      },
      paymentHistory: paymentHistory || [],
      currentConcurrent,
    })
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, first_name, last_name, phone, address, date_of_birth, avatar_url } = body

    const supabase = await createClient()

    const updateData: {
      email?: string | null
      first_name?: string | null
      last_name?: string | null
      phone?: string | null
      address?: string | null
      date_of_birth?: string | null
      avatar_url?: string | null
      updated_at?: string
    } = {}

    if (email !== undefined) updateData.email = email || null
    if (first_name !== undefined) updateData.first_name = first_name || null
    if (last_name !== undefined) updateData.last_name = last_name || null
    if (phone !== undefined) updateData.phone = phone || null
    if (address !== undefined) updateData.address = address || null
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url || null
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

