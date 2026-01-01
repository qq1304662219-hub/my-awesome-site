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

    // Verify Admin via Session (using normal client to check session, then admin client for data)
    // Or just check session token with admin client.
    const authHeader = request.headers.get('Authorization')
    // Note: The frontend might not send Authorization header for fetch if not configured.
    // But we can use the cookie.
    
    // Alternative: Use createServerClient for Auth check, then admin for Data.
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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role using Admin Client (to be safe in case profiles RLS blocks self-read of role?)
    // Actually, users can usually read their own role. But let's use admin client for robustness.
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const query = searchParams.get('query') || ''
    
    // Fetch users (profiles) using Admin Client
    let dbQuery = supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact' })
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false })

    if (query) {
      dbQuery = dbQuery.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
    }

    const { data, error, count } = await dbQuery

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      users: data,
      total: count,
      page,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error: any) {
    console.error("Admin Users API Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
