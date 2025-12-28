'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileUpload } from '@/components/ui/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, LogOut, Plus, LayoutDashboard, Film } from 'lucide-react'
import Link from 'next/link'

interface VideoItem {
  id: string
  title: string
  url: string
  created_at: string
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [videoLoading, setVideoLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
      } else {
        setUser(user)
        fetchVideos(user.id)
      }
      setLoading(false)
    }
    getUser()
  }, [router])

  const fetchVideos = async (userId: string) => {
    setVideoLoading(true)
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setVideos(data)
    }
    setVideoLoading(false)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision 面板
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden md:inline">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-400 hover:text-white hover:bg-white/10">
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Upload */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm sticky top-24">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5 text-blue-500" />
                  上传新作品
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload userId={user.id} onUploadSuccess={() => fetchVideos(user.id)} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Video List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Film className="h-6 w-6 text-purple-500" />
                我的作品库
              </h2>
              <span className="text-sm text-gray-400">共 {videos.length} 个文件</span>
            </div>

            {videoLoading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : videos.length === 0 ? (
              <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-400 mb-2">暂无上传作品</p>
                <p className="text-sm text-gray-600">快去左侧上传你的第一个 AI 视频吧！</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((video) => (
                  <div key={video.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all">
                    <div className="aspect-video relative bg-black/50">
                      {/* Simple check for image vs video based on extension (not perfect but works for simple demo) */}
                      {video.url.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={video.url} controls className="w-full h-full object-cover" />
                      ) : (
                        <img src={video.url} alt={video.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium truncate text-white" title={video.title}>{video.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(video.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
