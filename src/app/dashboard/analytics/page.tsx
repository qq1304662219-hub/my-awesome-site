"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Eye, Heart, Users, Wallet } from "lucide-react"
import { Video } from "@/types/video"

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalFollowers: 0,
    totalIncome: 0
  })
  const [topVideos, setTopVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      try {
        setLoading(true)
        
        // 1. Fetch user's videos
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .eq('user_id', user.id)

        if (videosError) throw videosError

        const userVideos = videos || []
        const totalViews = userVideos.reduce((acc, video) => acc + (video.views || 0), 0)

        // 2. Fetch total likes on user's videos
        // Since we might not have a direct join available easily in client without complex query,
        // we can iterate video IDs if not too many, or assume we have a likes_count on video.
        // Let's check if video has likes_count. Usually it's better to add a trigger for this.
        // If not, we fetch likes where video_id in (userVideoIds).
        const videoIds = userVideos.map(v => v.id)
        let totalLikes = 0
        if (videoIds.length > 0) {
            const { count } = await supabase
                .from('likes')
                .select('*', { count: 'exact', head: true })
                .in('video_id', videoIds)
            totalLikes = count || 0
        }

        // 3. Fetch followers
        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id)

        // 4. Fetch income
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .in('type', ['income', 'tip_received']) // Include tips in income
        
        const totalIncome = transactions?.reduce((acc, tx) => acc + (tx.amount || 0), 0) || 0

        setStats({
          totalViews,
          totalLikes,
          totalFollowers: followersCount || 0,
          totalIncome
        })

        // Sort videos by views for chart
        const sortedByViews = [...userVideos].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5)
        setTopVideos(sortedByViews)

      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return <div className="p-8 text-white">加载数据中...</div>
  }

  return (
    <div className="p-8 space-y-8 min-h-full pb-20">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">数据分析</h1>
        <p className="text-gray-400">查看您的作品表现和收益数据</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1e293b] border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总播放量</CardTitle>
            <Eye className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-gray-400">所有视频累计播放</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1e293b] border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总获赞数</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-gray-400">收获的点赞总数</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">粉丝总数</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</div>
            <p className="text-xs text-gray-400">关注您的人数</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-white/10 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计收益</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{stats.totalIncome.toFixed(2)}</div>
            <p className="text-xs text-gray-400">作品售卖与打赏收入</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-[#1e293b] border-white/10 text-white col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>热门视频表现 (Top 5)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topVideos}>
                <XAxis 
                    dataKey="title" 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                />
                <YAxis 
                    stroke="#888888" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                />
                <Legend />
                <Bar dataKey="views" name="播放量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="downloads" name="下载量" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
