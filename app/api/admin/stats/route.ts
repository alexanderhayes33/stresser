import { NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // Get total attacks count
    const { count: totalAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })

    // Get active attacks count
    const { count: activeAttacks } = await supabase
      .from('attacks')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'running')

    // Get success rate
    const { data: allAttacks } = await supabase
      .from('attacks')
      .select('success_count, failed_count, total_requests')
      .in('status', ['completed', 'failed'])

    let totalSuccess = 0
    let totalFailed = 0
    let totalRequests = 0

    if (allAttacks) {
      allAttacks.forEach((attack) => {
        totalSuccess += attack.success_count || 0
        totalFailed += attack.failed_count || 0
        totalRequests += attack.total_requests || 0
      })
    }

    const successRate =
      totalRequests > 0
        ? parseFloat(((totalSuccess / totalRequests) * 100).toFixed(1))
        : 0

    // Get revenue statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Total revenue (all successful transactions)
    const { data: allTransactions } = await supabase
      .from('payment_history')
      .select('amount')
      .eq('status', 'SUCCESS')

    const totalRevenue = allTransactions?.reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0) || 0

    // Today revenue
    const { data: todayTransactions } = await supabase
      .from('payment_history')
      .select('amount')
      .eq('status', 'SUCCESS')
      .gte('created_at', today.toISOString())

    const todayRevenue = todayTransactions?.reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0) || 0

    // This month revenue
    const { data: monthTransactions } = await supabase
      .from('payment_history')
      .select('amount')
      .eq('status', 'SUCCESS')
      .gte('created_at', thisMonth.toISOString())

    const monthRevenue = monthTransactions?.reduce((sum, t) => sum + parseFloat(String(t.amount || 0)), 0) || 0

    // Get active plans count
    const { count: activePlans } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get total methods count
    const { count: totalMethods } = await supabase
      .from('attack_methods')
      .select('*', { count: 'exact', head: true })

    // Get recent transactions (last 10)
    const { data: recentTransactions } = await supabase
      .from('payment_history')
      .select(`
        *,
        users:user_id (
          id,
          username
        ),
        plans:plan_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent attacks (last 10)
    const { data: recentAttacks } = await supabase
      .from('attacks')
      .select(`
        *,
        users:user_id (
          id,
          username
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get top users by balance
    const { data: topUsersByBalance } = await supabase
      .from('users')
      .select('id, username, balance')
      .order('balance', { ascending: false })
      .limit(5)

    // Get top users by attacks count - use raw SQL for better performance
    const { data: topUsersByAttacksRaw } = await supabase
      .from('attacks')
      .select('user_id, users!inner(id, username)')

    const attackCountMap = new Map<number, { id: number; username: string; count: number }>()
    
    if (topUsersByAttacksRaw) {
      topUsersByAttacksRaw.forEach((attack: any) => {
        const userId = attack.user_id
        const user = attack.users
        if (user) {
          if (!attackCountMap.has(userId)) {
            attackCountMap.set(userId, { id: user.id, username: user.username, count: 0 })
          }
          attackCountMap.get(userId)!.count++
        }
      })
    }

    const userAttackCounts = Array.from(attackCountMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(u => ({ id: u.id, username: u.username, attackCount: u.count }))

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalAttacks: totalAttacks || 0,
      activeAttacks: activeAttacks || 0,
      successRate,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      todayRevenue: parseFloat(todayRevenue.toFixed(2)),
      monthRevenue: parseFloat(monthRevenue.toFixed(2)),
      activePlans: activePlans || 0,
      totalMethods: totalMethods || 0,
      recentTransactions: recentTransactions || [],
      recentAttacks: recentAttacks || [],
      topUsersByBalance: topUsersByBalance || [],
      topUsersByAttacks: userAttackCounts,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

