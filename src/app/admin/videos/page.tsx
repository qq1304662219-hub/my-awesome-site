"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AdminVideos() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("videos")
        .select("*")
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

  const handleDelete = async (id: string, path: string) => {
    if (!confirm("确定要删除这个视频吗？此操作不可恢复。")) return

    try {
      // 1. Delete from storage (optional, if you want to clean up files)
      // Note: This requires getting the file path from the URL which can be tricky
      // For now, we just delete the database record.
      
      // 2. Delete from database
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id)

      if (error) throw error

      setVideos(videos.filter(v => v.id !== id))
      toast.success("视频已删除")
    } catch (error) {
      console.error("Error deleting video:", error)
      toast.error("删除失败")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">视频管理</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索视频..."
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
                <th className="p-4">视频信息</th>
                <th className="p-4">作者</th>
                <th className="p-4">分类/格式</th>
                <th className="p-4">上传时间</th>
                <th className="p-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">未找到视频</td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-12 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                          {video.thumbnail_url && (
                            <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="max-w-xs">
                          <p className="font-medium truncate" title={video.title}>{video.title}</p>
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 flex items-center gap-1 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> 源文件
                          </a>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {video.profiles?.full_name || video.profiles?.email || "Unknown"}
                    </td>
                    <td className="p-4 text-gray-400">
                      <span className="block text-white">{video.category}</span>
                      <span className="text-xs uppercase">{video.format}</span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(video.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(video.id, video.url)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="删除视频"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
