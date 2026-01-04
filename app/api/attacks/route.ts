import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()
    
    // Build count query
    let countQuery = supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 })
    }

    // Build data query
    let query = supabase
      .from('attacks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
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
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { target_url, method, duration_seconds, threads } = body

    if (!target_url) {
      return NextResponse.json(
        { error: 'target_url is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('attacks')
      .insert({
        user_id: user.id,
        target_url,
        method: method || 'GET',
        duration_seconds: duration_seconds || 60,
        threads: threads || 1,
        status: 'pending',
      })
      .select()
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

