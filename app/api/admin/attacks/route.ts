import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const userId = searchParams.get('user_id')
    const target = searchParams.get('target')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()
    
    // Build count query
    let countQuery = supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    if (target) {
      countQuery = countQuery.or(`target_url.ilike.%${target}%,host.ilike.%${target}%`)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 })
    }

    // Build data query
    let query = supabase
      .from('attacks')
      .select(`
        *,
        users:user_id (
          id,
          username,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (target) {
      query = query.or(`target_url.ilike.%${target}%,host.ilike.%${target}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      attacks: data || [],
      total: count || 0
    })
  } catch (error) {
    console.error('Get attacks error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { user_id, host, port, method, time, status } = body

    if (!user_id || !host || !port || !method || !time) {
      return NextResponse.json(
        { error: 'user_id, host, port, method, and time are required' },
        { status: 400 }
      )
    }

    const portNum = parseInt(port.toString())
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { error: 'port must be between 1 and 65535' },
        { status: 400 }
      )
    }

    const timeNum = parseInt(time.toString())
    if (isNaN(timeNum) || timeNum <= 0) {
      return NextResponse.json(
        { error: 'time must be greater than 0' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('attacks')
      .insert({
        user_id,
        host: host.trim(),
        port: portNum,
        method: method.trim(),
        time: timeNum,
        target_url: `${host.trim()}:${portNum}`,
        duration_seconds: timeNum,
        threads: 1,
        status: status || 'pending',
      })
      .select(`
        *,
        users:user_id (
          id,
          username,
          email
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ attack: data })
  } catch (error) {
    console.error('Create attack error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

