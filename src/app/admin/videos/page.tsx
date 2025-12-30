'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, ExternalLink, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminVideos() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      // Only fetch pending videos for review
      let query = supabase
        .from("videos")
        .select("*")
        .eq('status', 'pending') // Review mode
        .order("created_at", { ascending: false })

      if (search) {
        query = query.ilike("title", `%${search}%`)
      }

      const { data: videosData, error } = await query
      if (error) throw error
      
      if (!videosData || videosData.length === 0) {
        setVideos([])
        return
      }

      // Fetch profiles manually to ensure we get user info even if FK is missing
      const userIds = [...new Set(videosData.map(v => v.user_id))]
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)

      const profilesMap = (profilesData || []).reduce((acc: any, profile: any) => {
        acc[profile.id] = profile
        return acc
      }, {} as Record<string, any>)

      const videosWithProfiles = videosData.map(video => ({
        ...video,
        profiles: profilesMap[video.user_id]
      }))

      setVideos(videosWithProfiles)
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast.error("加载视频列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (video: any, netdiskUrl: string) => {
    if (!netdiskUrl) {
      toast.error("请输入网盘链接")
      return
    }

    if (!confirm("确定要发布这个视频吗？")) return

    setUpdating(video.id)
    try {
      const { error } = await supabase
        .from("videos")
        .update({
          status: 'published',
          download_url: netdiskUrl
        })
        .eq("id", video.id)

      if (error) throw error

      toast.success("视频已发布")
      // Remove from list
      setVideos(videos.filter(v => v.id !== video.id))
    } catch (error) {
      console.error("Error publishing video:", error)
      toast.error("发布失败")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">审核视频</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索待审核视频..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchVideos()}
            className="pl-10 pr-4 py-2 bg-[#0B1120] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-4 w-[300px]">视频预览</th>
                <th className="p-4">原片下载</th>
                <th className="p-4 w-[300px]">转存 (网盘链接)</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">暂无待审核视频</td>
                </tr>
              ) : (
                videos.map((video) => (
                  <VideoRow key={video.id} video={video} onPublish={handlePublish} updating={updating === video.id} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function VideoRow({ video, onPublish, updating }: { video: any, onPublish: (v: any, url: string) => void, updating: boolean }) {
  const [netdiskUrl, setNetdiskUrl] = useState("")

  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-4">
        <div className="flex gap-3">
          <div className="w-32 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
            {video.thumbnail_url || video.url ? (
              <img 
                src={video.thumbnail_url || video.url} 
                className="w-full h-full object-cover" 
                alt={video.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">No Preview</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate" title={video.title}>{video.title}</h3>
            <p className="text-gray-500 text-xs mt-1">
              {video.profiles?.full_name || 'Unknown User'}
            </p>
            <p className="text-gray-500 text-xs">
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <a 
          href={video.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-xs"
        >
          <ExternalLink className="w-3 h-3" />
          下载原片
        </a>
      </td>
      <td className="p-4">
        <input 
          type="text" 
          placeholder="输入百度网盘链接..." 
          className="w-full bg-[#020817] border border-white/10 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none text-xs"
          value={netdiskUrl}
          onChange={(e) => setNetdiskUrl(e.target.value)}
        />
      </td>
      <td className="p-4 text-right">
        <button
          onClick={() => onPublish(video, netdiskUrl)}
          disabled={updating || !netdiskUrl}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-medium"
        >
          {updating ? '发布中...' : '发布'}
        </button>
      </td>
    </tr>
  )
}
