"use client"

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ThumbsUp, Download, Coffee, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TipModal } from "./TipModal";
import { AddToCollectionModal } from "./AddToCollectionModal";
import { ReportModal } from "./ReportModal";
import { SocialShare } from "./SocialShare";
import { useAuthStore } from "@/store/useAuthStore";

interface VideoInteractionsProps {
  videoId: string;
  initialLikes: number;
  currentUser: any;
  videoUrl: string;
  videoTitle?: string;
  downloadUrl?: string;
  authorId?: string;
  authorName?: string;
  children?: React.ReactNode;
}

export function VideoInteractions({ videoId, initialLikes, currentUser, videoUrl, videoTitle, downloadUrl, authorId, authorName = "作者", children }: VideoInteractionsProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const effectiveUser = user || currentUser;
  
  const lastClickTime = useRef(0);
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  useEffect(() => {
    checkLikeStatus();
  }, [videoId, effectiveUser]);

  const checkLikeStatus = async () => {
    if (!effectiveUser) return;
    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("video_id", videoId)
      .eq("user_id", effectiveUser.id)
      .single();
    
    if (data) setHasLiked(true);
  };

  const handleLike = async () => {
    if (isLoading) return;
    const now = Date.now();
    if (now - lastClickTime.current < 1000) return; // Simple 1s throttle
    lastClickTime.current = now;

    if (!effectiveUser) {
      toast.error("请先登录后操作")
      router.push("/auth");
      return;
    }

    // Optimistic update
    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes(prev => newHasLiked ? prev + 1 : prev - 1);

    try {
      if (!newHasLiked) {
        await supabase
            .from("likes")
            .delete()
            .eq("video_id", videoId)
            .eq("user_id", effectiveUser.id);
      } else {
        await supabase
            .from("likes")
            .insert({
            video_id: videoId,
            user_id: effectiveUser.id
            });

        // Notification for Like
        if (authorId && effectiveUser.id !== authorId) {
            await supabase.from("notifications").insert({
                user_id: authorId,
                actor_id: effectiveUser.id,
                type: "like",
                resource_id: videoId,
                resource_type: "video",
                content: `赞了你的视频${videoTitle ? `: ${videoTitle}` : ''}`,
                is_read: false
            });
        }
      }
    } catch (error) {
      // Revert on error
      setHasLiked(!newHasLiked);
      setLikes(prev => !newHasLiked ? prev + 1 : prev - 1);
      console.error("Error toggling like:", error);
    }
  };

  const handleDownload = async () => {
    try {
        // 1. Increment counter
        await supabase.rpc('increment_downloads', { video_id: videoId });

        // 2. Record history if logged in
        if (effectiveUser) {
            const { error } = await supabase.from('user_downloads').insert({
                user_id: effectiveUser.id,
                video_id: videoId
            });
            if (error) console.error("Error recording download history:", error);

            // Notification for Download
            if (authorId && effectiveUser.id !== authorId) {
                await supabase.from("notifications").insert({
                    user_id: authorId,
                    actor_id: effectiveUser.id,
                    type: "system",
                    resource_id: videoId,
                    resource_type: "video",
                    content: `下载了你的视频${videoTitle ? `: ${videoTitle}` : ''}`,
                    is_read: false
                });
            }
        }
    } catch (error) {
      console.error("Error incrementing downloads:", error);
      toast.error("下载统计失败");
    }
  };

  return (
    <div className="space-y-8">
      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Button 
            variant="secondary" 
            className={cn("bg-secondary/50 hover:bg-secondary border-0 text-foreground", hasLiked && "text-primary bg-primary/10 hover:bg-primary/20")}
            onClick={handleLike}
            disabled={isLoading}
          >
            <ThumbsUp className={cn("h-4 w-4 mr-2", hasLiked && "fill-primary")} />
            {likes}
          </Button>
          
          <AddToCollectionModal videoId={videoId} />

          <SocialShare url={typeof window !== 'undefined' ? window.location.href : videoUrl} title={videoTitle} />
          
          <a href={downloadUrl || videoUrl} download target="_blank" rel="noopener noreferrer" onClick={handleDownload}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
          <Download className="h-4 w-4 mr-2" />
          下载
        </Button>
          </a>
          
          <Button 
          className="bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 border-0"
          disabled={isLoading}
            onClick={() => {
                if (isLoading) return;
                if (!effectiveUser) {
                    toast.error("请先登录后打赏")
                    router.push("/auth");
                    return;
                }
                setIsTipModalOpen(true);
            }}
          >
            <Coffee className="h-4 w-4 mr-2" />
            请作者喝咖啡
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground hover:text-destructive hover:bg-accent" 
            title="举报视频"
            onClick={() => setIsReportModalOpen(true)}
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <TipModal 
        videoId={videoId}
        authorName={authorName}
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resourceId={videoId}
        resourceType="video"
      />

      {children}
    </div>
  );
}
