"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { 
  Video, Users, Activity, Film, AlertCircle, FileQuestion, 
  TrendingUp, TrendingDown, DollarSign, Eye, ShoppingCart
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface DashboardVideo {
  id: string
  title: string
  created_at: string
  thumbnail_url: string | null
  category: string | null
  status: string
  user_id: string
  profiles?: {
    username: string
    avatar_url: string
  }
}

interface Transaction {
  id: string
  amount: number
  type: string
  created_at: string
  status: string
  user_id: string
  profiles?: {
    username: string
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    videos: 0,
    revenue: 0,
    orders: 0
  })
  const [recentVideos, setRecentVideos] = useState<DashboardVideo[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  // Mock data for charts (since we don't have historical aggregation tables yet)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Parallel data fetching
      const [
        { count: userCount },
        { count: videoCount },
        { data: transactionsData },
        { data: recentVideosData },
        { data: recentTransactionsData }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("amount").eq('status', 'succeeded').eq('type', 'purchase'),
        supabase.from("videos")
          .select("id, title, created_at, thumbnail_url, category, status, user_id, profiles(username, avatar_url)")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("transactions")
          .select("id, amount, type, created_at, status, user_id, profiles(username)")
          .order("created_at", { ascending: false })
          .limit(5)
      ])

      // Calculate total revenue
      const totalRevenue = transactionsData?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0

      setStats({
        users: userCount || 0,
        videos: videoCount || 0,
        revenue: totalRevenue,
        orders: transactionsData?.length || 0
      })
      
      setRecentVideos(recentVideosData as any[] || [])
      setRecentTransactions(recentTransactionsData as any[] || [])

      // Generate mock chart data
      generateMockChartData()

    } catch (error) {
      console.error("Error fetching admin stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockChartData = () => {
    const days = 7
    const revData = []
    const usrData = []
    
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      
      revData.push({
        date: dateStr,
        amount: Math.floor(Math.random() * 5000) + 1000
      })
      
      usrData.push({
        date: dateStr,
        users: Math.floor(Math.random() * 50) + 10
      })
    }
    
    setRevenueData(revData)
    setUserGrowthData(usrData)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            运营概览
          </h1>
          <p className="text-muted-foreground mt-1">欢迎回来，这里是您的控制中心</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
            导出报表
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Activity className="mr-2 h-4 w-4" /> 实时监控
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="总收入" 
          value={`¥${stats.revenue.toLocaleString()}`} 
          icon={DollarSign} 
          trend="+12.5%" 
          trendUp={true}
          color="blue"
        />
        <StatsCard 
          title="总用户" 
          value={stats.users.toLocaleString()} 
          icon={Users} 
          trend="+5.2%" 
          trendUp={true}
          color="purple"
        />
        <StatsCard 
          title="视频内容" 
          value={stats.videos.toLocaleString()} 
          icon={Film} 
          trend="+8.1%" 
          trendUp={true}
          color="pink"
        />
        <StatsCard 
          title="成交订单" 
          value={stats.orders.toLocaleString()} 
          icon={ShoppingCart} 
          trend="-2.4%" 
          trendUp={false}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              收入趋势 (近7天)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `¥${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              新增用户 (近7天)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Videos - Takes up 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Film className="h-5 w-5 text-pink-500" />
                最新上传
              </CardTitle>
              <Link href="/admin/videos">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  查看全部
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVideos.map((video) => (
                  <div key={video.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                    <div className="w-24 h-16 bg-muted rounded-md overflow-hidden relative shrink-0">
                      {video.thumbnail_url ? (
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                          <Film className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[10px] text-white">
                        {video.category}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{video.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={video.profiles?.avatar_url} />
                          <AvatarFallback className="text-[10px]">{video.profiles?.username?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate">{video.profiles?.username}</span>
                        <span className="text-xs text-muted-foreground">• {new Date(video.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`
                      ${video.status === 'published' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 
                        video.status === 'rejected' ? 'border-destructive/50 text-destructive bg-destructive/10' : 
                        'border-yellow-500/50 text-yellow-500 bg-yellow-500/10'}
                    `}>
                      {video.status === 'published' ? '已发布' : video.status === 'rejected' ? '已拒绝' : '审核中'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions - Takes up 1 column */}
        <div className="space-y-6">
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                最新交易
              </CardTitle>
              <Link href="/admin/payments">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                  查看
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        tx.type === 'income' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        <DollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {tx.type === 'purchase' ? '购买内容' : tx.type === 'recharge' ? '账户充值' : '提现申请'}
                        </p>
                        <p className="text-xs text-muted-foreground">{tx.profiles?.username || 'Unknown User'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        tx.type === 'withdrawal' ? 'text-destructive' : 'text-green-500'
                      }`}>
                        {tx.type === 'withdrawal' ? '-' : '+'}¥{tx.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {recentTransactions.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    暂无交易记录
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon: Icon, trend, trendUp, color }: any) {
  const colorStyles = {
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400"
  }

  return (
    <Card className="bg-card border-border overflow-hidden relative group hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${(colorStyles as any)[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            trendUp ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}>
            {trendUp ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {trend}
          </div>
        </div>
        <div>
          <p className="text-muted-foreground text-sm mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-foreground">{value}</h3>
        </div>
        
        {/* Decorative background blur */}
        <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity ${(colorStyles as any)[color].split(' ')[0].replace('/10', '')}`} />
      </CardContent>
    </Card>
  )
}
