'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ProfileStats } from '@/components/dashboard/ProfileStats'

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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
      } else {
        setUser(user)
        fetchData(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  const fetchData = async (userId: string) => {
    // Fetch videos
    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!videosError && videosData) {
      setVideos(videosData as any[])
    }

    // Fetch income transactions
    const { data: incomeData, error: incomeError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
    
    if (!incomeError && incomeData) {
      const total = incomeData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
      setTotalIncome(total)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

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
