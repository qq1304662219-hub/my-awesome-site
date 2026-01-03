"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, Play, FileText, Search, Filter, Wand2 } from "lucide-react"
import { format } from "date-fns"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import {
  CATEGORIES,
  STYLES,
  AI_MODELS,
  MOVEMENTS,
  RATIOS,
  RESOLUTIONS,
  DURATIONS,
  FPS_OPTIONS
} from "@/lib/constants"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuthStore()
  const router = useRouter()
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
        router.push('/')
        return
    }
    fetchVideos()
  }, [profile, router, activeTab])

  const fetchVideos = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('videos')
        .select(`
            *,
            profiles:user_id (username, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (activeTab === 'pending') {
          query = query.eq('status', 'pending')
      } else if (activeTab === 'published') {
          query = query.eq('status', 'published')
      } else if (activeTab === 'rejected') {
          query = query.eq('status', 'rejected')
      }

      const { data, error } = await query

      if (error) throw error
      
      let filteredData = data || []
      if (search) {
          filteredData = filteredData.filter((v: any) => 
            v.title.toLowerCase().includes(search.toLowerCase()) ||
            v.profiles?.username?.toLowerCase().includes(search.toLowerCase())
          )
      }

      setVideos(filteredData)
    } catch (error) {
      console.error("Error fetching videos:", error)
      toast.error("加载视频列表失败")
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

        // Notification
        const video = videos.find(v => v.id === id)
        if (video) {
            await supabase.from('notifications').insert({
                user_id: video.user_id,
                type: 'system',
                content: `您的视频 "${video.title}" 已通过审核并发布`,
                is_read: false,
                resource_id: id,
                resource_type: 'video'
            })
        }

        toast.success("视频已发布")
        fetchVideos()
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

        // Notification
        const video = videos.find(v => v.id === id)
        if (video) {
            await supabase.from('notifications').insert({
                user_id: video.user_id,
                type: 'system',
                content: `您的视频 "${video.title}" 未通过审核`,
                is_read: false,
                resource_id: id,
                resource_type: 'video'
            })
        }

        toast.success("已拒绝")
        fetchVideos()
        setSelectedVideo(null)
      } catch (error: any) {
        console.error("Reject error:", error)
        toast.error("操作失败: " + error.message)
      }
  }

  const handleBackfillMetadata = async () => {
    if (!confirm("确定要为所有视频补充随机标签吗？这将覆盖缺失的字段。此操作主要用于开发测试。")) return
    
    setLoading(true)
    try {
        const { data: allVideos, error: fetchError } = await supabase.from('videos').select('*')
        if (fetchError) throw fetchError

        let updatedCount = 0
        for (const video of allVideos) {
            const updates: any = {}
            
            // Randomize if missing or not in current set
            if (!video.category || !CATEGORIES.some(c => c.value === video.category)) 
                updates.category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].value
            
            if (!video.style || !STYLES.some(s => s.value === video.style)) 
                updates.style = STYLES[Math.floor(Math.random() * STYLES.length)].value
            
            if (!video.ai_model || !AI_MODELS.some(m => m.value === video.ai_model)) 
                updates.ai_model = AI_MODELS[Math.floor(Math.random() * AI_MODELS.length)].value
                
            if (!video.movement || !MOVEMENTS.some(m => m.value === video.movement)) 
                updates.movement = MOVEMENTS[Math.floor(Math.random() * MOVEMENTS.length)].value
                
            if (!video.resolution || !RESOLUTIONS.some(r => r.value === video.resolution)) 
                updates.resolution = RESOLUTIONS[Math.floor(Math.random() * RESOLUTIONS.length)].value
                
            if (!video.ratio || !RATIOS.some(r => r.value === video.ratio)) 
                updates.ratio = RATIOS[Math.floor(Math.random() * RATIOS.length)].value
            
            // Random technical specs if missing
            if (!video.fps) updates.fps = 30
            if (!video.duration) updates.duration = Math.floor(Math.random() * 10) + 2

            if (Object.keys(updates).length > 0) {
                const { error } = await supabase.from('videos').update(updates).eq('id', video.id)
                if (!error) updatedCount++
            }
        }
        
        toast.success(`已更新 ${updatedCount} 个视频的元数据`)
        fetchVideos()
    } catch (error: any) {
        console.error("Backfill error:", error)
        toast.error("操作失败: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">视频审核</h1>
          <p className="text-muted-foreground">管理平台视频内容与发布状态</p>
        </div>
        <Button variant="outline" onClick={handleBackfillMetadata} className="gap-2">
            <Wand2 className="w-4 h-4" />
            一键补全数据
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-muted border border-border">
                <TabsTrigger value="pending">待审核</TabsTrigger>
                <TabsTrigger value="published">已发布</TabsTrigger>
                <TabsTrigger value="rejected">已拒绝</TabsTrigger>
            </TabsList>
        </Tabs>

        <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border w-full md:w-64">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input 
                placeholder="搜索视频..." 
                value={search}
                onChange={(e) => {
                    setSearch(e.target.value)
                    // Debounce or filter locally if data is small, here we rely on re-fetch or local filter in effect? 
                    // Actually fetchVideos filters locally after fetch for search, so trigger fetch or just set search
                }}
                onKeyDown={(e) => e.key === 'Enter' && fetchVideos()}
                className="h-8 bg-transparent border-none text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
            />
        </div>
      </div>
      
      {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : videos.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card rounded-xl border border-border">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无{activeTab === 'pending' ? '待审核' : activeTab === 'published' ? '已发布' : '已拒绝'}视频</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                  <div key={video.id} className="bg-card border border-border rounded-xl overflow-hidden flex flex-col hover:border-primary/50 transition-all group shadow-sm">
                      <div className="relative aspect-video bg-muted cursor-pointer" onClick={() => setSelectedVideo(video)}>
                          <img 
                            src={video.thumbnail_url} 
                            alt={video.title} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                              <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur flex items-center justify-center border border-white/10">
                                <Play className="w-6 h-6 text-white fill-white" />
                              </div>
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-[10px] px-2 py-1 rounded text-white font-mono">
                              {video.duration || '00:00'}
                          </div>
                          <div className="absolute top-2 left-2">
                              <Badge variant="secondary" className={`
                                ${video.status === 'published' ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 
                                  video.status === 'rejected' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 
                                  'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'} backdrop-blur-md border-transparent
                              `}>
                                  {video.status === 'published' ? '已发布' : video.status === 'rejected' ? '已拒绝' : '待审核'}
                              </Badge>
                          </div>
                      </div>
                      
                      <div className="p-4 flex-1 flex flex-col">
                          <h3 className="font-bold text-foreground mb-1 truncate" title={video.title}>{video.title}</h3>
                          <div className="flex items-center gap-2 mb-4">
                              <div className="w-5 h-5 rounded-full bg-muted overflow-hidden">
                                  {video.profiles?.avatar_url && <img src={video.profiles.avatar_url} className="w-full h-full object-cover" />}
                              </div>
                              <span className="text-xs text-muted-foreground truncate">{video.profiles?.username || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{format(new Date(video.created_at), "MM-dd")}</span>
                          </div>
                          
                          {activeTab === 'pending' && (
                              <div className="mt-auto grid grid-cols-2 gap-2">
                                  <Button 
                                      className="bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/20"
                                      size="sm"
                                      onClick={() => handleApprove(video.id)}
                                  >
                                      <CheckCircle className="w-4 h-4 mr-1" /> 通过
                                  </Button>
                                  <Button 
                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20" 
                                      size="sm"
                                      onClick={() => handleReject(video.id)}
                                  >
                                      <XCircle className="w-4 h-4 mr-1" /> 拒绝
                                  </Button>
                              </div>
                          )}
                          {activeTab !== 'pending' && (
                              <div className="mt-auto">
                                  <Button 
                                      variant="outline"
                                      className="w-full border-border hover:bg-muted text-muted-foreground"
                                      size="sm"
                                      onClick={() => setSelectedVideo(video)}
                                  >
                                      查看详情
                                  </Button>
                              </div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}

      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-card border-border text-foreground p-0 overflow-hidden gap-0">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[80vh] md:h-[600px]">
                {/* Video Player Column */}
                <div className="md:col-span-2 bg-black flex items-center justify-center relative">
                    {selectedVideo && (
                        <video 
                            src={selectedVideo.url} 
                            controls 
                            className="max-w-full max-h-full"
                            autoPlay
                        />
                    )}
                </div>

                {/* Info Column */}
                <div className="p-6 bg-card overflow-y-auto border-l border-border">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-xl font-bold leading-tight">{selectedVideo?.title}</DialogTitle>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                             <span>ID: {selectedVideo?.id.slice(0, 8)}</span>
                             <Badge variant="outline" className="text-xs">
                                {selectedVideo?.status}
                             </Badge>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">生成参数 (Prompt)</h4>
                            <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground leading-relaxed font-mono">
                                {selectedVideo?.prompt || 'No prompt available'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">模型</h4>
                                <p className="text-sm text-primary">{selectedVideo?.ai_model || 'Unknown'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">分类</h4>
                                <p className="text-sm text-muted-foreground">{selectedVideo?.category || 'Uncategorized'}</p>
                            </div>
                        </div>

                        {selectedVideo?.description && (
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-2">描述</h4>
                                <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                            </div>
                        )}

                        <div className="pt-6 mt-auto border-t border-border flex flex-col gap-3">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                                onClick={() => selectedVideo && handleApprove(selectedVideo.id)}
                                disabled={selectedVideo?.status === 'published'}
                            >
                                {selectedVideo?.status === 'published' ? '已发布' : '通过审核'}
                            </Button>
                            <Button 
                                variant="destructive"
                                className="w-full"
                                onClick={() => selectedVideo && handleReject(selectedVideo.id)}
                                disabled={selectedVideo?.status === 'rejected'}
                            >
                                {selectedVideo?.status === 'rejected' ? '已拒绝' : '拒绝发布'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
