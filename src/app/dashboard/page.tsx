'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ProfileStats } from '@/components/dashboard/ProfileStats'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

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
  const { user, isLoading: authLoading } = useAuthStore()
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
        supabase.from('transactions').select('amount').eq('user_id', userId).eq('type', 'income')
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
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">创作者中心</h1>
      </div>

      {/* Referral Card */}
      <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Share2 className="w-32 h-32 text-white" />
        </div>
        <div className="relative z-10">
          <h2 className="text-xl font-bold text-white mb-2">邀请好友，赚取奖励 🎁</h2>
          <p className="text-gray-300 mb-4 max-w-2xl">
            每邀请一位好友注册，您将获得 <span className="text-yellow-400 font-bold">50 A币</span> 奖励，好友也将获得 <span className="text-yellow-400 font-bold">20 A币</span> 新人礼包！
          </p>
          
          <div className="flex items-center gap-4 max-w-xl bg-black/40 p-2 rounded-lg border border-white/10">
            <code className="flex-1 text-blue-400 truncate px-2 font-mono">
              {username && origin ? `${origin}/register?ref=${username}` : '正在加载...'}
            </code>
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => {
                const url = `${origin}/register?ref=${username}`;
                navigator.clipboard.writeText(url);
                toast.success('链接已复制');
              }}
            >
              复制链接
            </Button>
          </div>
        </div>
      </div>

      <ProfileStats user={user} stats={stats} />
      
      {/* Recent Videos Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">最近上传</h2>
          <Link href="/dashboard/videos">
            <Button variant="link" className="text-blue-400">
              查看全部
            </Button>
          </Link>
        </div>
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.slice(0, 3).map((video) => (
              <div key={video.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all">
                <div className="aspect-video relative bg-black/50">
                  {video.url.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={video.url} className="w-full h-full object-cover" />
                  ) : (
                      <img src={video.url} alt={video.title} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                    {video.status === 'published' ? '🟢 已发布' : '🟡 审核中'}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium truncate text-white text-sm">{video.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500">
                      {new Date(video.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-3 text-xs text-gray-400">
                        <span>👁️ {video.views || 0}</span>
                        <span>⬇️ {video.downloads || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white/5 rounded-lg border border-white/10 border-dashed">
            <p className="mb-4">暂无作品，开始您的创作之旅吧</p>
            <Link href="/dashboard/upload">
                <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    立即上传
                </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
