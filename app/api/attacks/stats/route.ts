import { NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get total attacks count
    const { count: totalAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get active attacks count
    const { count: activeAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'running')

    // Get success rate based on completed vs failed (same as public stats)
    const { count: completedAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed')

    const { count: failedAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'failed')

    const totalCompleted = completedAttacks || 0
    const totalFailed = failedAttacks || 0
    const totalFinished = totalCompleted + totalFailed

    const successRate =
      totalFinished > 0
        ? parseFloat(((totalCompleted / totalFinished) * 100).toFixed(1))
        : 0

    return NextResponse.json({
      totalAttacks: totalAttacks || 0,
      activeAttacks: activeAttacks || 0,
      successRate,
      completedAttacks: totalCompleted,
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

