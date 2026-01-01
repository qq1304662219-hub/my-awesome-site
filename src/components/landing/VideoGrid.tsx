"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Video } from "@/types/video"
import { motion, AnimatePresence } from "framer-motion"
import { VideoCard } from "@/components/shared/VideoCard"

interface FilterState {
  category: string | null;
  style: string | null;
  ratio: string | null;
  model: string | null;
  query?: string | null;
}

interface VideoGridProps {
  filters: FilterState;
}

import { APP_CONFIG } from "@/lib/constants"

export function VideoGrid({ filters }: VideoGridProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
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
        query = supabase.rpc('search_videos', { query_text: filters.query })
      } else {
        // Standard query
        query = supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
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

      const { data, error } = await query

      if (error) {
        console.error('Error fetching videos:', error)
      } else {
        if (data) {
          if (data.length < PAGE_SIZE) {
            setHasMore(false)
          }
          setVideos(prev => isNewFilter ? data : [...prev, ...data])
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err)
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

  if (loading && videos.length === 0) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[225px] w-full rounded-xl bg-white/10" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px] bg-white/10" />
                        <Skeleton className="h-4 w-[200px] bg-white/10" />
                    </div>
                </div>
            ))}
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
                  user_avatar={video.profiles?.avatar_url}
                  views={video.views_count}
                  duration={video.duration_str || '00:00'}
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
