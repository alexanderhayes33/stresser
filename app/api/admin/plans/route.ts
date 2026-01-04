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
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true, nullsFirst: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ plans: data || [] })
  } catch (error) {
    console.error('Get plans error:', error)
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
    const { name, description, max_concurrent, max_time, allowed_methods, price, cooldown, is_active, is_popular } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('plans')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        max_concurrent: max_concurrent || null,
        max_time: max_time || null,
        allowed_methods: allowed_methods || null,
        price: price || null,
        cooldown: cooldown !== undefined ? cooldown : 0,
        is_active: is_active !== undefined ? is_active : true,
        is_popular: is_popular !== undefined ? is_popular : false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ plan: data })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

