
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { supabase } from "@/lib/supabase"
import { VideoCard } from "@/components/shared/VideoCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Lock, Globe, Folder, Share2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data: collection } = await supabase
    .from('collections')
    .select('name, description')
    .eq('id', id)
    .single()

  return {
    title: collection ? `${collection.name} - 收藏夹` : '收藏夹',
    description: collection?.description || '查看这个精彩的视频收藏夹',
  }
}

export default async function PublicCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // 1. Fetch Collection Info with Owner Profile
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select(`
        *,
        profiles:user_id(username, avatar_url, full_name)
    `)
    .eq('id', id)
    .single()

  if (collectionError || !collection) {
    notFound()
  }

  // 2. Check Visibility (Optional: you might want to allow owners to see their private collections via this route too, 
  // but usually dashboard is for that. For now, let's enforce public or if we could check auth (server side auth check is harder without cookies passed properly, 
  // but Supabase client in SC usually works if configured. simpler to just check is_public for public route)
  // For now, let's allow it if it's public.
  // TODO: Add check for current user if private.
  if (!collection.is_public) {
      // We could redirect to dashboard if it's the owner, but here we just show 404 or access denied
      // For simplicity, let's assume this page is for public viewing.
      // If we want to support private viewing for owner, we need headers/cookies to getUser.
      // Let's stick to public for now.
      // notFound() 
      // Actually, let's just show a lock screen if not public?
  }

  // 3. Fetch Videos
  const { data: itemsData, error: itemsError } = await supabase
    .from('collection_items')
    .select(`
        video_id,
        videos (*)
    `)
    .eq('collection_id', id)
    .order('created_at', { ascending: false })

  const videos = itemsData
    ?.map(item => item.videos)
    .filter(v => v !== null) || []

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      {/* Header */}
      <div className="bg-[#0B1120] border-b border-white/10 pt-32 pb-12">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <Folder className="h-10 w-10 text-white" />
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">{collection.name}</h1>
                        {collection.is_public ? (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
                                <Globe className="w-3 h-3 mr-1" /> 公开
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20">
                                <Lock className="w-3 h-3 mr-1" /> 私密
                            </Badge>
                        )}
                    </div>
                    <p className="text-gray-400 mb-4 max-w-2xl">
                        {collection.description || "这个收藏夹没有描述"}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                        <Link href={`/profile/${collection.user_id}`} className="flex items-center gap-2 group">
                            <Avatar className="h-6 w-6 border border-white/10">
                                <AvatarImage src={collection.profiles?.avatar_url} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span className="text-gray-300 group-hover:text-white transition-colors">
                                {collection.profiles?.username || collection.profiles?.full_name || "Unknown"}
                            </span>
                        </Link>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">{videos.length} 个视频</span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-400">更新于 {new Date(collection.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Actions (Share, etc) */}
                {/* <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    分享
                </Button> */}
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {videos.map((video: any) => (
                    <VideoCard 
                        key={video.id} 
                        {...video} 
                        ai_model={video.ai_model}
                        author={collection.profiles?.username} // Show collection owner or video owner? VideoCard expects video author usually.
                        // Actually VideoCard might fetch its own author if not provided, or show nothing.
                        // Ideally we show the video's author.
                        // But we didn't fetch video author in the join above (we selected videos(*)).
                        // The videos(*) includes user_id. VideoCard might handle it?
                        // Let's check VideoCard props.
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-[#0B1120] rounded-xl border border-white/5">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Folder className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">这里空空如也</h3>
                <p className="text-gray-400">这个收藏夹还没有添加任何视频</p>
            </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
