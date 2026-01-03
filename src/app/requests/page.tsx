import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Coins, Plus, Clock, CheckCircle2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const revalidate = 0;

interface Request {
  id: string;
  title: string;
  description: string;
  budget: number;
  status: 'open' | 'closed';
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
  submission_count?: number;
}

export default async function RequestsPage() {
  const { data: requests, error } = await supabase
    .from('requests')
    .select(`
      *,
      profiles:user_id(full_name, avatar_url),
      submissions(count)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left: Request List */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                悬赏任务大厅
              </h1>
              <span className="text-gray-400 text-sm">
                共 {requests?.length || 0} 个任务
              </span>
            </div>

            {(!requests || requests.length === 0) ? (
              <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-400 mb-4">暂无悬赏任务</p>
                <Link href="/requests/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    发布第一个任务
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {requests.map((req: any) => (
                  <Link href={`/requests/${req.id}`} key={req.id}>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-4">
                            <Avatar className="h-10 w-10 border border-white/10">
                                <AvatarImage src={req.profiles?.avatar_url} />
                                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="text-lg font-bold group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                    {req.title}
                                    {req.status === 'closed' && (
                                        <Badge variant="secondary" className="bg-gray-700 text-gray-300">已结束</Badge>
                                    )}
                                </h3>
                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                    {req.profiles?.full_name || 'Unknown User'} • 
                                    <span className="flex items-center gap-1 text-xs">
                                        <Clock className="w-3 h-3" /> 
                                        {new Date(req.created_at).toLocaleDateString()}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center text-yellow-400 font-bold text-lg">
                                <Coins className="w-5 h-5 mr-1" />
                                {req.budget}
                            </div>
                            <span className="text-xs text-gray-500">悬赏金额</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 line-clamp-2 mb-4 text-sm">
                        {req.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-white/5 pt-4">
                        <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {req.submissions?.[0]?.count || 0} 人投稿
                        </span>
                        {req.status === 'open' ? (
                            <span className="text-green-400 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                进行中
                            </span>
                        ) : (
                            <span className="text-gray-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                已完成
                            </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="w-full md:w-80 space-y-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-xl p-6 backdrop-blur-sm sticky top-24">
                <h3 className="text-xl font-bold mb-2 text-white">有需求？</h3>
                <p className="text-gray-300 text-sm mb-6">
                    发布悬赏任务，让数千名创作者为您定制专属视频素材。
                </p>
                <Link href="/requests/create" className="block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6">
                        <Plus className="w-5 h-5 mr-2" />
                        发布悬赏任务
                    </Button>
                </Link>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    高薪任务榜
                </h3>
                <div className="space-y-4">
                    {requests
                        ?.filter((r: any) => r.status === 'open')
                        .sort((a: any, b: any) => b.budget - a.budget)
                        .slice(0, 5)
                        .map((req: any) => (
                        <Link href={`/requests/${req.id}`} key={req.id} className="block group">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-300 group-hover:text-blue-400 truncate flex-1 mr-2">
                                    {req.title}
                                </span>
                                <span className="text-yellow-400 text-xs font-mono font-bold">
                                    ¥{req.budget}
                                </span>
                            </div>
                            <div className="text-xs text-gray-500">
                                {req.submissions?.[0]?.count || 0} 投稿
                            </div>
                        </Link>
                    ))}
                    {(!requests || requests.length === 0) && (
                        <div className="text-sm text-gray-500 text-center py-4">暂无数据</div>
                    )}
                </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
