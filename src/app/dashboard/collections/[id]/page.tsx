"use client"

import { useState, useEffect, use } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { VideoCard } from "@/components/shared/VideoCard"
import { Loader2, ArrowLeft, MoreHorizontal, Globe, Lock, Trash2, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CollectionDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuthStore()
  const [collection, setCollection] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCollectionAndVideos()
  }, [id])

  const fetchCollectionAndVideos = async () => {
    try {
      // 1. Fetch Collection Info
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select(`
            *,
            profiles:user_id(username, avatar_url)
        `)
        .eq('id', id)
        .single()

      if (collectionError) throw collectionError
      setCollection(collectionData)

      // 2. Fetch Videos in Collection
      const { data: itemsData, error: itemsError } = await supabase
        .from('collection_items')
        .select(`
            video_id,
            videos (*)
        `)
        .eq('collection_id', params.id)
        .order('created_at', { ascending: false })

      if (itemsError) throw itemsError
      
      // Transform data structure
      const videosList = itemsData
        .map(item => item.videos)
        .filter(v => v !== null) // Filter out deleted videos
      
      setVideos(videosList)

    } catch (error) {
      console.error("Error fetching collection:", error)
      // toast.error("获取收藏夹详情失败")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (videoId: number) => {
      try {
          const { error } = await supabase
              .from('collection_items')
              .delete()
              .eq('collection_id', params.id)
              .eq('video_id', videoId)
          
          if (error) throw error
          
          setVideos(prev => prev.filter(v => v.id !== videoId))
          toast.success("已移除视频")
      } catch (error) {
          console.error("Error removing video:", error)
          toast.error("移除失败")
      }
  }

  const handleDeleteCollection = async () => {
      if (!confirm("确定要删除此收藏夹吗？")) return
      try {
          const { error } = await supabase.from('collections').delete().eq('id', params.id)
          if (error) throw error
          toast.success("收藏夹已删除")
          router.push('/dashboard/collections')
      } catch (error) {
          console.error("Error deleting collection:", error)
          toast.error("删除失败")
      }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!collection) {
    return notFound()
  }

  const isOwner = user?.id === collection.user_id

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-12 flex-1">
        <div className="mb-8">
            <Link href="/dashboard/collections" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                <ArrowLeft className="h-4 w-4" />
                返回我的收藏
            </Link>
            
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                        {collection.name}
                        {!collection.is_public && <Lock className="h-5 w-5 text-gray-500" />}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>创建者: {collection.profiles?.username || 'Unknown'}</span>
                        <span>•</span>
                        <span>{videos.length} 个视频</span>
                        <span>•</span>
                        <span>{new Date(collection.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                {isOwner && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white">
                            <DropdownMenuItem className="focus:bg-white/10 cursor-pointer text-red-400" onClick={handleDeleteCollection}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除收藏夹
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>

        {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
                <div key={video.id} className="relative group">
                    <VideoCard {...video} />
                    {isOwner && (
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8"
                            onClick={(e) => {
                                e.preventDefault()
                                handleDeleteVideo(video.id)
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-400">收藏夹是空的</p>
                <Link href="/explore">
                    <Button variant="link" className="text-blue-400">去探索视频</Button>
                </Link>
            </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
