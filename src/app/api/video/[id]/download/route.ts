import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getStoragePathFromUrl } from '@/lib/utils'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const cookieStore = await cookies()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Rate Limit: 10 downloads per minute per IP
  const { success, reset } = await rateLimit(`download:${ip}`, 10, 60)
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

  // 1. Check Auth
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // 2. Fetch Video Info
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('url, user_id, title')
    .eq('id', id)
    .single()

  if (videoError || !video) {
    return new NextResponse('Video not found', { status: 404 })
  }

  // 3. Check Permissions (Owner or Purchaser)
  const isOwner = video.user_id === session.user.id
  let hasAccess = isOwner

  if (!hasAccess) {
    // Check if user has purchased the video
    // We query orders that are 'completed' and contain an item with this video_id
    const { data: purchases, error: purchaseError } = await supabase
        .from('orders')
        .select(`
            id,
            status,
            order_items!inner (
                video_id
            )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .eq('order_items.video_id', id)
        .limit(1)

    if (purchases && purchases.length > 0) {
        hasAccess = true
    }
  }

  if (!hasAccess) {
    return new NextResponse('Forbidden: You must purchase this video to download it.', { status: 403 })
  }

  // 4. Generate Signed URL with Download Disposition
  const storagePath = getStoragePathFromUrl(video.url)
  if (!storagePath) {
     return new NextResponse('Invalid video URL', { status: 400 })
  }

  const { data: signedData, error: signError } = await supabase
    .storage
    .from('uploads')
    .createSignedUrl(storagePath, 300, { // 5 minutes validity (reduced from 1 hour)
        download: true 
    })

  if (signError || !signedData) {
      return new NextResponse('Error generating download link', { status: 500 })
  }

  // Redirect to the signed URL
  return NextResponse.redirect(signedData.signedUrl)
}
