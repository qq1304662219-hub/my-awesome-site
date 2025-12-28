import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Play, Grid, User as UserIcon } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  // 2. Fetch User's Videos
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  // Mock profile if not found (for early stage)
  const displayProfile = profile || {
    full_name: `User ${id.slice(0, 6)}`,
    avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    email: 'No email',
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        {/* Header */}
        <div className="container mx-auto px-4 mb-16">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Avatar className="h-24 w-24 border-2 border-white/20">
              <AvatarImage src={displayProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`} />
              <AvatarFallback><UserIcon /></AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold">{displayProfile.full_name || `User ${id.slice(0, 6)}`}</h1>
              <p className="text-gray-400 mt-2">AI 视频创作者</p>
            </div>
            <div className="flex gap-4">
               <Button variant="outline" className="border-white/10 hover:bg-white/10 text-gray-300">
                 关注
               </Button>
               <Button className="bg-blue-600 hover:bg-blue-700">
                 发送消息
               </Button>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="container mx-auto px-4 border-b border-white/10 mb-8">
          <div className="flex justify-center gap-8">
            <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-blue-500 text-blue-500 font-medium">
              <Grid className="h-4 w-4" />
              作品 ({videos?.length || 0})
            </button>
            <button className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-400 hover:text-white transition-colors">
              <UserIcon className="h-4 w-4" />
              简介
            </button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="container mx-auto px-4">
          {!videos || videos.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>该用户暂时没有发布作品</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video: any) => (
                <Link href={`/video/${video.id}`} key={video.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all hover:transform hover:-translate-y-1 block">
                  <div className="aspect-video relative overflow-hidden bg-black/50">
                    <video 
                      src={video.url} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="fill-white text-white ml-1 h-5 w-5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium truncate mb-1">{video.title}</h3>
                    <p className="text-xs text-gray-400">{new Date(video.created_at).toLocaleDateString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
