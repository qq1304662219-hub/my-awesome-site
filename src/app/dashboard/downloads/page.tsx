"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { VideoCard } from "@/components/shared/VideoCard"
import { Loader2, Download, History } from "lucide-react"

export default function MyDownloadsPage() {
  const { user } = useAuthStore()
  const [downloads, setDownloads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDownloads()
    }
  }, [user])

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from('user_downloads')
        .select(`
          created_at,
          videos (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Flatten the structure and filter out null videos (deleted ones)
      const formattedDownloads = data
        ?.filter(item => item.videos)
        .map(item => ({
          ...item.videos,
          downloaded_at: item.created_at
        })) || []

      setDownloads(formattedDownloads)
    } catch (error) {
      console.error("Error fetching downloads:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Download className="h-6 w-6 text-blue-500" />
            下载历史
          </h1>
          <p className="text-gray-400 mt-1">
            查看您下载过的所有视频素材
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-white/5 px-3 py-1.5 rounded-full">
            <History className="h-4 w-4" />
            共 {downloads.length} 条记录
        </div>
      </div>

      {downloads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {downloads.map((video) => (
            <div key={`${video.id}-${video.downloaded_at}`} className="relative group">
                <VideoCard {...video} />
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs text-white border border-white/10">
                    下载于 {new Date(video.downloaded_at).toLocaleDateString()}
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#0B1120] rounded-xl border border-white/5">
          <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="h-8 w-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">暂无下载记录</h3>
          <p className="text-gray-400">
            您下载的视频将会显示在这里
          </p>
        </div>
      )}
    </div>
  )
}
