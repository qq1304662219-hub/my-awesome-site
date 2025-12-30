"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Video } from "@/types/video"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Download, Eye, Clock } from "lucide-react"

interface FilterState {
  category: string | null;
  style: string | null;
  ratio: string | null;
}

interface VideoGridProps {
  filters: FilterState;
}

function VideoCard({ video, onClick }: { video: Video; onClick: (id: string) => void }) {
  const [isHovering, setIsHovering] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Simple mobile detection
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // Intersection Observer for mobile autoplay
    if (!isMobile) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsPlaying(true)
        } else {
          setIsPlaying(false)
        }
      })
    }, { threshold: 0.6 })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [isMobile])

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovering(true)
      setIsPlaying(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovering(false)
      setIsPlaying(false)
    }
  }

  const handleClick = () => {
     onClick(String(video.id))
  }

  // Use image as poster, fallback to a default placeholder if neither image nor url is good
  const posterUrl = video.image || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop";
  const isVideoFile = video.url && video.url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <motion.div
      ref={containerRef}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-[#0f172a] rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 cursor-pointer"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail / Video Area */}
      <div className="aspect-video relative overflow-hidden bg-gray-900">
        {/* Always show image initially or if not playing */}
        {(!isPlaying || !isVideoFile) && (
             <img 
             src={posterUrl} 
             alt={video.title} 
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
           />
        )}

        {/* Only render video when playing to save resources */}
        {isVideoFile && isPlaying && (
            <video 
                ref={videoRef}
                src={video.url} 
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay 
                muted
                loop
                playsInline
            />
        )}
        
        {/* Overlay */}
        <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${isHovering && !isMobile ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full">
            <Play className="h-6 w-6 text-white fill-white" />
          </div>
        </div>

        {/* Duration Badge */}
        {video.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
            </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-white truncate" title={video.title}>
          {video.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {video.views || 0}
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" /> {video.downloads || 0}
            </span>
          </div>
          <span className="text-blue-400 font-medium">
            {video.price && video.price > 0 ? `¥${video.price}` : '免费'}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 pt-2">
            {video.category && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20">
                    {video.category}
                </span>
            )}
            {video.ratio && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] border border-purple-500/20">
                    {video.ratio}
                </span>
            )}
        </div>
      </div>
    </motion.div>
  )
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

  const handleVideoClick = (videoId: string) => {
    router.push(`/video/${videoId}`);
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
            <VideoCard key={video.id} video={video} onClick={handleVideoClick} />
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
