"use client"

import { useEffect, useState, use } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VideoCard } from "@/components/shared/VideoCard"
import { Loader2, Video, Heart, Download, User, Folder, MessageSquare, Lock } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params)
  const [profile, setProfile] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [likedVideos, setLikedVideos] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalLikes: 0,
    totalDownloads: 0
  })

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user))
    fetchProfileAndVideos()
  }, [id])

  const fetchProfileAndVideos = async () => {
    if (!id || id === 'undefined' || id === 'null') return

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // 2. Fetch Videos (My Works)
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      if (videosError) throw videosError
      setVideos(videosData || [])

      // 3. Fetch Liked Videos
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select(`
          video_id,
          videos (
            *,
            profiles:user_id (
              username,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      if (likesError) {
          console.error("Error fetching likes:", likesError)
      } else {
          // Extract videos from the join
          const liked = likesData
            .map((item: any) => {
                const video = item.videos;
                if (!video) return null;
                return {
                    ...video,
                    author: video.profiles?.full_name || video.profiles?.username || "Unknown",
                    user_avatar: video.profiles?.avatar_url
                };
            })
            .filter((v: any) => v !== null) // Filter out deleted videos
          setLikedVideos(liked)
      }

      // 4. Fetch Collections
      let collectionsQuery = supabase
        .from('collections')
        .select('*, collection_items(count)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      // If not viewing own profile, only show public collections
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser?.id !== id) {
        collectionsQuery = collectionsQuery.eq('is_public', true)
      }

      const { data: collectionsData, error: collectionsError } = await collectionsQuery

      
      if (collectionsError) {
          console.error("Error fetching collections:", collectionsError)
      } else {
          setCollections(collectionsData || [])
      }

      // 5. Calculate Stats
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

                {currentUser && currentUser.id !== profile.id && (
                    <Link href={`/dashboard/messages/${profile.id}`} className="w-full">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-4">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            发私信
                        </Button>
                    </Link>
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
            <Tabs defaultValue="videos" className="w-full">
                <TabsList className="mb-6 bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="videos" className="data-[state=active]:bg-blue-600">
                        <Video className="w-4 h-4 mr-2" />
                        发布的作品
                    </TabsTrigger>
                    <TabsTrigger value="likes" className="data-[state=active]:bg-blue-600">
                        <Heart className="w-4 h-4 mr-2" />
                        喜欢的视频
                    </TabsTrigger>
                    <TabsTrigger value="collections" className="data-[state=active]:bg-blue-600">
                        <Folder className="w-4 h-4 mr-2" />
                        收藏夹
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="videos" className="mt-0">
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
                </TabsContent>

                <TabsContent value="likes" className="mt-0">
                    {likedVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {likedVideos.map((video) => (
                                <VideoCard
                                    key={video.id}
                                    {...video}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-[#0B1120] rounded-xl border border-white/5">
                            <p className="text-gray-400">该用户暂无喜欢的视频</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="collections" className="mt-0">
                     {collections.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {collections.map((collection) => (
                                <Link href={`/collections/${collection.id}`} key={collection.id}>
                                    <div className="bg-[#0B1120] border border-white/10 rounded-xl p-6 hover:border-blue-500/50 transition-colors cursor-pointer group relative">
                                        {!collection.is_public && (
                                            <div className="absolute top-4 right-4 text-gray-500" title="私密收藏夹">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                                                <Folder className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <Badge variant="secondary" className="bg-white/5 text-gray-400">
                                                {collection.collection_items?.[0]?.count || 0} 个内容
                                            </Badge>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">{collection.name}</h3>
                                        <p className="text-sm text-gray-400">
                                            创建于 {new Date(collection.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                     ) : (
                        <div className="text-center py-20 bg-[#0B1120] rounded-xl border border-white/5">
                            <p className="text-gray-400">该用户暂无公开收藏夹</p>
                        </div>
                     )}
                </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
