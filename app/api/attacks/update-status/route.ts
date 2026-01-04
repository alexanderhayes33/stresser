import { NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const now = new Date()

    // Find running attacks that should be completed
    const { data: runningAttacks, error: fetchError } = await supabase
      .from('attacks')
      .select('id, started_at, time, status')
      .eq('user_id', user.id)
      .eq('status', 'running')

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    if (!runningAttacks || runningAttacks.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

    let updatedCount = 0

    for (const attack of runningAttacks) {
      if (attack.started_at) {
        const started = new Date(attack.started_at).getTime()
        const elapsed = Math.floor((now.getTime() - started) / 1000)
        
        if (elapsed >= attack.time) {
          // Time expired, mark as completed
          await supabase
            .from('attacks')
            .update({
              status: 'completed',
              completed_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', attack.id)
          
          updatedCount++
        }
      }
    }

    return NextResponse.json({ updated: updatedCount })
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

