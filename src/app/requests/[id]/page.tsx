"use client"

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Clock, User, CheckCircle2, Video, Trophy, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Submission form state
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [submissionVideoId, setSubmissionVideoId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    // Fetch request details
    const { data: req, error: reqError } = await supabase
      .from('requests')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (reqError) {
      console.error("Error fetching request:", reqError);
      return;
    }
    setRequest(req);

    // Fetch submissions
    const { data: subs, error: subError } = await supabase
      .from('submissions')
      .select(`
        *,
        profiles:user_id(full_name, avatar_url),
        videos:video_id(id, title, thumbnail_url, url)
      `)
      .eq('request_id', id)
      .order('created_at', { ascending: false });

    if (subError) {
      console.error("Error fetching submissions:", subError);
    } else {
      setSubmissions(subs || []);
    }
    setLoading(false);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionVideoId) {
        toast.error("请输入视频ID");
        return;
    }
    
    setSubmitting(true);
    try {
        // Verify video exists and belongs to user (optional strictly, but good for UX)
        // Simple check: insert will fail if foreign key constraint fails or RLS blocks
        const { error } = await supabase
            .from('submissions')
            .insert({
                request_id: id,
                video_id: submissionVideoId,
                user_id: currentUser.id
            });

        if (error) {
            if (error.code === '23505') { // Unique violation
                toast.error("您已经提交过这个视频了");
            } else {
                throw error;
            }
        } else {
            toast.success("投稿成功！");
            setIsSubmitOpen(false);
            setSubmissionVideoId("");
            fetchData(); // Refresh list
        }
    } catch (error: any) {
        console.error("Submission error:", error);
        toast.error("投稿失败：" + error.message);
    } finally {
        setSubmitting(false);
    }
  };

  const handleAccept = async (submissionId: string) => {
    if (!confirm("确定要采纳这个投稿吗？这将支付悬赏金给作者并结束任务。")) return;

    try {
        const { error } = await supabase.rpc('accept_submission', {
            p_submission_id: submissionId
        });

        if (error) throw error;

        toast.success("已采纳！任务完成。");
        fetchData(); // Refresh all data
    } catch (error: any) {
        console.error("Accept error:", error);
        toast.error("操作失败：" + error.message);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-[#020817] flex flex-col">
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-24">
                <div className="mb-6">
                    <Skeleton className="h-6 w-32 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                             <Skeleton className="h-10 w-3/4 mb-4 bg-white/10" />
                             <div className="flex gap-4 mb-8">
                                 <Skeleton className="h-4 w-24 bg-white/10" />
                                 <Skeleton className="h-4 w-24 bg-white/10" />
                             </div>
                             <Skeleton className="h-32 w-full bg-white/10" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-64 w-full rounded-xl bg-white/10" />
                    </div>
                </div>
            </div>
        </div>
    );
  }

  if (!request) {
    return (
        <div className="min-h-screen bg-[#020817] flex items-center justify-center">
            <div className="text-white">任务不存在</div>
        </div>
    );
  }

  const isOwner = currentUser?.id === request.user_id;
  const isClosed = request.status === 'closed';

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-24">
        <Link href="/requests" className="inline-flex items-center text-gray-400 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务大厅
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Request Details */}
            <div className="lg:col-span-2 space-y-8">
                {/* Header Info */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                         {isClosed ? (
                            <Badge className="bg-gray-700 text-gray-300 px-3 py-1 text-base">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                已结束
                            </Badge>
                         ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 px-3 py-1 text-base">
                                <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" />
                                进行中
                            </Badge>
                         )}
                    </div>

                    <h1 className="text-3xl font-bold mb-4 pr-20">{request.title}</h1>
                    
                    <div className="flex flex-wrap gap-6 text-sm text-gray-400 mb-8">
                        <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={request.profiles?.avatar_url} />
                                <AvatarFallback>U</AvatarFallback>
                            </Avatar>
                            <span>{request.profiles?.full_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>发布于 {new Date(request.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{submissions.length} 人投稿</span>
                        </div>
                    </div>

                    <div className="bg-black/30 rounded-lg p-6 text-gray-300 leading-relaxed whitespace-pre-wrap border border-white/5">
                        {request.description}
                    </div>
                </div>

                {/* Submissions List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Video className="w-5 h-5" />
                        投稿列表 ({submissions.length})
                    </h2>
                    
                    {submissions.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 text-gray-500">
                            暂无投稿，快来抢占先机！
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {submissions.map((sub) => (
                                <div key={sub.id} className={`bg-white/5 border ${sub.status === 'accepted' ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10'} rounded-xl p-4 flex gap-4 items-start`}>
                                    {/* Thumbnail */}
                                    <div className="w-40 aspect-video bg-black rounded-lg overflow-hidden flex-shrink-0 border border-white/10 relative group">
                                        {sub.videos?.thumbnail_url ? (
                                            <img src={sub.videos.thumbnail_url} alt={sub.videos.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600 bg-gray-900">
                                                No Image
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/video/${sub.video_id}`} target="_blank">
                                                <Button size="sm" variant="secondary">预览视频</Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">{sub.videos?.title || 'Unknown Video'}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={sub.profiles?.avatar_url} />
                                                        <AvatarFallback>U</AvatarFallback>
                                                    </Avatar>
                                                    {sub.profiles?.full_name}
                                                    <span className="text-gray-600">•</span>
                                                    {new Date(sub.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                            
                                            {sub.status === 'accepted' && (
                                                <Badge className="bg-yellow-500 text-black font-bold">
                                                    <Trophy className="w-3 h-3 mr-1" />
                                                    中标
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions (Only for Owner) */}
                                    {isOwner && !isClosed && (
                                        <div className="flex flex-col gap-2">
                                            <Button 
                                                size="sm" 
                                                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                                                onClick={() => handleAccept(sub.id)}
                                            >
                                                采纳投稿
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 sticky top-24">
                    <div className="text-center mb-6">
                        <div className="text-sm text-gray-400 mb-1">悬赏金额</div>
                        <div className="text-4xl font-bold text-yellow-400 flex items-center justify-center gap-2">
                            <Coins className="w-8 h-8" />
                            {request.budget}
                        </div>
                    </div>

                    {!isClosed && !isOwner && (
                         <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                            <DialogTrigger asChild>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 text-lg">
                                    我要投稿
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#0f172a] border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>提交作品</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleSubmitWork} className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>视频 ID (Video ID)</Label>
                                        <Input 
                                            placeholder="请输入您已上传的视频 ID" 
                                            value={submissionVideoId}
                                            onChange={(e) => setSubmissionVideoId(e.target.value)}
                                            className="bg-black/20 border-white/10"
                                        />
                                        <p className="text-xs text-gray-400">
                                            * 请先在“我的作品”中上传视频，然后复制 ID 填入此处。
                                            <br />
                                            (目前简化流程，未来可支持直接选择)
                                        </p>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={submitting}>
                                        {submitting ? "提交中..." : "确认提交"}
                                    </Button>
                                </form>
                            </DialogContent>
                         </Dialog>
                    )}

                    {isClosed && (
                        <div className="w-full bg-gray-700/50 text-gray-400 font-bold py-4 text-center rounded-lg border border-white/5">
                            任务已结束
                        </div>
                    )}

                    {isOwner && !isClosed && (
                        <div className="text-center text-sm text-gray-400 mt-4">
                            您是任务发布者，请在左侧列表选择满意的投稿进行采纳。
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
