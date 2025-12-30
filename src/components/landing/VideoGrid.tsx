"use client"

import { useState, useEffect } from "react"
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

export function VideoGrid({ filters }: VideoGridProps) {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideos()
    
    // 调试用：将核心函数挂载到 window
    // @ts-ignore
    window.fetchVideos = fetchVideos;
  }, [filters])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      console.log('开始获取视频列表...')
      let query = supabase
        .from('videos')
        .select('*')
        // .eq('status', 'published') // 暂时移除状态过滤，确保数据能显示
        .order('created_at', { ascending: false })

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
        console.log('API返回数据:', data)
        setVideos(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoClick = (videoId: string) => {
    console.log('点击视频:', videoId);
    router.push(`/video/${videoId}`);
  }

  // 挂载跳转函数供全局调用
  useEffect(() => {
     // @ts-ignore
     window.handleVideoClick = handleVideoClick;
  }, [router])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-lg">没有找到符合条件的视频</p>
        <p className="text-sm mt-2">试试其他筛选条件吧</p>
      </div>
    )
  }

  return (
    <div className="p-6">
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
              className="group relative bg-[#0f172a] rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 cursor-pointer"
              onClick={() => handleVideoClick(String(video.id))}
            >
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden">
                 {video.url && video.url.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video 
                        src={video.url} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        muted
                        loop
                        playsInline
                        onMouseOver={e => e.currentTarget.play()}
                        onMouseOut={e => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                        }}
                    />
                 ) : (
                    <img 
                        src={video.url || video.image} 
                        alt={video.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                 )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
