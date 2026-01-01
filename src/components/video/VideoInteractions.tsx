"use client"

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, MessageSquare, Share2, Download, Send, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { TipModal } from "./TipModal";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
}

interface VideoInteractionsProps {
  videoId: string;
  initialLikes: number;
  currentUser: any;
  videoUrl: string;
  downloadUrl?: string;
  authorName?: string;
  children?: React.ReactNode;
}

export function VideoInteractions({ videoId, initialLikes, currentUser, videoUrl, downloadUrl, authorName = "作者", children }: VideoInteractionsProps) {
  const router = useRouter();
  const lastClickTime = useRef(0);
  const [likes, setLikes] = useState(initialLikes);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  
  const isMock = /^[1-4]$/.test(videoId);

  useEffect(() => {
    if (isMock) {
        // Mock data setup
        setComments([
            {
                id: "c1",
                content: "太震撼了！AI 生成的效果越来越好了。",
                created_at: new Date().toISOString(),
                user_id: "u1",
                profiles: { full_name: "ArtLover", avatar_url: "" }
            },
            {
                id: "c2",
                content: "求 prompt！",
                created_at: new Date(Date.now() - 86400000).toISOString(),
                user_id: "u2",
                profiles: { full_name: "TechGeek", avatar_url: "" }
            }
        ]);
        setLoadingComments(false);
        return;
    }

    checkLikeStatus();
    fetchComments();
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

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url
          )
        `)
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };



  const handleLike = async () => {
    const now = Date.now();
    if (now - lastClickTime.current < 1000) return; // Simple 1s throttle
    lastClickTime.current = now;

    if (!currentUser) {
      router.push("/auth");
      return;
    }

    // Optimistic update
    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes(prev => newHasLiked ? prev + 1 : prev - 1);

    if (isMock) return;

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

  const handleCommentSubmit = async () => {
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    
    if (isMock) {
        // Simulate posting for mock video
        setTimeout(() => {
            setComments(prev => [{
                id: `mock_c_${Date.now()}`,
                content: newComment.trim(),
                created_at: new Date().toISOString(),
                user_id: currentUser.id,
                profiles: {
                    full_name: currentUser.user_metadata?.full_name || "Me",
                    avatar_url: currentUser.user_metadata?.avatar_url || ""
                }
            }, ...prev]);
            setNewComment("");
            setSubmitting(false);
        }, 500);
        return;
    }

    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          video_id: videoId,
          user_id: currentUser.id,
          content: newComment.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Optimistic update or refetch. 
      // Since we need profile info which is joined, refetching is safer or we construct it manually.
      // Let's construct manually if we have user info, but fetching profile is better.
      // For now, simple refetch.
      fetchComments();
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("链接已复制到剪贴板");
  };

  const handleDownload = async () => {
    if (isMock) return;
    
    try {
        await supabase.rpc('increment_downloads', { video_id: parseInt(videoId) });
    } catch (error) {
        console.error("Error incrementing downloads:", error);
    }
  };

import { AddToCollectionModal } from "./AddToCollectionModal";

// ... existing imports

// Inside VideoInteractionsProps interface
// No changes needed if we just render it inside

// Inside VideoInteractions component
  return (
    <div className="space-y-8">
      {/* Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            className={cn("bg-white/10 hover:bg-white/20 border-0 text-white", hasLiked && "text-blue-400 bg-blue-500/10")}
            onClick={handleLike}
          >
            <ThumbsUp className={cn("h-4 w-4 mr-2", hasLiked && "fill-blue-400")} />
            {likes}
          </Button>
          
          <AddToCollectionModal videoId={parseInt(videoId)} />

          <Button 
            variant="secondary" 
            className="bg-white/10 hover:bg-white/20 text-white border-0"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            分享
          </Button>
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
                    router.push("/auth");
                    return;
                }
                setIsTipModalOpen(true);
            }}
          >
            <Coffee className="h-4 w-4 mr-2" />
            请作者喝咖啡
          </Button>
        </div>
      </div>

      <TipModal 
        videoId={videoId}
        authorName={authorName}
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
      />

      {children}

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          评论 ({comments.length})
        </h3>

        {/* Comment Input */}
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
            <AvatarFallback>{currentUser ? "ME" : "?"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea 
              placeholder={currentUser ? "写下你的评论..." : "登录后发表评论"} 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-white/5 border-white/10 text-white min-h-[80px]"
              disabled={!currentUser}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleCommentSubmit} 
                disabled={!newComment.trim() || submitting || !currentUser}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "发送中..." : "发表评论"}
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {loadingComments ? (
            <p className="text-gray-500">加载评论中...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-500">还没有评论，抢沙发！</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <Link href={`/profile/${comment.user_id}`}>
                  <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <Link href={`/profile/${comment.user_id}`} className="font-semibold text-sm hover:text-blue-400 transition-colors">
                      {comment.profiles?.full_name || `User ${comment.user_id.slice(0, 6)}`}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
