"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Heart, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const videos = [
  {
    id: 1,
    title: "AI生成的未来太空城市",
    author: "DeepMind",
    views: "12.7k",
    duration: "00:45",
    image: "https://images.unsplash.com/photo-1614728853911-04285d8e7c16?q=80&w=600&auto=format&fit=crop",
    tag: "宇宙探索",
    rank: 1
  },
  {
    id: 2,
    title: "赛博朋克城市夜景",
    author: "NeonArtist",
    views: "10.2k",
    duration: "00:30",
    image: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=600&auto=format&fit=crop",
    tag: "科幻",
    rank: 2
  },
  {
    id: 3,
    title: "未来科技数据流",
    author: "TechFlow",
    views: "11.5k",
    duration: "00:15",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop",
    tag: "科技",
    rank: 3
  },
  {
    id: 4,
    title: "海底生物与光影",
    author: "OceanAI",
    views: "8.9k",
    duration: "01:00",
    image: "https://images.unsplash.com/photo-1582967788606-a171f1080ca8?q=80&w=600&auto=format&fit=crop",
    tag: "自然",
    rank: 4
  },
];

export function VideoGrid() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  
  const [realVideos, setRealVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      let dbQuery = supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (query) {
        dbQuery = dbQuery.ilike('title', `%${query}%`);
      }

      if (category && category !== "All" && category !== "全部") {
        dbQuery = dbQuery.eq('category', category);
      }

      // Filter: Resolution
      const resolutions = searchParams.get("resolution")?.split(',') || [];
      if (resolutions.length > 0) {
          const conditions: string[] = [];
          if (resolutions.includes('4k')) conditions.push('width.gte.3840');
          if (resolutions.includes('1080p')) conditions.push('and(width.gte.1920,width.lt.3840)');
          if (resolutions.includes('720p')) conditions.push('and(width.gte.1280,width.lt.1920)');
          
          if (conditions.length > 0) {
              dbQuery = dbQuery.or(conditions.join(','));
          }
      }

      // Filter: Duration
      const durations = searchParams.get("duration")?.split(',') || [];
      if (durations.length > 0) {
          const conditions: string[] = [];
          if (durations.includes('short')) conditions.push('duration.lt.10');
          if (durations.includes('medium')) conditions.push('and(duration.gte.10,duration.lte.30)');
          if (durations.includes('long')) conditions.push('duration.gt.30');
          
          if (conditions.length > 0) {
              dbQuery = dbQuery.or(conditions.join(','));
          }
      }

      // Filter: Format
      const formats = searchParams.get("format")?.split(',') || [];
      if (formats.length > 0) {
          dbQuery = dbQuery.in('format', formats);
      }

      const { data, error } = await dbQuery.limit(20);
      if (error) {
          console.error("Error fetching videos:", error);
      }
      if (data) {
        setRealVideos(data);
      }
      setLoading(false);
    };

    fetchVideos();
  }, [query, category, searchParams]);

  if (loading && realVideos.length === 0) {
      return (
        <div className="container mx-auto px-4 mb-20 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white/5 rounded-xl h-64 animate-pulse"></div>
            ))}
        </div>
      )
  }

  return (
    <div className="container mx-auto px-4 mb-20" id="videos">
      
      {/* Latest Uploads (New Section) */}
      {realVideos && realVideos.length > 0 && (
        <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-green-500">🆕</span> 最新上传
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {realVideos.map((video: any) => (
                    <div key={video.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-green-500/50 transition-all hover:transform hover:-translate-y-1">
                        <div className="aspect-video relative overflow-hidden bg-black/50">
                            {/* Use Link for navigation to details page */}
                            <Link href={`/video/${video.id}`} className="block w-full h-full">
                                {video.url.match(/\.(mp4|webm|mov)$/i) ? (
                                    <video 
                                        src={video.url} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                                        muted
                                        loop
                                        onMouseOver={(e) => e.currentTarget.play()}
                                        onMouseOut={(e) => e.currentTarget.pause()}
                                    />
                                ) : (
                                    <img 
                                        src={video.url} 
                                        alt={video.title} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                                    />
                                )}
                                
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Play className="fill-white text-white ml-1" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                        <div className="p-4">
                            <Link href={`/video/${video.id}`}>
                                <h4 className="text-white font-medium truncate mb-2 hover:text-blue-400 transition-colors">{video.title}</h4>
                            </Link>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <Link href={`/profile/${video.user_id}`} className="hover:text-white transition-colors flex items-center gap-1">
                                    <span>用户 {video.user_id.slice(0, 6)}...</span>
                                </Link>
                                <span className="text-xs text-gray-500">
                                    {new Date(video.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Hot Videos */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-orange-500">🔥</span> 热门视频
          </h3>
          <span className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">查看更多 &gt;</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all hover:transform hover:-translate-y-1">
              <div className="aspect-video relative overflow-hidden">
                <Link href={`/video/${video.id}`} className="block w-full h-full">
                    <img src={video.image} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 left-2">
                        <Badge className={`
                            ${video.rank === 1 ? 'bg-yellow-500' : video.rank === 2 ? 'bg-gray-400' : video.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'} 
                            text-white border-0 w-6 h-6 flex items-center justify-center rounded-full p-0
                        `}>
                            {video.rank}
                        </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white">
                        {video.duration}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30">
                            <Play className="fill-white text-white ml-1" />
                        </div>
                    </div>
                </Link>
              </div>
              <div className="p-4">
                <Link href={`/video/${video.id}`}>
                    <h4 className="text-white font-medium truncate mb-2 hover:text-blue-400 transition-colors">{video.title}</h4>
                </Link>
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{video.author}</span>
                    <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {video.views}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500">👍</span> 为你推荐
          </h3>
          <span className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">查看更多 &gt;</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
                <div key={i} className="flex bg-white/5 rounded-xl border border-white/10 p-3 gap-4 hover:bg-white/10 transition-colors">
                    <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={`https://images.unsplash.com/photo-${i === 1 ? '1518020382971-260167947129' : '1451187580459-43490279c0fa'}?q=80&w=400&auto=format&fit=crop`} className="w-full h-full object-cover" alt="thumb" />
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">01:15</div>
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                        <h4 className="text-white font-medium mb-1">AI生成的幻想生物世界</h4>
                        <p className="text-xs text-gray-400 mb-3">海底探索者 • 自然 • 幻想</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 1.1k</span>
                            <span className="flex items-center gap-1"><Download className="w-3 h-3" /> 500</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
