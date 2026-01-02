'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ProfileStats } from '@/components/dashboard/ProfileStats'
import { 
  Share2, 
  Zap, 
  ArrowRight, 
  Eye, 
  Download, 
  Clock, 
  Film, 
  Wallet, 
  Plus 
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

interface VideoItem {
  id: string
  title: string
  url: string
  created_at: string
  views: number
  downloads: number
  price: number
  status: string
}

import { useAuthStore } from '@/store/useAuthStore'

export default function Dashboard() {
  const { user, profile, isLoading: authLoading } = useAuthStore()
  const [username, setUsername] = useState<string>('')
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const router = useRouter()
  const [dataLoading, setDataLoading] = useState(true)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    
    if (authLoading) return

    if (!user) {
      router.push('/auth')
      return
    }

    // User exists, fetch data
    fetchData(user.id)
  }, [user, authLoading, router])

  const fetchData = async (userId: string) => {
    try {
      // Parallel data fetching
      const [profileResult, videosResult, incomeResult] = await Promise.allSettled([
        supabase.from('profiles').select('username').eq('id', userId).single(),
        supabase.from('videos').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('transactions').select('amount').eq('user_id', userId).in('type', ['income', 'tip_received'])
      ])

      // Handle Profile
      if (profileResult.status === 'fulfilled') {
        const { data, error } = profileResult.value
        if (!error && data) setUsername(data.username || '')
      }

      // Handle Videos
      if (videosResult.status === 'fulfilled') {
        const { data, error } = videosResult.value
        if (!error && data) setVideos(data as any[])
      }

      // Handle Income
      if (incomeResult.status === 'fulfilled') {
        const { data, error } = incomeResult.value
        if (!error && data) {
          const total = data.reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0)
          setTotalIncome(total)
        }
      }
    } catch (error) {
      console.error('Unexpected error in fetchData:', error)
      toast.error('获取数据部分失败，请重试')
    } finally {
      setDataLoading(false)
    }
  }

  if (!user) return null

  // Calculate stats
  const stats = {
    videoCount: videos.length,
    totalViews: videos.reduce((acc, curr) => acc + (curr.views || 0), 0),
    totalDownloads: videos.reduce((acc, curr) => acc + (curr.downloads || 0), 0),
    totalIncome: totalIncome
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">创作者中心</h1>
            <p className="text-gray-400">欢迎回来，{username || 'Creator'}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
             <Button 
                variant="outline" 
                className="flex-1 md:flex-none border-white/10 text-white hover:bg-white/5"
                onClick={() => router.push('/dashboard/wallet')}
            >
                <Wallet className="mr-2 h-4 w-4" />
                我的钱包
            </Button>
            <Button 
                className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                onClick={() => router.push('/dashboard/upload')}
            >
                <Plus className="mr-2 h-4 w-4" />
                发布作品
            </Button>
        </div>
      </div>

      {/* Profile Stats Overview */}
      <ProfileStats user={user} profile={profile} stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Videos */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">最近发布</h2>
                <Link href="/dashboard/videos" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    查看全部 <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            {videos.length > 0 ? (
                <div className="grid gap-4">
                    {videos.slice(0, 3).map((video) => (
                        <div key={video.id} className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-[#1e293b]/50 border border-white/5 hover:bg-[#1e293b] hover:border-white/10 transition-all">
                            <div className="relative w-full sm:w-32 aspect-video rounded-lg overflow-hidden bg-black/20 shrink-0">
                                <video 
                                    src={video.url} 
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0 w-full">
                                <h3 className="text-white font-medium truncate mb-1">{video.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Eye className="h-3.5 w-3.5" /> {video.views || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Download className="h-3.5 w-3.5" /> {video.downloads || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> {new Date(video.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div className="text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end">
                                <p className="text-white font-medium">¥{video.price}</p>
                                <Badge variant="secondary" className={`mt-0 sm:mt-1 ${
                                    video.status === 'published' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                    video.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                    {video.status === 'published' ? '已发布' : video.status === 'rejected' ? '已拒绝' : '审核中'}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 rounded-xl bg-white/5 border border-dashed border-white/10">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Film className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">还没有发布作品</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                        开始您的创作之旅，发布第一个 AI 视频作品，赚取收益。
                    </p>
                    <Button onClick={() => router.push('/dashboard/upload')} className="bg-blue-600 hover:bg-blue-700">
                        立即发布
                    </Button>
                </div>
            )}
        </div>

        {/* Right Column: Quick Actions & Referral */}
        <div className="space-y-6">
             {/* Referral Card */}
            <Card className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/20 overflow-hidden">
                <CardContent className="p-6 relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-900/20">
                            <Share2 className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">邀请好友加入</h3>
                        <p className="text-sm text-gray-300 mb-6">
                            每邀请一位好友注册并发布作品，您和好友都将获得 <span className="text-yellow-400 font-bold">100</span> 积分奖励。
                        </p>
                        
                        <div className="bg-black/20 rounded-lg p-3 flex items-center justify-between gap-2 mb-4 border border-white/5">
                            <code className="text-sm text-purple-300 font-mono truncate">
                                {username ? `${origin}/auth?tab=register&ref=${username}` : '请先设置用户名'}
                            </code>
                            <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 text-white hover:bg-white/10"
                                onClick={() => {
                                    if (!username) {
                                        toast.error('请先设置用户名')
                                        return
                                    }
                                    navigator.clipboard.writeText(`${origin}/auth?tab=register&ref=${username}`)
                                    toast.success('邀请链接已复制')
                                }}
                            >
                                复制
                            </Button>
                        </div>
                        
                        <Button 
                            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                            onClick={() => router.push('/dashboard/invite')}
                        >
                            查看邀请详情
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Platform News or Tips */}
            <Card className="bg-[#1e293b]/50 border-white/10">
                <CardHeader>
                    <CardTitle className="text-base text-white flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        创作贴士
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                        <p className="text-sm text-gray-400">
                            高质量的 <span className="text-gray-300">Prompt</span> 描述能显著提升 AI 视频生成的准确度。
                        </p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
                        <p className="text-sm text-gray-400">
                            上传 4K 分辨率的源视频可以获得更多的推荐流量。
                        </p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0" />
                        <p className="text-sm text-gray-400">
                            完善个人主页信息有助于建立品牌形象，吸引粉丝。
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </motion.div>
  )
}