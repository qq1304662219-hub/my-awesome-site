"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Video, Users, Activity, Film } from "lucide-react"
import Link from "next/link"

interface DashboardVideo {
  id: string
  title: string
  created_at: string
  thumbnail_url: string | null
  category: string | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    videos: 0,
    likes: 0
  })
  const [recentVideos, setRecentVideos] = useState<DashboardVideo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // 1. Get counts
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })

      const { count: videoCount } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
      
      // Note: 'likes' table might be large, be careful with count
      const { count: likesCount } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })

      setStats({
        users: userCount || 0,
        videos: videoCount || 0,
        likes: likesCount || 0
      })

      // 2. Get recent videos
      const { data: videos } = await supabase
        .from("videos")
        .select("id, title, created_at, thumbnail_url, category")
        .order("created_at", { ascending: false })
        .limit(5)
      
      setRecentVideos(videos as DashboardVideo[] || [])

    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-white">Loading stats...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">仪表盘</h1>
        <p className="text-gray-400">网站运营概况</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0B1120] border border-white/10 rounded-xl p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">总用户数</p>
            <p className="text-2xl font-bold">{stats.users}</p>
          </div>
        </div>

        <div className="bg-[#0B1120] border border-white/10 rounded-xl p-6 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500">
            <Video className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">总视频数</p>
            <p className="text-2xl font-bold">{stats.videos}</p>
          </div>
        </div>

        <div className="bg-[#0B1120] border border-white/10 rounded-xl p-6 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">总点赞数</p>
            <p className="text-2xl font-bold">{stats.likes}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-500" />
            最新上传
          </h2>
          <Link href="/admin/videos" className="text-sm text-blue-400 hover:text-blue-300">
            查看全部 &rarr;
          </Link>
        </div>
        <div className="divide-y divide-white/10">
          {recentVideos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无视频</div>
          ) : (
            recentVideos.map((video) => (
              <div key={video.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                <div className="w-16 h-10 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">No Img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{video.title}</h3>
                  <p className="text-xs text-gray-500">
                    {video.category} • {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link 
                  href={`/video/${video.id}`} 
                  target="_blank"
                  className="px-3 py-1 text-xs border border-white/20 rounded hover:bg-white/10"
                >
                  查看
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
