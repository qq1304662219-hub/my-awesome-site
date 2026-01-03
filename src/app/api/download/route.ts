import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { extractPathFromUrl } from '@/lib/storage-utils'
import archiver from 'archiver'
import { PassThrough, Readable } from 'stream'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('id')

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch video info
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .single()

  if (error || !video) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  // Check permissions
  let hasAccess = false
  if (video.user_id === user.id) {
    hasAccess = true
  } else {
    // Check purchase
    const { data: purchase } = await supabase
        .from('order_items')
        .select('orders!inner(user_id, status)')
        .eq('video_id', videoId)
        .eq('orders.user_id', user.id)
        .eq('orders.status', 'completed')
        .limit(1)
        .maybeSingle()
    
    if (purchase) hasAccess = true
  }

  // Also check if video is free (price 0)
  if (video.price === 0) hasAccess = true

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get file path
  const bucketName = 'uploads' // Assuming 'uploads' bucket
  const filePath = extractPathFromUrl(video.url, bucketName)

  if (!filePath) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 500 })
  }

  // Get Signed URL
  const { data: signedData, error: signedError } = await supabase
    .storage
    .from(bucketName)
    .createSignedUrl(filePath, 60) // 60 seconds validity

  if (signedError || !signedData) {
    return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
  }

  // Fetch the file content
  const fileResponse = await fetch(signedData.signedUrl)
  if (!fileResponse.ok || !fileResponse.body) {
     return NextResponse.json({ error: 'Failed to fetch file content' }, { status: 500 })
  }

  // Create Zip
  const archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  const stream = new PassThrough();
  archive.pipe(stream);

  // Convert Web Stream to Node Readable for archiver
  // @ts-ignore
  const nodeStream = Readable.fromWeb(fileResponse.body);

  // Append file
  // Sanitize filename
  const safeTitle = video.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_ ]/g, '_').trim() || 'video';
  const extension = video.url.split('.').pop() || 'mp4';
  
  archive.append(nodeStream, { name: `${safeTitle}.${extension}` });
  
  // Append License/Readme
  archive.append(
`感谢您下载本视频！

视频标题: ${video.title}
下载时间: ${new Date().toLocaleString()}
授权类型: ${video.price > 0 ? '付费授权' : '免费使用'}

本视频由 AI Video Platform 提供。
`, { name: 'LICENSE.txt' });

  archive.finalize();

  // Return the stream
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(safeTitle)}.zip"`,
    },
  })
}
