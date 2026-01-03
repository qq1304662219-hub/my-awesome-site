import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const { userId } = await req.json(); // Or get from auth header

    if (!videoId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Check if user is owner
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('user_id, original_url, price')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    let canDownload = false;

    if (video.user_id === userId) {
      canDownload = true;
    } else if (video.price === 0) {
       canDownload = true; // Free video
    } else {
      // 2. Check Purchase Status
      const { data: purchase } = await supabaseAdmin
        .from('order_items')
        .select('orders!inner(user_id, status)')
        .eq('video_id', videoId)
        .eq('orders.user_id', userId)
        .eq('orders.status', 'completed')
        .limit(1)
        .maybeSingle();

      if (purchase) canDownload = true;
    }

    if (!canDownload) {
      return NextResponse.json({ error: 'Unauthorized: Purchase required' }, { status: 403 });
    }

    // 3. Generate Signed URL for Original File
    if (!video.original_url) {
        return NextResponse.json({ error: 'Original file not found' }, { status: 404 });
    }

    const { data, error: signError } = await supabaseAdmin
      .storage
      .from('raw_videos')
      .createSignedUrl(video.original_url, 300); // 5 minutes validity

    if (signError) {
      throw new Error(`Failed to generate signed URL: ${signError.message}`);
    }

    return NextResponse.json({ 
        downloadUrl: data.signedUrl,
        expiresIn: 300 
    });

  } catch (error: any) {
    console.error('Download API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
