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
      .from('settings')
      .select('*')
      .order('key', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Convert array to object for easier access
    const settingsObj: Record<string, string> = {}
    data?.forEach((setting) => {
      settingsObj[setting.key] = setting.value || ''
    })

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: String(value || ''),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })

      if (error) {
        console.error(`Error updating setting ${key}:`, error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

