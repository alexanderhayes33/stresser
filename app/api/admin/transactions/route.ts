import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    // Build count query
    let countQuery = supabase
      .from('payment_history')
      .select('*', { count: 'exact', head: true })

    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting transactions:', countError)
      return NextResponse.json(
        { error: 'Failed to count transactions' },
        { status: 500 }
      )
    }

    // Build data query
    let query = supabase
      .from('payment_history')
      .select(`
        *,
        users:user_id (
          id,
          username
        ),
        plans:plan_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // ถ้ามี userId ให้ filter
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // ถ้ามี status ให้ filter
    if (status) {
      query = query.eq('status', status)
    }

    const { data: transactions, error } = await query

    if (error) {
      console.error('Error fetching transactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      transactions: transactions || [],
      total: count || 0,
    })
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

