import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/get-user'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('attacks')
      .select(`
        *,
        users:user_id (
          id,
          username,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Attack not found' }, { status: 404 })
    }

    return NextResponse.json({ attack: data })
  } catch (error) {
    console.error('Get attack error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { host, port, method, time, status, success_count, failed_count, total_requests } = body

    const supabase = await createClient()
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (host !== undefined) {
      updateData.host = host
      updateData.target_url = `${host}:${port || ''}`
    }
    if (port !== undefined) {
      updateData.port = port
      updateData.target_url = `${host || ''}:${port}`
    }
    if (method !== undefined) updateData.method = method
    if (time !== undefined) {
      updateData.time = time
      updateData.duration_seconds = time
    }
    if (status !== undefined) updateData.status = status
    if (success_count !== undefined) updateData.success_count = success_count
    if (failed_count !== undefined) updateData.failed_count = failed_count
    if (total_requests !== undefined) updateData.total_requests = total_requests

    const { data, error } = await supabase
      .from('attacks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users:user_id (
          id,
          username,
          email
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ attack: data })
  } catch (error) {
    console.error('Update attack error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser()
    if (!user || !user.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = await createClient()
    const { error } = await supabase
      .from('attacks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete attack error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

