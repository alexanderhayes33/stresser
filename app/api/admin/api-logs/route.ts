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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const endpoint = searchParams.get('endpoint')
    const method = searchParams.get('method')
    const userId = searchParams.get('user_id')

    let query = supabase
      .from('api_logs')
      .select('*, users:user_id(username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (endpoint) {
      query = query.ilike('endpoint', `%${endpoint}%`)
    }

    if (method) {
      query = query.eq('method', method.toUpperCase())
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0
    })
  } catch (error) {
    console.error('Get API logs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

