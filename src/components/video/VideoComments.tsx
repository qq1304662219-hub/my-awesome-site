"use client"

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, MessageCircle, Flag } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ReportModal } from "./ReportModal";
import { useRouter } from "next/navigation";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  profiles: {
    full_name: string;
    avatar_url: string;
  } | null;
  replies?: Comment[];
}

interface VideoCommentsProps {
  videoId: string;
  currentUser: any;
  authorId?: string;
}

const CommentItem = ({ 
  comment, 
  currentUser, 
  replyingTo, 
  setReplyingTo, 
  replyContent, 
  setReplyContent, 
  onReplySubmit, 
  submitting, 
  onReport,
  depth = 0
}: any) => {
  const isReplying = replyingTo === comment.id;
  
  return (
    <div className={`space-y-3 ${depth > 0 ? 'mt-3' : ''}`}>
       <div className={`flex gap-3 p-3 rounded-lg ${depth === 0 ? 'bg-white/5' : ''} border border-white/5 group relative`}>
          <Link href={`/profile/${comment.user_id}`}>
             <Avatar className={`${depth === 0 ? 'h-10 w-10' : 'h-8 w-8'} cursor-pointer hover:opacity-80 transition-opacity`}>
                <AvatarImage src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user_id}`} />
                <AvatarFallback>U</AvatarFallback>
             </Avatar>
          </Link>
          
          <div className="flex-1">
             <div className="flex items-center justify-between mb-1">
                <Link href={`/profile/${comment.user_id}`} className="font-semibold text-sm hover:text-blue-400 transition-colors">
                   {comment.profiles?.full_name || `User ${comment.user_id.slice(0, 6)}`}
                </Link>
                <span className="text-xs text-gray-500 flex items-center gap-2">
                   {new Date(comment.created_at).toLocaleDateString()}
                   <button 
                      className="hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                      onClick={() => {
                          setReplyingTo(isReplying ? null : comment.id);
                          setReplyContent("");
                      }}
                      title="回复"
                   >
                      <MessageCircle className="h-3 w-3" />
                      回复
                   </button>
                   <button 
                      className="hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onReport(comment.id)}
                      title="举报"
                   >
                      <Flag className="h-3 w-3" />
                   </button>
                </span>
             </div>
             
             <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>

             {isReplying && (
                <div className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-2">
                   <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.user_metadata?.avatar_url} />
                      <AvatarFallback>ME</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 space-y-2">
                      <Textarea 
                         placeholder={`回复 @${comment.profiles?.full_name || 'User'}...`}
                         value={replyContent}
                         onChange={(e) => setReplyContent(e.target.value)}
                         className="bg-white/5 border-white/10 text-white min-h-[60px] text-sm"
                         autoFocus
                      />
                      <div className="flex justify-end gap-2">
                         <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => setReplyingTo(null)}
                            className="text-gray-400 hover:text-white"
                         >
                            取消
                         </Button>
                         <Button 
                            size="sm"
                            onClick={() => onReplySubmit(comment.id)} 
                            disabled={!replyContent.trim() || submitting}
                            className="bg-blue-600 hover:bg-blue-700"
                         >
                            {submitting ? "发送中..." : "回复"}
                         </Button>
                      </div>
                   </div>
                </div>
             )}
          </div>
       </div>

       {comment.replies && comment.replies.length > 0 && (
          <div className={`pl-4 ${depth > 0 ? 'border-l border-white/10 ml-2' : ''}`}>
             {comment.replies.map((reply: any) => (
                <CommentItem 
                   key={reply.id} 
                   comment={reply} 
                   currentUser={currentUser}
                   replyingTo={replyingTo}
                   setReplyingTo={setReplyingTo}
                   replyContent={replyContent}
                   setReplyContent={setReplyContent}
                   onReplySubmit={onReplySubmit}
                   submitting={submitting}
                   onReport={onReport}
                   depth={depth + 1}
                />
             ))}
          </div>
       )}
    </div>
  );
};

export function VideoComments({ videoId, currentUser, authorId }: VideoCommentsProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{id: string, type: 'video' | 'comment'}>({id: videoId, type: 'comment'});

  useEffect(() => {
    fetchComments();
  }, [videoId]);

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
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const rawComments = data as Comment[];
      setTotalCount(rawComments.length);
      const commentMap = new Map<string, Comment>();
      const rootComments: Comment[] = [];

      // Initialize map
      rawComments.forEach(comment => {
          comment.replies = [];
          commentMap.set(comment.id, comment);
      });

      // Build tree
      rawComments.forEach(comment => {
          if (comment.parent_id) {
              const parent = commentMap.get(comment.parent_id);
              if (parent) {
                  parent.replies?.push(comment);
              }
          } else {
              rootComments.push(comment);
          }
      });

      // Sort: Newest root comments first
      rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setComments(rootComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (parentId: string | null = null) => {
    if (!currentUser) {
      router.push("/auth");
      return;
    }

    if (!currentUser.email_confirmed_at) {
      toast.error("请先验证邮箱才能评论");
      return;
    }

    const content = parentId ? replyContent : newComment;

    if (!content.trim()) return;

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert({
          video_id: videoId,
          user_id: currentUser.id,
          content: content.trim(),
          parent_id: parentId
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger Notification if not self-comment
      if (authorId && currentUser.id !== authorId) {
          await supabase.from("notifications").insert({
              user_id: authorId,
              actor_id: currentUser.id,
              type: "comment",
              resource_id: videoId.toString(),
              resource_type: "video",
              content: `评论了你的视频: ${content.trim().substring(0, 50)}${content.length > 50 ? '...' : ''}`
          });
      }
      
      // If replying, also notify the parent comment author if different
      if (parentId) {
          let parentAuthorId = null;
          // Flatten tree search or recursive search to find parent author
          // Since we have the map in memory during fetch, but here we only have state.
          // We can just query supabase or search state.
          // Searching state:
          const findComment = (comments: Comment[], id: string): Comment | null => {
              for (const c of comments) {
                  if (c.id === id) return c;
                  if (c.replies) {
                      const found = findComment(c.replies, id);
                      if (found) return found;
                  }
              }
              return null;
          };
          
          const parentComment = findComment(comments, parentId);
          if (parentComment) {
             parentAuthorId = parentComment.user_id;
          }

          if (parentAuthorId && parentAuthorId !== currentUser.id && parentAuthorId !== authorId) {
             await supabase.from("notifications").insert({
                user_id: parentAuthorId,
                actor_id: currentUser.id,
                type: "reply",
                resource_id: videoId.toString(),
                resource_type: "video",
                content: `回复了你的评论: ${content.trim().substring(0, 50)}${content.length > 50 ? '...' : ''}`
            });
          }
      }

      fetchComments();
      if (parentId) {
          setReplyContent("");
          setReplyingTo(null);
      } else {
          setNewComment("");
      }
      toast.success("评论发表成功");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("评论发表失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resourceId={reportTarget.id}
        resourceType={reportTarget.type}
      />

      <h3 className="text-xl font-bold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        评论 ({totalCount})
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
              onClick={() => handleCommentSubmit(null)} 
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
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyContent={replyContent}
              setReplyContent={setReplyContent}
              onReplySubmit={handleCommentSubmit}
              submitting={submitting}
              onReport={(commentId: string) => {
                  setReportTarget({id: commentId, type: 'comment'});
                  setIsReportModalOpen(true);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
