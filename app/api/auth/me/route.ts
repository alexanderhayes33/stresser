import { NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'

export async function GET() {
  try {
    const user = await getUser()
    
    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}

