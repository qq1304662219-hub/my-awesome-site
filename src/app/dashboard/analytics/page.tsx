"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  Area,
  AreaChart,
  CartesianGrid
} from "recharts"
import { Eye, Heart, Users, Wallet, TrendingUp, ArrowUpRight } from "lucide-react"
import { Video } from "@/types/video"
import { motion } from "framer-motion"

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalFollowers: 0,
    totalIncome: 0
  })
  const [topVideos, setTopVideos] = useState<Video[]>([])
  const [dailyViews, setDailyViews] = useState<{date: string, views: number}[]>([])
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

        // 2. Fetch total likes
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
          .select('amount, created_at')
          .eq('user_id', user.id)
          .in('type', ['income', 'tip_received'])
        
        const totalIncome = transactions?.reduce((acc, tx) => acc + (tx.amount || 0), 0) || 0

        setStats({
          totalViews,
          totalLikes,
          totalFollowers: followersCount || 0,
          totalIncome
        })

        // Sort videos by views for chart
        const sortedByViews = [...userVideos]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 5)
          .map(v => ({
            name: v.title.length > 10 ? v.title.substring(0, 10) + '...' : v.title,
            views: v.views || 0,
            downloads: v.downloads || 0
          }))
        setTopVideos(sortedByViews as any)

        // 5. Fetch Daily Stats (Real Data)
        const days = 7;
        const { data: dailyStats, error: statsError } = await supabase
            .rpc('get_user_daily_stats', { p_user_id: user.id, p_days: days });

        if (statsError) {
             console.error("Error fetching daily stats:", statsError);
             // Fallback to empty
             const emptyData = Array.from({ length: days }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (days - 1 - i));
                return {
                    date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
                    views: 0
                };
            });
            setDailyViews(emptyData);
        } else {
             // Fill in missing days with 0
            const filledDailyData = Array.from({ length: days }).map((_, i) => {
                const dateObj = new Date();
                dateObj.setDate(dateObj.getDate() - (days - 1 - i));
                const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
                
                // Find matching stat (ensure type safety if needed)
                const found = dailyStats?.find((s: any) => s.date === dateStr);
                
                return {
                    date: dateObj.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
                    views: found ? Number(found.views) : 0
                };
            });
            setDailyViews(filledDailyData);
        }

      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  if (loading) {
    return (
        <div className="flex items-center justify-center h-full min-h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
    )
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  return (
    <div className="p-8 space-y-8 min-h-full pb-20 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">数据分析</h1>
            <p className="text-gray-400">实时监控您的创作影响力与收益表现</p>
        </div>
        <div className="text-sm text-gray-500">
            数据更新于 {new Date().toLocaleTimeString()}
        </div>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={item}>
            <StatCard 
                title="总浏览量" 
                value={stats.totalViews.toLocaleString()} 
                icon={Eye} 
                trend="+12.5%" 
                color="text-blue-500"
                bgColor="bg-blue-500/10"
            />
        </motion.div>
        <motion.div variants={item}>
            <StatCard 
                title="获赞总数" 
                value={stats.totalLikes.toLocaleString()} 
                icon={Heart} 
                trend="+5.2%" 
                color="text-pink-500"
                bgColor="bg-pink-500/10"
            />
        </motion.div>
        <motion.div variants={item}>
            <StatCard 
                title="粉丝数量" 
                value={stats.totalFollowers.toLocaleString()} 
                icon={Users} 
                trend="+8.1%" 
                color="text-purple-500"
                bgColor="bg-purple-500/10"
            />
        </motion.div>
        <motion.div variants={item}>
            <StatCard 
                title="累计收益" 
                value={`¥${stats.totalIncome.toFixed(2)}`} 
                icon={Wallet} 
                trend="+24.3%" 
                color="text-green-500"
                bgColor="bg-green-500/10"
            />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2"
        >
            <Card className="bg-[#0f172a] border-white/10 h-full">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                        流量趋势
                    </CardTitle>
                    <CardDescription className="text-gray-400">过去 7 天的浏览量变化</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyViews}>
                                <defs>
                                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
        >
            <Card className="bg-[#0f172a] border-white/10 h-full">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5 text-orange-500" />
                        热门作品
                    </CardTitle>
                    <CardDescription className="text-gray-400">浏览量最高的 TOP 5 作品</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topVideos} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={12} hide />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={80} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                                />
                                <Bar dataKey="views" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, trend, color, bgColor }: any) {
    return (
        <Card className="bg-[#0f172a] border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    {trend && (
                        <div className="flex items-center text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {trend}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}
