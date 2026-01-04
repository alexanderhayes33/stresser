import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get global concurrent limits for L4 and L7
    const { data: globalLimitSettings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['global_concurrent_limit_l4', 'global_concurrent_limit_l7'])

    const globalLimitL4 = globalLimitSettings?.find(s => s.key === 'global_concurrent_limit_l4')?.value
      ? parseInt(globalLimitSettings.find(s => s.key === 'global_concurrent_limit_l4')!.value)
      : null
    const globalLimitL7 = globalLimitSettings?.find(s => s.key === 'global_concurrent_limit_l7')?.value
      ? parseInt(globalLimitSettings.find(s => s.key === 'global_concurrent_limit_l7')!.value)
      : null

    // Get all running/pending attacks
    const { data: allRunningAttacks, error: globalError } = await supabase
      .from('attacks')
      .select('concurrent_count, method')
      .in('status', ['running', 'pending'])

    if (globalError) {
      return NextResponse.json(
        { error: 'Failed to check global concurrent limit' },
        { status: 400 }
      )
    }

    // Get all method categories
    const { data: allMethods, error: methodsError } = await supabase
      .from('attack_methods')
      .select('name, category')

    if (methodsError) {
      return NextResponse.json(
        { error: 'Failed to check global concurrent limit' },
        { status: 400 }
      )
    }

    // Create a map of method name to category
    const methodCategoryMap = new Map<string, string>()
    allMethods?.forEach((m: any) => {
      methodCategoryMap.set(m.name, m.category || 'L4')
    })

    // Count concurrent by category
    const l4Attacks = allRunningAttacks?.filter((attack: any) => {
      const attackCategory = methodCategoryMap.get(attack.method) || 'L4'
      return attackCategory === 'L4'
    }) || []
    const l7Attacks = allRunningAttacks?.filter((attack: any) => {
      const attackCategory = methodCategoryMap.get(attack.method) || 'L4'
      return attackCategory === 'L7'
    }) || []

    const globalCurrentL4 = l4Attacks.reduce((sum: number, attack: any) => {
      return sum + (attack.concurrent_count || 1)
    }, 0)
    const globalCurrentL7 = l7Attacks.reduce((sum: number, attack: any) => {
      return sum + (attack.concurrent_count || 1)
    }, 0)

    const availableSlotsL4 = globalLimitL4 !== null && globalLimitL4 > 0
      ? Math.max(0, globalLimitL4 - globalCurrentL4)
      : null
    const availableSlotsL7 = globalLimitL7 !== null && globalLimitL7 > 0
      ? Math.max(0, globalLimitL7 - globalCurrentL7)
      : null

    return NextResponse.json({
      l4: {
        global_limit: globalLimitL4,
        global_used: globalCurrentL4,
        available_slots: availableSlotsL4,
        has_limit: globalLimitL4 !== null && globalLimitL4 > 0
      },
      l7: {
        global_limit: globalLimitL7,
        global_used: globalCurrentL7,
        available_slots: availableSlotsL7,
        has_limit: globalLimitL7 !== null && globalLimitL7 > 0
      }
    })
  } catch (error) {
    console.error('Get slots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

