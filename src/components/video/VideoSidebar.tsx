"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Download, 
  Share2, 
  ShieldCheck, 
  AlertCircle, 
  FileVideo, 
  Maximize2, 
  Clock,
  HardDrive
} from "lucide-react"
import { LicenseSelector } from "@/components/video/LicenseSelector"
import { FollowButton } from "@/components/profile/FollowButton"
import { formatBytes } from "@/lib/utils"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"

import { supabase } from "@/lib/supabase"

interface VideoSidebarProps {
  video: any
  authorProfile: any
  currentUser: any
  downloadUrl?: string
}

export function VideoSidebar({ video, authorProfile, currentUser, downloadUrl }: VideoSidebarProps) {
  const [selectedLicense, setSelectedLicense] = useState<'personal' | 'commercial'>('personal')
  const { user } = useAuthStore()
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)

  const handleDownloadClick = async () => {
    if (!user) {
        toast.error("请先登录")
        router.push('/auth?tab=login')
        return
    }

    setDownloading(true)
    try {
        // 1. Increment counter
        await supabase.rpc('increment_downloads', { video_id: video.id });

        // 2. Record history
        const { error } = await supabase.from('user_downloads').insert({
            user_id: user.id,
            video_id: video.id
        });
        
        if (error) console.error("Error recording download history:", error);

        // 3. Notification for Author
        if (video.user_id && user.id !== video.user_id) {
            await supabase.from("notifications").insert({
                user_id: video.user_id,
                actor_id: user.id,
                type: "system",
                resource_id: video.id,
                resource_type: "video",
                content: `下载了你的视频${video.title ? `: ${video.title}` : ''}`,
                is_read: false
            });
        }

        // 4. Trigger Download
        const link = document.createElement('a');
        link.href = downloadUrl || video.url;
        link.download = video.title || 'video.mp4';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("开始下载");
    } catch (error) {
        console.error("Download error:", error);
        toast.error("下载失败，请稍后重试");
    } finally {
        setDownloading(false)
    }
  }

  const isOwner = user?.id === video.user_id

  return (
    <div className="space-y-6">
      {/* 1. Action Box (Download/Buy) */}
      <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">获取素材</h3>
          <Badge variant="outline" className="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
            {video.price > 0 ? `¥${video.price}` : '免费'}
          </Badge>
        </div>

        {/* License Selection if price > 0 */}
        {video.price > 0 && !isOwner && (
             <div className="mb-6">
                <LicenseSelector 
                    videoId={video.id}
                    title={video.title}
                    thumbnail={video.thumbnail_url}
                    selected={selectedLicense} 
                    onChange={(val) => setSelectedLicense(val as 'personal' | 'commercial')} 
                    price={video.price}
                    minimal={true}
                />
             </div>
        )}

        <Button 
            onClick={handleDownloadClick}
            disabled={downloading}
            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]"
        >
            {downloading ? (
                <>
                    <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    准备下载...
                </>
            ) : (
                <>
                    <Download className="mr-2 h-5 w-5" />
                    {isOwner ? '下载源文件' : (video.price > 0 ? '购买并下载' : '立即下载')}
                </>
            )}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            官方正版授权 · 永久商用保障
        </p>
      </div>

      {/* 2. Author Profile */}
      <div className="bg-card border border-border rounded-xl p-5">
         <div className="flex items-center gap-3 mb-4">
            <Link href={`/profile/${authorProfile?.id}`}>
                <Avatar className="h-12 w-12 border-2 border-border hover:border-blue-500/50 transition-colors">
                    <AvatarImage src={authorProfile?.avatar_url} />
                    <AvatarFallback>{authorProfile?.full_name?.[0] || 'A'}</AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
                <Link href={`/profile/${authorProfile?.id}`} className="block">
                    <h4 className="font-medium text-foreground hover:text-blue-400 transition-colors truncate">
                        {authorProfile?.full_name || 'Unknown Creator'}
                    </h4>
                </Link>
                <p className="text-xs text-muted-foreground truncate">
                    {authorProfile?.bio || '这位创作者很神秘，还没有写简介'}
                </p>
            </div>
         </div>
         <FollowButton 
            authorId={video.user_id} 
            className="w-full"
         />
      </div>

      {/* 3. Video Specs */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">参数信息</h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
                <span className="text-muted-foreground text-xs block flex items-center gap-1"><Maximize2 className="h-3 w-3" /> 分辨率</span>
                <span className="text-foreground font-mono">{video.width && video.height ? `${video.width}x${video.height}` : video.resolution || '4K'}</span>
            </div>
            <div className="space-y-1">
                <span className="text-muted-foreground text-xs block flex items-center gap-1"><FileVideo className="h-3 w-3" /> 格式</span>
                <span className="text-foreground font-mono uppercase">{video.format || 'MP4'}</span>
            </div>
            <div className="space-y-1">
                <span className="text-muted-foreground text-xs block flex items-center gap-1"><Clock className="h-3 w-3" /> 时长</span>
                <span className="text-foreground font-mono">{video.duration ? `${Math.round(video.duration)}s` : '--'}</span>
            </div>
             <div className="space-y-1">
                <span className="text-muted-foreground text-xs block flex items-center gap-1"><HardDrive className="h-3 w-3" /> 大小</span>
                <span className="text-foreground font-mono">{video.size ? formatBytes(video.size) : '--'}</span>
            </div>
        </div>

        <Separator className="bg-border" />
        
        <div className="space-y-2">
            <span className="text-muted-foreground text-xs block">AI 模型</span>
            <div className="flex flex-wrap gap-2">
                {video.ai_model ? (
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 border-purple-500/20">
                        {video.ai_model}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">未标注</span>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
