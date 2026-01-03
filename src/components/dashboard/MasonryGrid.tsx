"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, Play, MoreVertical, X } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { deleteVideoWithStorage } from "@/lib/storage-utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Video {
  id: string
  url: string
  title: string
  thumbnail_url?: string
  created_at: string
}

export function MasonryGrid({ videos, onVideoDeleted }: { videos: Video[], onVideoDeleted: () => void }) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (video: Video) => {
    if (!confirm("确定要删除这个素材吗？")) return

    setIsDeleting(true)
    try {
      await deleteVideoWithStorage(supabase, video.id)
      
      toast.success("删除成功")
      setSelectedVideo(null)
      onVideoDeleted()
    } catch (error: any) {
      toast.error("删除失败: " + error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Check if url is video or image (simple check)
  const isVideo = (url: string) => url.match(/\.(mp4|webm|mov)$/i)

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4 pb-20">
      {videos.map((video) => (
        <div 
          key={video.id} 
          className="break-inside-avoid relative group rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all hover:transform hover:-translate-y-1 cursor-pointer"
          onClick={() => setSelectedVideo(video)}
        >
          <div className="relative">
            {isVideo(video.url) ? (
              <video 
                src={video.url} 
                className="w-full h-auto object-cover"
                muted
                onMouseOver={e => e.currentTarget.play()}
                onMouseOut={e => {
                    e.currentTarget.pause()
                    e.currentTarget.currentTime = 0
                }}
              />
            ) : (
              <img 
                src={video.url} 
                alt={video.title} 
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
               <h3 className="text-white font-medium truncate">{video.title}</h3>
               <p className="text-xs text-gray-300">{new Date(video.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Detail Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-background/95 border-border p-0 overflow-hidden">
          <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center bg-black/5 dark:bg-black">
             {selectedVideo && (
                 isVideo(selectedVideo.url) ? (
                     <video src={selectedVideo.url} controls className="max-w-full max-h-full" autoPlay />
                 ) : (
                     <img src={selectedVideo.url} alt={selectedVideo.title} className="max-w-full max-h-full object-contain" />
                 )
             )}
             
             {/* Delete Button */}
             <div className="absolute top-4 right-4 flex gap-2">
                 <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={(e) => {
                        e.stopPropagation()
                        if (selectedVideo) handleDelete(selectedVideo)
                    }}
                    disabled={isDeleting}
                 >
                     <Trash2 className="h-4 w-4" />
                 </Button>
                 <DialogClose asChild>
                     <Button variant="secondary" size="icon" className="bg-secondary/80 hover:bg-secondary text-secondary-foreground border-0">
                         <X className="h-4 w-4" />
                     </Button>
                 </DialogClose>
             </div>
          </div>
          <div className="p-4 bg-card border-t border-border">
              <h2 className="text-xl font-bold text-foreground mb-1">{selectedVideo?.title}</h2>
              <p className="text-muted-foreground text-sm">Created at {selectedVideo && new Date(selectedVideo.created_at).toLocaleString()}</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
