import { Navbar } from "@/components/landing/Navbar";
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
import { VideoSidebar } from "@/components/video/VideoSidebar";

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

  // 4.1 Check Purchase Status
  let hasPurchased = false;
  if (user) {
    if (user.id === video.user_id) {
        hasPurchased = true;
    } else {
        // Check if user has purchased this video via orders
        const { data: purchase } = await supabase
            .from('order_items')
            .select('orders!inner(user_id, status)')
            .eq('video_id', id)
            .eq('orders.user_id', user.id)
            .eq('orders.status', 'completed')
            .limit(1)
            .maybeSingle();
        
        if (purchase) hasPurchased = true;
    }
  }

  // 5. Generate Signed URL (Security)
  let videoUrl = video.url;
  // Skip signing for HLS/m3u8 files as they are served from public bucket
  if (videoUrl && !videoUrl.includes('.m3u8')) {
      const storagePath = getStoragePathFromUrl(video.url);
      if (storagePath) {
          // Try to guess bucket from path or default to 'videos'
          // If the path starts with a bucket name, getStoragePathFromUrl might strip it or keep it depending on implementation.
          // Assuming 'videos' bucket for legacy files.
          const { data: signedData } = await supabase
              .storage
              .from('videos') 
              .createSignedUrl(storagePath, 60 * 60 * 2); 
          if (signedData) {
              videoUrl = signedData.signedUrl;
          }
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
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative z-50">
          <Navbar />
      </div>
      
      {/* Cinema Mode Player Section - High Impact Visual */}
      <div className="w-full bg-muted/20 border-b border-border relative pt-24 pb-12">
          {/* Subtle Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
          
          <div className="container mx-auto px-4 relative z-10">
               <Breadcrumbs 
                    items={[
                        { label: "素材", href: "/explore" },
                        { label: video.category === 'Other' ? '其他' : (video.category || "视频"), href: `/explore?category=${video.category}` },
                        { label: video.title }
                    ]} 
                    className="mb-6 opacity-70 hover:opacity-100 transition-opacity"
                />
               <div className="max-w-6xl mx-auto">
                    <VideoPlayer 
                      src={videoUrl} 
                      poster={video.thumbnail_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop"}
                      autoPlay={true}
                      width={video.width}
                      height={video.height}
                      videoId={video.id}
                    />
               </div>
          </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Info Header */}
            <div className="border-b border-border pb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4 leading-tight">{video.title}</h1>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full"><Eye className="h-4 w-4 text-blue-500" /> {views} 次观看</span>
                <span className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-full"><Download className="h-4 w-4 text-green-500" /> {video.downloads || 0} 次下载</span>
                <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {date}</span>
                <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs border border-blue-500/20">商用授权</span>
              </div>
            </div>

            {/* AI Info Card */}
            {(video.prompt || video.ai_model || (video.tags && video.tags.length > 0)) && (
                 <div className="bg-card rounded-xl p-6 border border-border shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Check className="w-24 h-24 text-blue-500" />
                    </div>
                    
                    <h3 className="text-sm font-bold text-card-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></span>
                        AI 生成参数
                    </h3>
                    
                    {video.ai_model && (
                        <div className="mb-4">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Model (模型)</span>
                            <Link href={`/explore?model=${encodeURIComponent(video.ai_model)}`}>
                                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent text-accent-foreground border border-border hover:border-blue-500/50 transition-all cursor-pointer shadow-sm">
                                    {video.ai_model}
                                </div>
                            </Link>
                        </div>
                    )}

                    {video.prompt && (
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">Prompt (提示词)</span>
                                <CopyButton text={video.prompt} className="h-6 text-xs px-2 py-0 hover:bg-muted" />
                            </div>
                            <div className="text-sm text-card-foreground bg-muted p-4 rounded-lg border border-border font-mono whitespace-pre-wrap leading-relaxed select-all">
                                {video.prompt}
                            </div>
                        </div>
                    )}

                    {video.tags && video.tags.length > 0 && (
                        <div>
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">Tags (标签)</span>
                            <div className="flex flex-wrap gap-2">
                                {video.tags.map((tag: string, index: number) => (
                                    <Link key={index} href={`/explore?q=${encodeURIComponent(tag)}`}>
                                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all border border-transparent hover:border-border">
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
                price={video.price || 0}
                hasPurchased={hasPurchased}
            >
                <Separator className="bg-border my-8" />
                
                <div className="space-y-4">
                     <h3 className="font-bold text-xl text-foreground">关于作品</h3>
                     <p className="text-muted-foreground leading-relaxed text-base">
                        {video.description || "这是一个由 AI 生成的精彩视频。探索人工智能带来的无限创意可能。"}
                     </p>
                </div>

            </VideoInteractions>

            <Separator className="bg-border" />
            
            <VideoComments 
                videoId={video.id} 
                currentUser={user} 
                authorId={video.user_id} 
            />
          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-1 space-y-8">
            <div className="sticky top-24 space-y-8">
                <VideoSidebar 
                    video={video} 
                    authorProfile={authorProfile} 
                    currentUser={user}
                    downloadUrl={videoUrl}
                    hasPurchased={hasPurchased}
                />

                {/* Related Videos */}
                <div>
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Play className="w-4 h-4 fill-foreground" />
                        相关推荐
                    </h3>
                    <div className="space-y-3">
                    {relatedVideos && relatedVideos.length > 0 ? (
                        relatedVideos.map((relatedVideo: any) => (
                            <Link href={`/video/${relatedVideo.id}`} key={relatedVideo.id}>
                                <div className="flex gap-3 group cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors border border-transparent hover:border-border">
                                <div className="w-32 h-20 bg-muted rounded-md overflow-hidden relative flex-shrink-0 border border-border">
                                    {relatedVideo.url.match(/\.(mp4|webm|mov)$/i) ? (
                                        <video 
                                            src={relatedVideo.url} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            muted
                                        />
                                    ) : (
                                        <img 
                                            src={relatedVideo.url} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            alt={relatedVideo.title} 
                                        />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                        <Play className="w-8 h-8 text-white fill-white drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black/60 px-1 rounded text-[10px] text-white">
                                        {relatedVideo.duration}s
                                    </div>
                                </div>
                                <div className="flex flex-col justify-center min-w-0">
                                    <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-blue-500 transition-colors leading-tight mb-1">{relatedVideo.title}</h4>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <span className="truncate max-w-[80px]">{relatedVideo.user_id.slice(0, 6)}...</span>
                                        <span>•</span>
                                        <span>{relatedVideo.views || 0}次观看</span>
                                    </div>
                                </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-muted-foreground text-sm py-8 text-center bg-muted rounded-lg border border-border border-dashed">
                            暂无相关推荐
                        </div>
                    )}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
