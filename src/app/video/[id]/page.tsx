import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Download, ShieldCheck, Heart, Play, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { VideoInteractions } from "@/components/video/VideoInteractions";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { LicenseSelector } from "@/components/video/LicenseSelector";
import { CopyButton } from "@/components/shared/CopyButton";
import { getStoragePathFromUrl } from "@/lib/utils";
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params
  
  // Fetch video data
  const { data: video } = await supabase
    .from('videos')
    .select('title, description, thumbnail_url, user_id')
    .eq('id', id)
    .single();

  if (!video) {
    return {
      title: '视频未找到',
    }
  }

  // Optionally fetch author name
  let authorName = 'AI Vision Creator';
  if (video.user_id) {
     const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', video.user_id)
        .single();
     if (profile?.full_name) authorName = profile.full_name;
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: video.title,
    description: video.description || `观看由 ${authorName} 创作的精彩 AI 视频`,
    openGraph: {
      title: video.title,
      description: video.description || `观看由 ${authorName} 创作的精彩 AI 视频`,
      images: video.thumbnail_url ? [video.thumbnail_url, ...previousImages] : previousImages,
    },
  }
}

export default async function VideoDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch Video (Real data only)
  const { data: video, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

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
  if (video.user_id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', video.user_id)
        .single();
      authorProfile = data;
  }

  // 3. Fetch Initial Likes
  const { count: initialLikes } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', id);

  // 4. Fetch Current User
  const { data: { user } } = await supabase.auth.getUser();

  // 5. Generate Signed URL (Security)
  let videoUrl = video.url;
  const storagePath = getStoragePathFromUrl(video.url);
  if (storagePath) {
      const { data: signedData } = await supabase
          .storage
          .from('uploads')
          .createSignedUrl(storagePath, 60 * 60 * 2); // 2 hours validity
      if (signedData) {
          videoUrl = signedData.signedUrl;
      }
  }

  // 6. Fetch Related Videos (Real data)
  const { data: relatedVideos } = await supabase
    .from('videos')
    .select('id, title, url, thumbnail_url, user_id, created_at')
    .neq('id', id)
    .limit(5);

  // Data fallback for display
  const views = video.views || 0;
  const date = new Date(video.created_at).toLocaleDateString('zh-CN');

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description || "AI generated video",
    "thumbnailUrl": [
      video.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"
    ],
    "uploadDate": video.created_at,
    "duration": video.duration ? `PT${video.duration}S` : "PT15S",
    "contentUrl": video.url,
    "embedUrl": video.url,
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": { "@type": "WatchAction" },
      "userInteractionCount": views
    },
    "author": {
      "@type": "Person",
      "name": authorProfile?.full_name || `User ${video.user_id.slice(0, 6)}`
    }
  };

  return (
    <main className="min-h-screen bg-[#020817] text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer 
              src={video.url} 
              poster={video.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"}
              autoPlay={true}
            />

            {/* Video Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
                <span className="flex items-center gap-1"><Eye className="h-4 w-4" /> {views} 次观看</span>
                <span className="flex items-center gap-1"><Download className="h-4 w-4" /> {video.downloads || 0} 次下载</span>
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {date}</span>
                <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs border border-blue-500/20">商用授权</span>
              </div>

              {/* AI Metadata */}
              {(video.prompt || video.ai_model || (video.tags && video.tags.length > 0)) && (
                 <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                    <h3 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        AI 生成信息
                    </h3>
                    
                    {video.ai_model && (
                        <div className="mb-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Model (模型)</span>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {video.ai_model}
                            </div>
                        </div>
                    )}

                    {video.prompt && (
                        <div className="mb-3">
                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Prompt (提示词)</span>
                            <div className="text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5 font-mono">
                                {video.prompt}
                            </div>
                        </div>
                    )}

                    {video.tags && video.tags.length > 0 && (
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tags (标签)</span>
                            <div className="flex flex-wrap gap-2">
                                {video.tags.map((tag: string, index: number) => (
                                    <span key={index} className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition-colors">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                 </div>
              )}

              <VideoInteractions 
                videoId={video.id} 
                initialLikes={initialLikes || 0} 
                currentUser={user} 
                videoUrl={video.url}
                downloadUrl={video.download_url}
                authorName={authorProfile?.full_name}
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

                {/* Technical Specs */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 rounded-xl p-6 border border-white/10">
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">分辨率</span>
                        <span className="text-white font-medium">{video.width || 1920} x {video.height || 1080}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">时长</span>
                        <span className="text-white font-medium">{video.duration || 15} 秒</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">格式</span>
                        <span className="text-white font-medium uppercase">{video.format || "MP4"}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">大小</span>
                        <span className="text-white font-medium">{video.size ? (video.size / 1024 / 1024).toFixed(1) + ' MB' : '12.5 MB'}</span>
                    </div>
                </div>
                
                <Separator className="bg-white/10 my-6" />
              </VideoInteractions>
            </div>
          </div>

          {/* Sidebar: Download & Recommended */}
          <div className="lg:col-span-1 space-y-8">
            {/* License Selector Panel */}
            <LicenseSelector 
                videoId={video.id} 
                title={video.title} 
                thumbnail={video.thumbnail_url || video.url} 
            />

            {/* Related Videos */}
            <div>
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
                <div className="text-gray-500 text-sm py-4">
                  暂无相关视频推荐
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </main>
  );
}
