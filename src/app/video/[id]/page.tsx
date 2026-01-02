import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, Download, ShieldCheck, Heart, Play, Copy, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoInteractions } from "@/components/video/VideoInteractions";
import { VideoComments } from "@/components/video/VideoComments";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { LicenseSelector } from "@/components/video/LicenseSelector";
import { CopyButton } from "@/components/shared/CopyButton";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { getStoragePathFromUrl } from "@/lib/utils";
import type { Metadata, ResolvingMetadata } from 'next';
import { SITE_CONFIG } from "@/lib/constants";

import { FollowButton } from "@/components/profile/FollowButton";

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
      url: `${SITE_CONFIG.url}/video/${id}`,
      type: 'video.other',
      images: video.thumbnail_url ? [video.thumbnail_url, ...previousImages] : previousImages,
      siteName: SITE_CONFIG.name,
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description: video.description || `观看由 ${authorName} 创作的精彩 AI 视频`,
      images: video.thumbnail_url ? [video.thumbnail_url] : [],
    }
  }
}

export default async function VideoDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Fetch Video with Author Profile
  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        full_name,
        avatar_url,
        bio
      )
    `)
    .eq('id', id)
    .single();

  if (error || !video) {
    notFound();
  }

  const authorProfile = video.profiles;

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
          .createSignedUrl(storagePath, 60 * 60 * 2, { download: true }); // 2 hours validity, force download
      if (signedData) {
          videoUrl = signedData.signedUrl;
      }
  }

  // 6. Fetch Related Videos (Improved Smart Algorithm)
  const relatedLimit = 6;
  let candidates: any[] = [];

  // Parallel requests for better performance
  const promises = [];

  // Strategy 1: Tags Overlap (Highest relevance)
  if (video.tags && video.tags.length > 0) {
      promises.push(
        supabase
        .from('videos')
        .select('id, title, url, thumbnail_url, user_id, created_at, views, duration')
        .neq('id', id)
        .eq('status', 'published')
        .overlaps('tags', video.tags)
        .limit(relatedLimit)
        .then(({ data }) => data || [])
      );
  }

  // Strategy 2: Same AI Model
  if (video.ai_model) {
      promises.push(
        supabase
        .from('videos')
        .select('id, title, url, thumbnail_url, user_id, created_at, views, duration')
        .neq('id', id)
        .eq('status', 'published')
        .eq('ai_model', video.ai_model)
        .limit(relatedLimit)
        .then(({ data }) => data || [])
      );
  }

  // Strategy 3: Same Category (Broader fallback)
  if (video.category) {
       promises.push(
        supabase
        .from('videos')
        .select('id, title, url, thumbnail_url, user_id, created_at, views, duration')
        .neq('id', id)
        .eq('status', 'published')
        .eq('category', video.category)
        .limit(relatedLimit)
        .then(({ data }) => data || [])
       );
  }

  const results = await Promise.all(promises);
  results.forEach(res => candidates.push(...res));

  // Deduplicate by ID
  let uniqueVideos = Array.from(new Map(candidates.map(item => [item.id, item])).values());

  // If still not enough, fetch latest published
  if (uniqueVideos.length < 5) {
      const { data: latestVideos } = await supabase
        .from('videos')
        .select('id, title, url, thumbnail_url, user_id, created_at, views, duration')
        .neq('id', id)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (latestVideos) {
          uniqueVideos = [...uniqueVideos, ...latestVideos];
          uniqueVideos = Array.from(new Map(uniqueVideos.map(item => [item.id, item])).values());
      }
  }

  // Shuffle slightly to avoid static order? Or just slice.
  // Simple shuffle
  uniqueVideos = uniqueVideos.sort(() => Math.random() - 0.5);

  const relatedVideos = uniqueVideos.slice(0, 8);

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
        <Breadcrumbs 
            items={[
                { label: "探索", href: "/explore" },
                { label: video.category || "视频", href: `/explore?category=${video.category}` },
                { label: video.title }
            ]} 
            className="mb-6"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <VideoPlayer 
              src={videoUrl} 
              poster={video.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"}
              autoPlay={true}
              width={video.width}
              height={video.height}
            />

            {/* Video Info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-6 flex-wrap">
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
                            <Link href={`/explore?model=${encodeURIComponent(video.ai_model)}`}>
                                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors cursor-pointer">
                                    {video.ai_model}
                                </div>
                            </Link>
                        </div>
                    )}

                    {video.prompt && (
                        <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Prompt (提示词)</span>
                                <CopyButton text={video.prompt} className="h-6 text-xs px-2 py-0" />
                            </div>
                            <div className="text-sm text-gray-300 bg-black/20 p-3 rounded-lg border border-white/5 font-mono whitespace-pre-wrap">
                                {video.prompt}
                            </div>
                        </div>
                    )}

                    {video.tags && video.tags.length > 0 && (
                        <div>
                            <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Tags (标签)</span>
                            <div className="flex flex-wrap gap-2">
                                {video.tags.map((tag: string, index: number) => (
                                    <Link key={index} href={`/explore?q=${encodeURIComponent(tag)}`}>
                                        <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded hover:bg-white/10 cursor-pointer transition-colors">
                                            #{tag}
                                        </span>
                                    </Link>
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
                videoUrl={videoUrl}
                videoTitle={video.title}
                downloadUrl={videoUrl} // Use signed URL for download as well
                authorId={video.user_id}
                authorName={authorProfile?.full_name || authorProfile?.username}
              >
                <Separator className="bg-white/10 my-6" />

                {/* Author & Description */}
                <div className="flex gap-4">
                  <Link href={`/profile/${video.user_id}`}>
                    <Avatar className="h-12 w-12 border border-white/10 hover:opacity-80 transition-opacity">
                      <AvatarImage src={authorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.user_id}`} />
                      <AvatarFallback>{authorProfile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Link href={`/profile/${video.user_id}`} className="hover:text-blue-400 transition-colors">
                        <h3 className="font-semibold text-white">{authorProfile?.full_name || authorProfile?.username || `创作者 ${video.user_id?.slice(0, 6)}`}</h3>
                      </Link>
                      <FollowButton authorId={video.user_id} />
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
                        <span className="text-white font-medium">{video.width && video.height ? `${video.width} x ${video.height}` : "--"}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">时长</span>
                        <span className="text-white font-medium">{video.duration ? `${video.duration} 秒` : "--"}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">格式</span>
                        <span className="text-white font-medium uppercase">{video.format || "--"}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-500 block mb-1">大小</span>
                        <span className="text-white font-medium">{video.size ? (video.size / 1024 / 1024).toFixed(1) + ' MB' : "--"}</span>
                    </div>
                </div>
                
                <Separator className="bg-white/10 my-6" />
              </VideoInteractions>

              <VideoComments 
                videoId={video.id} 
                currentUser={user} 
                authorId={video.user_id} 
              />
            </div>
          </div>

          {/* Sidebar: Download & Recommended */}
          <div className="lg:col-span-1 space-y-8">
            {/* License Selector Panel */}
            <LicenseSelector 
                videoId={video.id} 
                title={video.title} 
                thumbnail={video.thumbnail_url || video.url} 
                price={video.price}
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
