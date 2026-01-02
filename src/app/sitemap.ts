import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const baseUrl = 'https://ai-video.com' // Replace with actual domain

  // Static routes
  const routes = [
    '',
    '/explore',
    '/creators',
    '/auth',
    '/pricing',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // Dynamic Video routes
  const { data: videos } = await supabase
    .from('videos')
    .select('id, created_at')
    .order('created_at', { ascending: false })
    .limit(1000)

  const videoRoutes = (videos || []).map((video) => ({
    url: `${baseUrl}/video/${video.id}`,
    lastModified: video.created_at,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic Creator routes
  const { data: creators } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('role', 'creator')
    .limit(1000)

  const creatorRoutes = (creators || []).map((creator) => ({
    url: `${baseUrl}/profile/${creator.id}`,
    lastModified: creator.updated_at || new Date().toISOString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...routes, ...videoRoutes, ...creatorRoutes]
}
