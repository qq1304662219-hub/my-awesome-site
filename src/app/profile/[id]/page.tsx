"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { VideoCard } from "@/components/shared/VideoCard"
import { Loader2, Video, Heart, Download, User } from "lucide-react"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const [profile, setProfile] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalLikes: 0,
    totalDownloads: 0
  })

  useEffect(() => {
    fetchProfileAndVideos()
  }, [])

  const fetchProfileAndVideos = async () => {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // 2. Fetch Videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', params.id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (videosError) throw videosError
      setVideos(videosData || [])

      // 3. Calculate Stats
      const totalVideos = videosData?.length || 0
      const totalLikes = videosData?.reduce((acc, curr) => acc + (curr.likes || 0), 0) || 0
      // Assuming 'downloads' column is added, otherwise 0
      const totalDownloads = videosData?.reduce((acc, curr) => acc + (curr.downloads || 0), 0) || 0

      setStats({
        totalVideos,
        totalLikes,
        totalDownloads
      })

    } catch (error) {
      console.error("Error fetching profile:", error)
      // If profile not found, we might want to show 404, but for now just log
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return notFound()
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      {/* Header / Cover */}
      <div className="h-48 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-b border-white/5"></div>

      <div className="container mx-auto px-4 -mt-20 mb-12 flex-1">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Profile Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-[#0B1120] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center relative overflow-hidden">
                <Avatar className="w-32 h-32 border-4 border-[#0B1120] shadow-xl mb-4">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-2xl bg-blue-600">{profile.username?.[0]?.toUpperCase() || <User />}</AvatarFallback>
                </Avatar>
                
                <h1 className="text-2xl font-bold mb-1">{profile.username || "Unknown User"}</h1>
                <p className="text-gray-400 text-sm mb-4">{profile.role === 'admin' ? '管理员' : '创作者'}</p>
                
                {profile.role === 'admin' && (
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 mb-4">
                        官方认证
                    </Badge>
                )}

                <div className="grid grid-cols-3 gap-4 w-full border-t border-white/10 pt-4 mt-2">
                    <div>
                        <div className="text-lg font-bold text-white">{stats.totalVideos}</div>
                        <div className="text-xs text-gray-400">作品</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white">{stats.totalLikes}</div>
                        <div className="text-xs text-gray-400">获赞</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-white">{stats.totalDownloads}</div>
                        <div className="text-xs text-gray-400">下载</div>
                    </div>
                </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 w-full">
             <div className="mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Video className="w-5 h-5 text-blue-500" />
                    发布的作品
                </h2>
             </div>

             {videos.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            {...video}
                            user_avatar={profile.avatar_url}
                            author={profile.username}
                        />
                    ))}
                 </div>
             ) : (
                 <div className="text-center py-20 bg-[#0B1120] rounded-xl border border-white/5">
                     <p className="text-gray-400">该用户暂未发布任何作品</p>
                 </div>
             )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
