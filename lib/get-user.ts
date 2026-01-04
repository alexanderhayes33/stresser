import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { createClient } from '@/lib/supabase/server'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
)

export interface User {
  id: number
  username: string
  email?: string
  role: string
  is_admin: boolean
  is_active: boolean
  points: number
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, secret)
    const userId = payload.userId as number

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, role, is_admin, is_active, points')
      .eq('id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      username: data.username,
      email: data.email || undefined,
      role: data.role,
      is_admin: data.is_admin,
      is_active: data.is_active,
      points: Number(data.points),
    }
  } catch (error) {
    return null
  }
}

