import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = await createClient()
    
    // Build count query
    let countQuery = supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (role) {
      countQuery = countQuery.eq('role', role)
    }

    if (isActive !== null) {
      countQuery = countQuery.eq('is_active', isActive === 'true')
    }

    if (search) {
      // Try to parse as number for ID search
      const searchNum = parseInt(search)
      if (!isNaN(searchNum)) {
        countQuery = countQuery.or(`id.eq.${searchNum},username.ilike.%${search}%,email.ilike.%${search}%`)
      } else {
        countQuery = countQuery.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
      }
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 400 })
    }

    // Build data query
    let query = supabase
      .from('users')
      .select(`
        id, 
        username, 
        email, 
        role, 
        is_admin, 
        is_active, 
        points, 
        balance,
        plan_id,
        created_at, 
        updated_at,
        plans:plan_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role) {
      query = query.eq('role', role)
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    if (search) {
      // Try to parse as number for ID search
      const searchNum = parseInt(search)
      if (!isNaN(searchNum)) {
        query = query.or(`id.eq.${searchNum},username.ilike.%${search}%,email.ilike.%${search}%`)
      } else {
        query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`)
      }
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      users: data || [],
      total: count || 0
    })
  } catch (error) {
    console.error('Get users error:', error)
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
    const { username, password, email, role, is_admin, is_active, points, allowed_methods, max_time, max_concurrent } = body

    if (!username || !password) {
      return NextResponse.json(
        { error: 'username and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      )
    }

    const password_hash = await hashPassword(password)

    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash,
        email: email || null,
        role: role || 'user',
        is_admin: is_admin || false,
        is_active: is_active !== undefined ? is_active : true,
        points: points || 0,
        allowed_methods: allowed_methods || null,
        max_time: max_time || null,
        max_concurrent: max_concurrent || null,
      })
      .select('id, username, email, role, is_admin, is_active, points, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

