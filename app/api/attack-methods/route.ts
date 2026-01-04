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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Sort methods: L4 first, then L7, and within each category sort by display_name
    const sortedMethods = (allMethods || []).sort((a, b) => {
      // First sort by category (L4 before L7)
      const categoryOrder = { 'L4': 1, 'L7': 2 }
      const categoryA = categoryOrder[a.category as keyof typeof categoryOrder] || 999
      const categoryB = categoryOrder[b.category as keyof typeof categoryOrder] || 999
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB
      }
      
      // Within same category, sort by display_name
      return (a.display_name || '').localeCompare(b.display_name || '')
    })

    // If user is not logged in, return all methods (for public access)
    if (!user) {
      return NextResponse.json({ methods: sortedMethods })
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
    let methods = sortedMethods
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

