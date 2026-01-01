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
  const lastClickTime = useRef(0);
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  useEffect(() => {
    checkLikeStatus();
  }, [videoId]);

  const checkLikeStatus = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("video_id", videoId)
      .eq("user_id", currentUser.id)
      .single();
    
    if (data) setHasLiked(true);
  };

  const handleLike = async () => {
    const now = Date.now();
    if (now - lastClickTime.current < 1000) return; // Simple 1s throttle
    lastClickTime.current = now;

    if (!currentUser) {
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
            .eq("user_id", currentUser.id);
      } else {
        await supabase
            .from("likes")
            .insert({
            video_id: videoId,
            user_id: currentUser.id
            });
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
        if (currentUser) {
            const { error } = await supabase.from('user_downloads').insert({
                user_id: currentUser.id,
                video_id: videoId
            });
            if (error) console.error("Error recording download history:", error);
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
            className={cn("bg-white/10 hover:bg-white/20 border-0 text-white", hasLiked && "text-blue-400 bg-blue-500/10")}
            onClick={handleLike}
          >
            <ThumbsUp className={cn("h-4 w-4 mr-2", hasLiked && "fill-blue-400")} />
            {likes}
          </Button>
          
          <AddToCollectionModal videoId={videoId} />

          <SocialShare url={typeof window !== 'undefined' ? window.location.href : videoUrl} title={videoTitle} />
          
          <a href={downloadUrl || videoUrl} download target="_blank" rel="noopener noreferrer" onClick={handleDownload}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="h-4 w-4 mr-2" />
              下载
            </Button>
          </a>
          
          <Button 
            className="bg-yellow-500 hover:bg-yellow-600 text-white border-0"
            onClick={() => {
                if (!currentUser) {
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
            className="text-gray-400 hover:text-red-400 hover:bg-white/10" 
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
