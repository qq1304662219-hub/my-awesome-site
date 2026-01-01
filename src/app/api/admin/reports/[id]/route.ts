import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Auth Check
  const { createServerClient } = await import('@supabase/ssr')
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() {} 
        }
    }
  )
  const { data: { session } } = await supabaseUser.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { status } = await request.json()
    const { error } = await supabaseAdmin
        .from("reports")
        .update({ status })
        .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

  // Auth Check
  const { createServerClient } = await import('@supabase/ssr')
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            getAll() { return cookieStore.getAll() },
            setAll() {} 
        }
    }
  )
  const { data: { session } } = await supabaseUser.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', session.user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // Logic to delete content based on report type
    // First fetch the report to know what to delete
    const { data: report, error: fetchError } = await supabaseAdmin
        .from("reports")
        .select("*")
        .eq("id", id)
        .single()
    
    if (fetchError || !report) throw new Error("Report not found")

    if (report.video_id) {
        // Delete video and storage
        // 1. Delete files from storage
        // Need to list files in folder video_id/
        const { data: files } = await supabaseAdmin.storage.from('videos').list(report.video_id)
        if (files && files.length > 0) {
            const paths = files.map(f => `${report.video_id}/${f.name}`)
            await supabaseAdmin.storage.from('videos').remove(paths)
        }
        // 2. Delete video record
        await supabaseAdmin.from("videos").delete().eq("id", report.video_id)
    } else if (report.comment_id) {
        // Delete comment
        await supabaseAdmin.from("comments").delete().eq("id", report.comment_id)
    }

    // Auto resolve report
    await supabaseAdmin.from("reports").update({ status: 'resolved' }).eq("id", id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
