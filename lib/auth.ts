import { createClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export interface User {
  id: number
  username: string
  email?: string
  role: string
  is_admin: boolean
  is_active: boolean
  points: number
}

export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function getUserByUsername(username: string): Promise<(User & { password_hash: string }) | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, username, email, role, is_admin, is_active, points, password_hash')
    .eq('username', username)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  return {
    id: data.id,
    username: data.username,
    email: data.email || undefined,
    role: data.role,
    is_admin: data.is_admin,
    is_active: data.is_active,
    points: Number(data.points),
    password_hash: data.password_hash,
  }
}

export async function createUser(
  username: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const supabase = await createClient()

  // Check if username already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (existingUser) {
    return { user: null, error: 'Username already exists' }
  }

  const password_hash = await hashPassword(password)

  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash,
      role: 'user',
      is_admin: false,
      is_active: true,
      points: 0,
    })
    .select('id, username, email, role, is_admin, is_active, points')
    .single()

  if (error) {
    return { user: null, error: error.message }
  }

  return {
    user: {
      id: data.id,
      username: data.username,
      email: data.email || undefined,
      role: data.role,
      is_admin: data.is_admin,
      is_active: data.is_active,
      points: Number(data.points),
    },
    error: null,
  }
}

