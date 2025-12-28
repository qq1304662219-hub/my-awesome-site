import { Play, Heart, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";

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

export async function VideoGrid({ query, category }: { query?: string; category?: string }) {
  // Fetch real videos from Supabase
  let dbQuery = supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`);
  }

  // Note: category filtering would require a 'category' column in the database, which we don't have yet.
  // We will just filter by query for now.

  const { data: realVideos } = await dbQuery.limit(8);

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
                            <img 
                                src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop" 
                                alt={video.title} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                            />
                            
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30">
                                    <Play className="fill-white text-white ml-1" />
                                </a>
                            </div>
                        </div>
                        <div className="p-4">
                            <h4 className="text-white font-medium truncate mb-2">{video.title}</h4>
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span>User {video.user_id.slice(0, 6)}...</span>
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">New</span>
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
              </div>
              <div className="p-4">
                <h4 className="text-white font-medium truncate mb-2">{video.title}</h4>
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
