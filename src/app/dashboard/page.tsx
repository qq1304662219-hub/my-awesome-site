'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { FileUpload } from '@/components/ui/file-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, LogOut, Plus, Film, Search } from 'lucide-react'
import Link from 'next/link'
import { DashboardSidebar } from '@/components/dashboard/Sidebar'
import { ProfileStats } from '@/components/dashboard/ProfileStats'
import { Input } from '@/components/ui/input'

interface VideoItem {
  id: string
  title: string
  url: string
  created_at: string
  views?: number
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [videos, setVideos] = useState<VideoItem[]>([])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('overview')

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
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setVideos(data)
    }
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

  // Calculate stats
  const stats = {
    videoCount: videos.length,
    totalViews: videos.reduce((acc, curr) => acc + (curr.views || 0), 0)
  }

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return (
          <div className="space-y-8">
            <ProfileStats user={user} stats={stats} />
            
            {/* Recent Videos Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">最近上传</h2>
                <Button variant="link" onClick={() => setCurrentView('videos')} className="text-blue-400">
                  查看全部
                </Button>
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
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium truncate text-white text-sm">{video.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-white/5 rounded-lg border border-white/10 border-dashed">
                  暂无作品
                </div>
              )}
            </div>
          </div>
        )
      
      case 'videos':
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">我的作品库</h2>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input placeholder="搜索作品..." className="pl-9 bg-white/5 border-white/10 text-white w-64" />
                        </div>
                        <Button onClick={() => setCurrentView('upload')} className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            上传作品
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <div key={video.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all">
                            <div className="aspect-video relative bg-black/50">
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
            </div>
        )

      case 'upload':
        return (
            <div className="max-w-2xl mx-auto py-8">
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Plus className="h-5 w-5 text-blue-500" />
                            上传新作品
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUpload userId={user.id} onUploadSuccess={() => {
                            fetchVideos(user.id)
                            setCurrentView('videos') // Switch to videos list after upload
                        }} />
                    </CardContent>
                </Card>
            </div>
        )

      default:
        return (
            <div className="flex items-center justify-center h-[50vh] text-gray-500">
                功能开发中...
            </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Video className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI Vision
                </span>
            </Link>
            <div className="hidden md:flex items-center text-sm text-gray-400">
                <span className="hover:text-white cursor-pointer transition-colors">首页</span>
                <span className="mx-2">/</span>
                <span className="text-white">个人中心</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="text-gray-400 hover:text-white hover:bg-white/10">
                <Link href="/">
                    返回首页
                </Link>
            </Button>
            <span className="text-sm text-gray-400 hidden md:inline border-l border-white/10 pl-4">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 container mx-auto px-4 py-8 flex gap-8">
        {/* Sidebar */}
        <DashboardSidebar currentView={currentView} onChangeView={setCurrentView} />
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
            {renderContent()}
        </div>
      </div>
    </div>
  )
}
