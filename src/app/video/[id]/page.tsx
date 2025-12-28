import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Eye, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { VideoInteractions } from "@/components/video/VideoInteractions";

export default async function VideoDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch Video
  let video: any = null;
  let error: any = null;

  // Handle mock IDs (1-4)
  if (['1', '2', '3', '4'].includes(id)) {
      const mockVideos: Record<string, any> = {
          '1': {
              id: '1',
              title: "AI生成的未来太空城市",
              url: "https://videos.pexels.com/video-files/3129957/3129957-hd_1920_1080_25fps.mp4", // Mock video URL
              user_id: "mock_user_1",
              created_at: new Date().toISOString(),
              description: "这是一段由 DeepMind 生成的未来太空城市概念视频。"
          },
          '2': {
              id: '2',
              title: "赛博朋克城市夜景",
              url: "https://videos.pexels.com/video-files/2887463/2887463-hd_1920_1080_30fps.mp4",
              user_id: "mock_user_2",
              created_at: new Date().toISOString(),
              description: "赛博朋克风格的霓虹灯夜景，使用 Unreal Engine 5 渲染。"
          },
          '3': {
              id: '3',
              title: "未来科技数据流",
              url: "https://videos.pexels.com/video-files/852421/852421-hd_1920_1080_30fps.mp4",
              user_id: "mock_user_3",
              created_at: new Date().toISOString(),
              description: "抽象的数据流可视化，展示 AI 处理大数据的过程。"
          },
          '4': {
              id: '4',
              title: "海底生物与光影",
              url: "https://videos.pexels.com/video-files/856973/856973-hd_1920_1080_24fps.mp4",
              user_id: "mock_user_4",
              created_at: new Date().toISOString(),
              description: "由 AI 生成的深海生物发光效果模拟。"
          }
      };
      video = mockVideos[id];
  } else {
      // Fetch real video from Supabase
      const { data, error: dbError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      video = data;
      error = dbError;
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-[#020817] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">404</h1>
          <p className="text-gray-400 mb-8">视频未找到或已被删除</p>
          <Link href="/">
            <Button>返回首页</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // 2. Fetch Author Profile
  let authorProfile = null;
  if (video.user_id && !video.user_id.startsWith("mock_")) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', video.user_id)
        .single();
      authorProfile = data;
  }

  // 3. Fetch Initial Likes
  let initialLikes = 0;
  if (!video.id.toString().match(/^[1-4]$/)) { // Only fetch real likes for non-mock videos
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', id);
      initialLikes = count || 0;
  } else {
      initialLikes = Math.floor(Math.random() * 500) + 100; // Mock likes
  }

  // 4. Fetch Current User
  const { data: { user } } = await supabase.auth.getUser();

  // 5. Fetch Related Videos (Real data)
  const { data: relatedVideos } = await supabase
    .from('videos')
    .select('id, title, url, thumbnail_url, user_id, created_at')
    .neq('id', id)
    .limit(5);

  return (
    <main className="min-h-screen bg-[#020817] text-foreground">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="rounded-xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl relative group">
              <video 
                src={video.url} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
                poster={video.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"}
              />
            </div>

            {/* Video Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {views} 次观看</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {date}</span>
              </div>

              <VideoInteractions 
                videoId={video.id} 
                initialLikes={initialLikes || 0} 
                currentUser={user} 
                videoUrl={video.url}
              >
                <Separator className="bg-white/10 my-6" />

                {/* Author & Description */}
                <div className="flex gap-4">
                  <Link href={`/profile/${video.user_id}`}>
                    <Avatar className="h-12 w-12 border border-white/10 hover:opacity-80 transition-opacity">
                      <AvatarImage src={authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.user_id}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${video.user_id}`} className="hover:text-blue-400 transition-colors">
                        <h3 className="font-semibold text-white">{authorProfile?.full_name || `创作者 ${video.user_id.slice(0, 6)}`}</h3>
                      </Link>
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">Pro</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {video.description || "这是一个由 AI 生成的精彩视频。探索人工智能带来的无限创意可能。"}
                    </p>
                  </div>
                </div>
                
                <Separator className="bg-white/10 my-6" />
              </VideoInteractions>
            </div>
          </div>

          {/* Sidebar: Recommended */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-white mb-4">相关推荐</h3>
            <div className="space-y-4">
              {relatedVideos && relatedVideos.length > 0 ? (
                  relatedVideos.map((relatedVideo: any) => (
                    <Link href={`/video/${relatedVideo.id}`} key={relatedVideo.id}>
                        <div className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors mb-2">
                        <div className="w-40 h-24 bg-gray-800 rounded-md overflow-hidden relative flex-shrink-0 border border-white/5">
                            {relatedVideo.url.match(/\.(mp4|webm|mov)$/i) ? (
                                <video 
                                    src={relatedVideo.url} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                    muted
                                />
                            ) : (
                                <img 
                                    src={relatedVideo.url} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                    alt={relatedVideo.title} 
                                />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <Play className="w-6 h-6 text-white fill-white" />
                            </div>
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                            <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">{relatedVideo.title}</h4>
                            <span className="text-xs text-gray-500 mt-1">用户 {relatedVideo.user_id.slice(0, 6)}...</span>
                            <span className="text-xs text-gray-600 mt-0.5">{new Date(relatedVideo.created_at).toLocaleDateString()}</span>
                        </div>
                        </div>
                    </Link>
                  ))
              ) : (
                  // Fallback to static if no related videos found
                  [1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-lg transition-colors">
                    <div className="w-40 h-24 bg-gray-800 rounded-md overflow-hidden relative flex-shrink-0">
                        <img 
                            src={`https://images.unsplash.com/photo-${i % 2 === 0 ? '1614728853911-04285d8e7c16' : '1555680202-c86f0e12f086'}?q=80&w=300&auto=format&fit=crop`} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            alt="Related" 
                        />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h4 className="text-sm font-medium text-white line-clamp-2 group-hover:text-blue-400 transition-colors">推荐视频示例 {i}</h4>
                        <span className="text-xs text-gray-500 mt-1">系统推荐</span>
                    </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
