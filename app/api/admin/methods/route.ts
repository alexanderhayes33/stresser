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
      .from('attack_methods')
      .select('*')
      .order('display_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ methods: data || [] })
  } catch (error) {
    console.error('Get methods error:', error)
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
    const { name, display_name, description, is_active, api_url_format, category } = body

    if (!name || !display_name) {
      return NextResponse.json(
        { error: 'name and display_name are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if name already exists
    const { data: existingMethod } = await supabase
      .from('attack_methods')
      .select('id')
      .eq('name', name.toLowerCase().trim())
      .single()

    if (existingMethod) {
      return NextResponse.json(
        { error: 'Method name already exists' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('attack_methods')
      .insert({
        name: name.toLowerCase().trim(),
        display_name: display_name.trim(),
        description: description?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
        api_url_format: api_url_format?.trim() || null,
        category: category || 'L4',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ method: data })
  } catch (error) {
    console.error('Create method error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

