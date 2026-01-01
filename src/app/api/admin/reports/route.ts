import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseServiceKey) {
        console.error("Missing SUPABASE_SERVICE_ROLE_KEY")
        return NextResponse.json({ error: 'Server configuration error: Missing Service Role Key' }, { status: 500 })
    }

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

    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch Reports
    const { data, error } = await supabaseAdmin
        .from("reports")
        .select(`
            *,
            profiles:reporter_id (full_name, email),
            videos:video_id (title, id),
            comments:comment_id (content, id, video_id)
        `)
        .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json({ reports: data })
  } catch (error: any) {
    console.error("Admin Reports API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
