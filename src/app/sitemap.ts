import { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { SITE_CONFIG } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || SITE_CONFIG.url

  // Fetch all published videos
  // In a real app, you might want to limit this or paginate
  const { data: videos } = await supabase
    .from('videos')
    .select('id, updated_at')
    .eq('status', 'published')
    .limit(1000)

  const videoEntries: MetadataRoute.Sitemap = (videos || []).map((video) => ({
    url: `${baseUrl}/video/${video.id}`,
    lastModified: new Date(video.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...videoEntries,
  ]
}
