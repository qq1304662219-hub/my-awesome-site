import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize Supabase Admin Client for secure operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    // Rate Limit: 10 purchase attempts per minute per IP
    const { success, reset } = await rateLimit(`purchase:${ip}`, 10, 60)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { status: 429, headers: { 'Retry-After': reset.toString() } }
      )
    }

    // 1. Authenticate user
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse body
    const { videoId, price, license } = await request.json()

    if (!videoId || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 3. Perform Purchase Transaction via RPC or direct DB operations
    // Using admin client to bypass RLS for the RPC call if needed, or ensuring the RPC is secure.
    // Ideally, we should check balance here first before calling RPC, but the RPC handles it transactionally.
    // Let's call the RPC.
    
    const { data: orderId, error: rpcError } = await supabaseAdmin.rpc('handle_purchase', {
        p_user_id: user.id,
        p_total_amount: price,
        p_video_ids: [videoId],
        p_prices: [price],
        p_license_types: [license || 'personal']
    });

    if (rpcError) {
        console.error("Purchase RPC error:", rpcError)
        return NextResponse.json({ error: rpcError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, orderId })

  } catch (error: any) {
    console.error('Purchase API error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
