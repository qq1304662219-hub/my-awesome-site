"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Video } from "@/types/video"
import { motion, AnimatePresence } from "framer-motion"
import { VideoCard } from "@/components/shared/VideoCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react"

interface FilterState {
  category: string | null;
  style: string | null;
  ratio: string | null;
  model: string | null;
  query?: string | null;
  resolution?: string | null;
  duration?: string | null;
  fps?: string | null;
  movement?: string | null;
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
      switch (sort) {
        case 'popular':
          query = query.order('views', { ascending: false })
          break
        case 'most_downloaded':
          query = query.order('downloads', { ascending: false })
          break
        case 'most_collected':
          query = query.order('collections_count', { ascending: false })
          break
        case 'most_liked':
          query = query.order('likes', { ascending: false })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
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
        if (filters.resolution === '720p_low') {
          query = query.in('resolution', ['720p', '480p', '360p', '720p_low'])
        } else {
          query = query.eq('resolution', filters.resolution)
        }
      }
      if (filters.movement) {
        query = query.eq('movement', filters.movement)
      }
      if (filters.fps) {
        // Use the explicit fps_range column which matches the Edit page
        query = query.eq('fps_range', filters.fps)
      }
      if (filters.duration) {
        // Use the explicit duration_range column which matches the Edit page
        query = query.eq('duration_range', filters.duration)
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
            <Skeleton className="aspect-video w-full rounded-xl bg-muted" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-1/2 bg-muted" />
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
        <h3 className="text-xl font-bold text-foreground mb-2">出错了</h3>
        <p className="text-muted-foreground mb-6">{error}</p>
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
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-3xl bg-muted/30">
            <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">没有找到相关视频</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                尝试调整筛选条件或搜索关键词，探索更多精彩内容
            </p>
            <Button 
                onClick={() => window.location.reload()} // Simple reload or better filter reset logic could be passed down
                variant="outline"
                className="gap-2"
            >
                <RefreshCw className="h-4 w-4" />
                重置筛选
            </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                  ai_model={video.ai_model}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {hasMore && videos.length > 0 && (
        <div className="flex justify-center pt-8">
          <Button 
            onClick={loadMore}
            disabled={loading}
            variant="secondary"
            className="px-8 rounded-full bg-secondary/50 hover:bg-secondary hover:text-foreground transition-all"
          >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    加载中...
                </>
            ) : '加载更多'}
          </Button>
        </div>
      )}
    </div>
  )
}
