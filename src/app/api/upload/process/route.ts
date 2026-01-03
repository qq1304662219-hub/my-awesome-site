import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';

// Initialize FFmpeg
// In production (Vercel), you would need to set FFMPEG_PATH to a static binary
// or use a cloud transcoding service.
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';
ffmpeg.setFfmpegPath(FFMPEG_PATH);

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);

// Initialize Supabase Admin Client (Service Role needed for storage operations)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { videoId, filePath, userId } = await req.json();

    if (!videoId || !filePath || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    console.log(`Starting processing for video ${videoId}, path: ${filePath}`);

    // 1. Create temporary directory
    const tempDir = path.join(os.tmpdir(), `video_proc_${Date.now()}`);
    await mkdir(tempDir);

    // 2. Download raw video from Supabase
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('raw_videos')
      .download(filePath);

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`);
    }

    const localInputPath = path.join(tempDir, 'input.mp4');
    const buffer = Buffer.from(await fileData.arrayBuffer());
    await writeFile(localInputPath, buffer);

    // 3. Process Video (480p + Watermark + HLS)
    // Output filename
    const outputFileName = 'index.m3u8';
    const localOutputPath = path.join(tempDir, outputFileName);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(localInputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('854x480') // 480p
        .videoFilters([
          {
            filter: 'drawtext',
            options: {
              text: 'AI Vision Preview', // Watermark text
              fontsize: 24,
              fontcolor: 'white',
              x: 'w-tw-10', // Top right (width - text_width - 10)
              y: '10',      // Top (10px padding)
              box: 1,
              boxcolor: 'black@0.5',
              boxborderw: 5
            }
          }
        ])
        .outputOptions([
          '-hls_time 10',      // 10 second segments
          '-hls_list_size 0',  // Include all segments in playlist
          '-f hls'
        ])
        .output(localOutputPath)
        .on('end', () => {
          console.log('Transcoding finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('Transcoding error:', err);
          reject(err);
        })
        .run();
    });

    // 4. Upload HLS files to public_videos bucket
    // We need to upload .m3u8 and all .ts files
    const files = await readdir(tempDir);
    const hlsFiles = files.filter(f => f.endsWith('.m3u8') || f.endsWith('.ts'));
    
    // Create a folder in the bucket for this video
    const targetFolder = `${userId}/${videoId}`;
    let m3u8PublicUrl = '';

    for (const file of hlsFiles) {
      const fileContent = await readFile(path.join(tempDir, file));
      const targetPath = `${targetFolder}/${file}`;
      
      const { error: uploadError } = await supabaseAdmin
        .storage
        .from('public_videos')
        .upload(targetPath, fileContent, {
          contentType: file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Upload failed for ${file}: ${uploadError.message}`);
      }

      if (file === outputFileName) {
        const { data } = supabaseAdmin.storage.from('public_videos').getPublicUrl(targetPath);
        m3u8PublicUrl = data.publicUrl;
      }
    }

    // 5. Update Database
    const { error: dbError } = await supabaseAdmin
      .from('videos')
      .update({
        url: m3u8PublicUrl,        // Main URL is now the HLS stream
        original_url: filePath,    // Keep reference to raw file
        is_processed: true,
        status: 'published'        // Mark as published once processed
      })
      .eq('id', videoId);

    if (dbError) throw dbError;

    // 6. Cleanup
    // (Optional: remove temp files)
    // For now, we rely on OS cleaning tmp, or we can recursively delete tempDir
    // await rmdir(tempDir, { recursive: true });

    return NextResponse.json({ success: true, url: m3u8PublicUrl });

  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
