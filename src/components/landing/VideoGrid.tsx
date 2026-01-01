"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Video } from "@/types/video"
import { motion, AnimatePresence } from "framer-motion"
import { VideoCard } from "@/components/shared/VideoCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface FilterState {
  category: string | null;
  style: string | null;
  ratio: string | null;
  model: string | null;
  query?: string | null;
  resolution?: string | null;
  duration?: string | null;
  fps?: string | null;
}

interface VideoGridProps {
  filters: FilterState;
  sort?: string;
}

import { APP_CONFIG } from "@/lib/constants"

export function VideoGrid({ filters, sort }: VideoGridProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = APP_CONFIG.PAGE_SIZE

  useEffect(() => {
    setVideos([])
    setPage(0)
    setHasMore(true)
    fetchVideos(0, true)
  }, [filters])

  const fetchVideos = async (pageIndex: number, isNewFilter = false) => {
    if (pageIndex > 0) setLoading(false) // Don't show full loading state for pagination
    
    try {
      let query: any;
      
      if (filters.query) {
        // Use RPC for advanced search (title, description, tags, ai_model)
        // Ensure profiles are joined if the RPC supports it, otherwise we might need a separate fetch or view
        // Assuming search_videos returns video rows, we might miss profiles if not joined.
        // If RPC returns simple rows, we can't easily join in one go without modifying RPC.
        // Fallback to client-side filtering or standard query with ILIKE if RPC is problematic.
        // For now, let's try to use standard query with OR for search to ensure we can join profiles.
        query = supabase
          .from('videos')
          .select('*, profiles(full_name, avatar_url)')
          .or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
      } else {
        // Standard query
        query = supabase
          .from('videos')
          .select('*, profiles(full_name, avatar_url)')
      }

      // Apply sorting
      if (sort === 'popular') {
        query = query.order('views', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      // Apply common filters and pagination
      query = query
        .eq('status', 'published')
        .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1)

      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.style) {
        query = query.eq('style', filters.style)
      }
      if (filters.ratio) {
        query = query.eq('ratio', filters.ratio)
      }
      if (filters.model) {
        query = query.eq('ai_model', filters.model)
      }
      if (filters.resolution) {
        query = query.eq('resolution', filters.resolution)
      }
      if (filters.fps) {
        query = query.eq('fps', parseInt(filters.fps))
      }
      if (filters.duration) {
        if (filters.duration === 'short') { // < 15s
          query = query.lt('duration', 15)
        } else if (filters.duration === 'medium') { // 15-60s
          query = query.gte('duration', 15).lte('duration', 60)
        } else if (filters.duration === 'long') { // > 60s
          query = query.gt('duration', 60)
        }
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching videos:', error)
        setError(error.message)
      } else {
        if (data) {
          if (data.length < PAGE_SIZE) {
            setHasMore(false)
          }
          setVideos(prev => isNewFilter ? data : [...prev, ...data])
        }
      }
    } catch (err: any) {
      console.error('Unexpected error:', err)
      setError(err.message || '加载视频失败')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVideos(nextPage)
    }
  }

  if (loading && page === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-video w-full rounded-xl bg-white/5" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-4 w-1/2 bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">出错了</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <Button onClick={() => fetchVideos(0, true)} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {videos.length === 0 ? (
        <div className="text-center py-20">
            <p className="text-gray-400">没有找到相关视频</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence>
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <VideoCard
                  id={video.id}
                  title={video.title}
                  author={video.profiles?.full_name || 'Unknown'}
                  user_id={video.user_id}
                  user_avatar={video.profiles?.avatar_url || undefined}
                  views={video.views || 0}
                  duration={video.duration || '00:00'}
                  image={video.thumbnail_url}
                  url={video.url}
                  price={video.price}
                  created_at={video.created_at}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {hasMore && videos.length > 0 && (
        <div className="flex justify-center pt-8">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}
