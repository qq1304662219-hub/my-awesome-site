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
  query?: string | null;
}

interface VideoGridProps {
  filters: FilterState;
}

export function VideoGrid({ filters }: VideoGridProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12

  useEffect(() => {
    setVideos([])
    setPage(0)
    setHasMore(true)
    fetchVideos(0, true)
  }, [filters])

  const fetchVideos = async (pageIndex: number, isNewFilter = false) => {
    if (pageIndex > 0) setLoading(false) // Don't show full loading state for pagination
    
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
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
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%`)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (videos.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-lg">没有找到符合条件的视频</p>
        <p className="text-sm mt-2">试试其他筛选条件吧</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {videos.map((video) => (
            <motion.div
              key={video.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <VideoCard
                id={video.id}
                title={video.title}
                url={video.url}
                image={video.thumbnail_url}
                duration={video.duration}
                views={video.views}
                price={video.price}
                user_id={video.user_id}
                author={video.author}
                created_at={video.created_at}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors disabled:opacity-50"
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}
