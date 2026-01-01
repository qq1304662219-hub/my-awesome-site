"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, Play, FileText } from "lucide-react"
import { format } from "date-fns"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuthStore()
  const router = useRouter()
  const [selectedVideo, setSelectedVideo] = useState<any>(null)

  useEffect(() => {
    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
        router.push('/')
        return
    }
    fetchPendingVideos()
  }, [profile, router])

  const fetchPendingVideos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('videos')
        .select(`
            *,
            profiles:user_id (full_name, email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast.error("加载待审核视频失败")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
        const { error } = await supabase
            .from('videos')
            .update({ status: 'published' })
            .eq('id', id)

        if (error) throw error
        toast.success("视频已发布")
        fetchPendingVideos()
        setSelectedVideo(null)
    } catch (error: any) {
        console.error("Approve error:", error)
        toast.error("批准失败: " + error.message)
    }
  }

  const handleReject = async (id: string) => {
      try {
        if (!confirm("确定要拒绝发布该视频吗？")) return

        const { error } = await supabase
            .from('videos')
            .update({ status: 'rejected' })
            .eq('id', id)
        
        if (error) throw error
        toast.success("已拒绝")
        fetchPendingVideos()
        setSelectedVideo(null)
      } catch (error: any) {
        console.error("Reject error:", error)
        toast.error("操作失败: " + error.message)
      }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">视频审核</h1>
      
      {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : videos.length === 0 ? (
          <div className="text-gray-500">暂无待审核视频</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                  <div key={video.id} className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden flex flex-col">
                      <div className="relative aspect-video bg-black group cursor-pointer" onClick={() => setSelectedVideo(video)}>
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                              <Play className="w-12 h-12 text-white opacity-50 group-hover:opacity-100" />
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/50 text-xs px-2 py-1 rounded text-white">
                              {video.duration}
                          </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-white mb-1 truncate">{video.title}</h3>
                          <div className="text-xs text-gray-400 mb-4 flex items-center justify-between">
                              <span>by {video.profiles?.full_name || 'Unknown'}</span>
                              <span>{format(new Date(video.created_at), "MM-dd HH:mm")}</span>
                          </div>
                          
                          <div className="mt-auto flex gap-2">
                              <Button 
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApprove(video.id)}
                              >
                                  <CheckCircle className="w-4 h-4 mr-1" /> 通过
                              </Button>
                              <Button 
                                  className="flex-1" 
                                  variant="destructive"
                                  onClick={() => handleReject(video.id)}
                              >
                                  <XCircle className="w-4 h-4 mr-1" /> 拒绝
                              </Button>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-[#0f172a] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>{selectedVideo?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                    {selectedVideo && (
                        <video 
                            src={selectedVideo.url} 
                            controls 
                            className="w-full h-full"
                        />
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                    <div>
                        <span className="text-gray-500 block">Prompt:</span>
                        {selectedVideo?.prompt || 'N/A'}
                    </div>
                    <div>
                        <span className="text-gray-500 block">AI Model:</span>
                        {selectedVideo?.ai_model || 'N/A'}
                    </div>
                    <div>
                        <span className="text-gray-500 block">Description:</span>
                        {selectedVideo?.description || 'N/A'}
                    </div>
                     <div>
                        <span className="text-gray-500 block">Tags:</span>
                        {selectedVideo?.tags?.join(', ') || 'N/A'}
                    </div>
                </div>
                <div className="flex gap-4 justify-end pt-4">
                     <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => selectedVideo && handleApprove(selectedVideo.id)}
                      >
                          通过审核
                      </Button>
                      <Button 
                          variant="destructive"
                          onClick={() => selectedVideo && handleReject(selectedVideo.id)}
                      >
                          拒绝
                      </Button>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
