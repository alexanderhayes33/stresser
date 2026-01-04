import { NextResponse } from 'next/server'

export async function GET() {
  // Return server time in ISO format
  return NextResponse.json({ 
    serverTime: new Date().toISOString(),
    timestamp: Date.now()
  })
}

