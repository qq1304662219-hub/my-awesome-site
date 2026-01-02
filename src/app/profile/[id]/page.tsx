"use client"

import { useEffect, useState, use } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VideoCard } from "@/components/shared/VideoCard"
import { Loader2, Video, Heart, Download, User, Folder, MessageSquare, MapPin, Users, Activity, MoreHorizontal, Plus, CheckCircle, Eye, ChevronRight, Trophy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { notFound } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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
  const [isFollowing, setIsFollowing] = useState(false)
  const [stats, setStats] = useState({
    totalVideos: 0,
    totalLikes: 0,
    totalDownloads: 0,
    followersCount: 0,
    followingCount: 0,
    viewsCount: 0
  })

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
        setCurrentUser(user)
        if (user) checkFollowStatus(user.id)
    })
    fetchProfileAndVideos()
  }, [id])

  const checkFollowStatus = async (currentUserId: string) => {
      const { data } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', currentUserId)
          .eq('following_id', id)
          .single()
      setIsFollowing(!!data)
  }

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
            .filter((v: any) => v !== null)
            setLikedVideos(liked)
      }

      // 4. Fetch Collections
      let collectionsQuery = supabase
        .from('collections')
        .select('*, collection_items(count)')
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser?.id !== id) {
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
      const totalDownloads = videosData?.reduce((acc, curr) => acc + (curr.downloads || 0), 0) || 0
      const totalViews = videosData?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0
      
      // Fetch exact follower count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', id)

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', id)

      setStats({
        totalVideos,
        totalLikes,
        totalDownloads,
        followersCount: followersCount || 0,
        followingCount: followingCount || 0,
        viewsCount: totalViews
      })

    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUser) {
        toast.error("请先登录")
        return
    }
    if (currentUser.id === id) return;

    try {
        if (isFollowing) {
            await supabase.from('follows').delete()
                .eq('follower_id', currentUser.id)
                .eq('following_id', id)
            setIsFollowing(false)
            setStats(prev => ({ ...prev, followersCount: prev.followersCount - 1 }))
            toast.success("已取消关注")
        } else {
            await supabase.from('follows').insert({
                follower_id: currentUser.id,
                following_id: id
            })
            setIsFollowing(true)
            setStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }))
            toast.success("关注成功")
            
            // Send notification
            if (currentUser.id !== id) {
                await supabase.from('notifications').insert({
                    user_id: id,
                    actor_id: currentUser.id,
                    type: 'follow',
                    content: '关注了你',
                    is_read: false
                })
            }
        }
    } catch (e) {
        console.error(e)
        toast.error("操作失败")
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
      
      <main className="flex-1 container mx-auto px-4 pt-32 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
            {/* Left Sidebar: Profile Card */}
            <aside className="space-y-6">
                <div className="bg-[#0f172a] rounded-2xl border border-white/10 overflow-hidden relative group">
                    {/* Cover/Background Effect */}
                    <div className="h-32 bg-gradient-to-b from-blue-900/20 to-[#0f172a] relative">
                        <div className="absolute top-4 right-4">
                             <Button variant="ghost" size="icon" className="text-white/50 hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="px-6 pb-8 -mt-12 relative">
                         {/* Avatar */}
                        <div className="relative inline-block mb-4">
                            <Avatar className="w-24 h-24 border-4 border-[#0f172a] shadow-xl">
                                <AvatarImage src={profile.avatar_url} />
                                <AvatarFallback className="text-2xl bg-blue-900/50 text-blue-200">
                                    {profile.username?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {profile.is_verified && (
                                <div className="absolute bottom-1 right-1 bg-[#0f172a] rounded-full p-1">
                                    <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500/20" />
                                </div>
                            )}
                        </div>

                        {/* Name & Badge */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-white truncate">{profile.username || "Unknown User"}</h1>
                                {profile.role === 'admin' && (
                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-1.5 py-0.5 h-5 text-[10px]">
                                        <Trophy className="w-3 h-3 mr-1" /> 官方
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                                <span>{profile.job_title || "创作者"}</span>
                                <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                <span className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {profile.location || "未知地区"}
                                </span>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">
                                {profile.bio || "这个人很懒，什么都没有写..."}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 mb-8">
                             {currentUser && currentUser.id !== profile.id ? (
                                <>
                                    <Button 
                                        className={cn(
                                            "w-full font-medium transition-all",
                                            isFollowing 
                                                ? "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10" 
                                                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20"
                                        )}
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2" />
                                                已关注
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 mr-2" />
                                                关注
                                            </>
                                        )}
                                    </Button>
                                    <Link href={`/dashboard/messages/${profile.id}`} className="w-full">
                                        <Button variant="outline" className="w-full border-white/10 text-gray-300 hover:bg-white/5 hover:text-white bg-transparent">
                                            联系合作
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <Button variant="outline" className="w-full col-span-2 border-white/10 text-gray-300 hover:bg-white/5">
                                    编辑资料
                                </Button>
                            )}
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4 py-6 border-t border-white/5">
                            <div className="text-center">
                                <div className="text-lg font-bold text-white mb-1">{stats.viewsCount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">人气</div>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <div className="text-lg font-bold text-white mb-1">{stats.followersCount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">粉丝</div>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <div className="text-lg font-bold text-white mb-1">{stats.followingCount.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">关注</div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="space-y-4 pt-6 border-t border-white/5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">身份认证</span>
                                <span className="text-gray-300 flex items-center">
                                    {profile.is_verified ? (
                                        <>
                                            <CheckCircle className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                                            已认证
                                        </>
                                    ) : (
                                        "未认证"
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">加入时间</span>
                                <span className="text-gray-300">
                                    {new Date(profile.created_at).getFullYear()}年
                                    {new Date(profile.created_at).getMonth() + 1}月
                                </span>
                            </div>
                             <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">IP属地</span>
                                <span className="text-gray-300">{profile.location || "未知"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Right Content */}
            <div className="min-w-0">
                <Tabs defaultValue="videos" className="w-full">
                    <div className="bg-[#0f172a] border border-white/10 rounded-xl mb-6 px-2 sticky top-24 z-30 shadow-xl shadow-black/20 backdrop-blur-xl bg-[#0f172a]/90">
                        <TabsList className="w-full justify-start h-14 bg-transparent p-0">
                            <TabsTrigger 
                                value="videos" 
                                className="h-full rounded-none border-b-2 border-transparent px-6 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 font-medium transition-all"
                            >
                                创作
                                <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-gray-400 data-[state=active]:text-blue-400">
                                    {videos.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="likes" 
                                className="h-full rounded-none border-b-2 border-transparent px-6 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 font-medium transition-all"
                            >
                                喜欢
                                <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-gray-400 data-[state=active]:text-blue-400">
                                    {likedVideos.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger 
                                value="collections" 
                                className="h-full rounded-none border-b-2 border-transparent px-6 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 font-medium transition-all"
                            >
                                收藏
                                <span className="ml-2 text-xs bg-white/10 px-1.5 py-0.5 rounded-full text-gray-400 data-[state=active]:text-blue-400">
                                    {collections.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="videos" className="mt-0 space-y-6">
                        {/* Filters (Mock) */}
                        <div className="flex items-center justify-between text-sm text-gray-500 px-1">
                            <div className="flex items-center gap-4">
                                <span className="text-white font-medium">全部</span>
                                <span className="hover:text-white cursor-pointer transition-colors">视频</span>
                                <span className="hover:text-white cursor-pointer transition-colors">图片</span>
                            </div>
                            <div className="flex items-center cursor-pointer hover:text-white transition-colors">
                                按时间排序 <ChevronRight className="w-3 h-3 ml-1" />
                            </div>
                        </div>

                        {videos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {videos.map((video) => (
                                    <VideoCard 
                                        key={video.id}
                                        {...video}
                                        author={profile.username}
                                        user_avatar={profile.avatar_url}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-[#0f172a] rounded-xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Video className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">暂无发布作品</h3>
                                <p className="text-gray-500">该创作者还没有发布任何内容</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="likes" className="mt-0">
                        {likedVideos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {likedVideos.map((video) => (
                                    <VideoCard 
                                        key={video.id}
                                        {...video}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-[#0f172a] rounded-xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Heart className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">暂无喜欢内容</h3>
                                <p className="text-gray-500">该创作者还没有标记喜欢的视频</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="collections" className="mt-0">
                         {collections.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {collections.map((collection) => (
                                    <Link key={collection.id} href={`/collections/${collection.id}`} className="group block">
                                        <div className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden aspect-[4/3] relative mb-3">
                                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                                <Folder className="w-12 h-12 text-gray-600" />
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white font-medium">查看收藏夹</span>
                                            </div>
                                        </div>
                                        <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors truncate">{collection.name}</h3>
                                        <p className="text-sm text-gray-500">{collection.collection_items?.[0]?.count || 0} 个内容</p>
                                    </Link>
                                ))}
                            </div>
                         ) : (
                            <div className="text-center py-32 bg-[#0f172a] rounded-xl border border-white/5 border-dashed">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Folder className="w-8 h-8 text-gray-500" />
                                </div>
                                <h3 className="text-lg font-medium text-white mb-2">暂无收藏夹</h3>
                                <p className="text-gray-500">该创作者还没有创建公开收藏夹</p>
                            </div>
                         )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}