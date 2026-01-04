import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/get-user'

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    const supabase = await createClient()
    
    // Get all active methods
    const { data: allMethods, error } = await supabase
      .from('attack_methods')
      .select('id, name, display_name, description, category')
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // If user is not logged in, return all methods (for public access)
    if (!user) {
      return NextResponse.json({ methods: allMethods || [] })
    }

    // Get user's allowed methods
    const { data: userData } = await supabase
      .from('users')
      .select('allowed_methods')
      .eq('id', user.id)
      .single()

    const allowedMethods = userData?.allowed_methods || []
    
    // If allowed_methods is empty array, user can access all methods
    // Otherwise, filter methods based on allowed_methods
    let methods = allMethods || []
    if (Array.isArray(allowedMethods) && allowedMethods.length > 0) {
      methods = methods.filter((method) => allowedMethods.includes(method.name))
    }

    return NextResponse.json({ methods })
  } catch (error) {
    console.error('Get methods error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

