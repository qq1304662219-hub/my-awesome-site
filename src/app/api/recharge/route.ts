import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Rate Limit: 5 requests per minute per IP for recharge
  const { success, reset } = await rateLimit(`recharge:${ip}`, 5, 60)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests', reset },
      { status: 429, headers: { 'Retry-After': reset.toString() } }
    )
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // In Next.js App Router API routes, we can set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle error
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { amount } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // For manual QR code payment, we don't update balance immediately.
    // We create a pending transaction record.
    // If table doesn't support status, we might need to modify it or use a separate table.
    // Assuming 'transactions' table has a 'status' column or we use description to mark it.
    // Since we don't have a 'status' column in standard transaction log usually (it's for history),
    // let's check if we can insert with a specific type that the admin page filters.
    
    // However, to keep it simple and safe:
    // We will insert a record into 'transactions' but with a special type 'recharge_pending' 
    // AND NOT update the balance yet.
    // BUT 'handle_balance_update' RPC likely updates balance AND inserts transaction.
    // So we should NOT use the RPC for pending requests if the RPC updates balance.
    
    // Let's insert directly into transactions table if RLS allows, or use a new RPC.
    // Since we are on server, we can use service role if needed, but here we use user client.
    // User might not have permission to insert into transactions directly depending on RLS.
    // RLS says: "View transactions" for select. No insert policy visible in the migration file for users?
    // Wait, the migration file had:
    // CREATE POLICY "Users create tickets" ...
    // But for transactions?
    // It only had "View transactions".
    // So users probably CANNOT insert into transactions directly.
    
    // We need to use Supabase Admin client to insert the pending request.
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: insertError } = await supabaseAdmin
        .from('transactions')
        .insert({
            user_id: user.id,
            amount: amount,
            type: 'recharge_pending', // Special type for manual verification
            description: `扫码充值待审核: ¥${amount}`,
            created_at: new Date().toISOString()
        })

    if (insertError) {
        console.error('Insert Error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
      console.error('Recharge Error:', err)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
