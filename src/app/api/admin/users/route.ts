import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const query = searchParams.get('query') || ''
  
  // Check auth
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch users (profiles)
  // Note: We are fetching from 'profiles' table which mirrors users
  let dbQuery = supabase
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
}
