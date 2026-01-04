import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get active attacks count
    const { count: activeAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'running')

    // Get completed attacks count
    const { count: completedAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    // Get success rate based on completed vs failed
    const { count: failedAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    const totalCompleted = completedAttacks || 0
    const totalFailed = failedAttacks || 0
    const totalFinished = totalCompleted + totalFailed

    const successRate =
      totalFinished > 0
        ? parseFloat(((totalCompleted / totalFinished) * 100).toFixed(1))
        : 0

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeAttacks: activeAttacks || 0,
      successRate,
      completedAttacks: totalCompleted,
    })
  } catch (error) {
    console.error('Public stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

