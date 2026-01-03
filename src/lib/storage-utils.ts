import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Deletes a video record and its associated files from storage.
 * @param supabase The Supabase client instance
 * @param videoId The ID of the video to delete
 * @param bucketName The storage bucket name (default: 'uploads')
 */
export async function deleteVideoWithStorage(
  supabase: SupabaseClient,
  videoId: string,
  bucketName: string = 'uploads'
) {
  // 1. Fetch video details to get paths
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('url, thumbnail_url')
    .eq('id', videoId)
    .single()

  if (fetchError) {
    // If video doesn't exist, maybe it was already deleted.
    // We can proceed to try deleting files if we had paths, but we don't.
    // So just throw or return.
    throw fetchError
  }

  if (!video) throw new Error('Video not found')

  // 2. Extract paths
  const paths: string[] = []
  
  if (video.url) {
    const videoPath = extractPathFromUrl(video.url, bucketName)
    if (videoPath) paths.push(videoPath)
  }
  
  if (video.thumbnail_url) {
    const thumbPath = extractPathFromUrl(video.thumbnail_url, bucketName)
    if (thumbPath) paths.push(thumbPath)
  }

  // 3. Delete files from storage
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(bucketName)
      .remove(paths)
      
    if (storageError) {
      console.error('Failed to delete files from storage:', storageError)
      // Continue to delete the record
    }
  }

  // 4. Delete from DB
  const { error: deleteError } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId)

  if (deleteError) throw deleteError

  return true
}

/**
 * Extracts the file path from a Supabase Storage public URL.
 * Assumes URL format contains /bucketName/
 */
export function extractPathFromUrl(url: string, bucketName: string): string | null {
  try {
    // Decode URL to handle spaces/special chars
    const decodedUrl = decodeURIComponent(url)
    
    // Split by bucket name segment
    // URL typically looks like: .../storage/v1/object/public/uploads/folder/file.ext
    const parts = decodedUrl.split(`/${bucketName}/`)
    
    if (parts.length >= 2) {
      // Join the rest in case filename contains the bucket name (unlikely but safe)
      return parts.slice(1).join(`/${bucketName}/`)
    }
    
    return null
  } catch (e) {
    console.error('Error extracting path from URL:', e)
    return null
  }
}
