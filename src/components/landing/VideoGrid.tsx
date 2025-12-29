"use client"

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Heart, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";

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
  {
    id: 5,
    title: "虚拟现实游戏世界",
    author: "VRMaster",
    views: "7.5k",
    duration: "00:25",
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=600&auto=format&fit=crop",
    tag: "游戏",
    rank: 5
  },
  {
    id: 6,
    title: "AI 绘画艺术展",
    author: "ArtBot",
    views: "6.8k",
    duration: "01:20",
    image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=600&auto=format&fit=crop",
    tag: "艺术",
    rank: 6
  },
  {
    id: 7,
    title: "智慧城市交通流",
    author: "CityAI",
    views: "5.4k",
    duration: "00:40",
    image: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=600&auto=format&fit=crop",
    tag: "城市",
    rank: 7
  },
  {
    id: 8,
    title: "量子计算可视化",
    author: "QuantumLab",
    views: "4.9k",
    duration: "00:20",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=600&auto=format&fit=crop",
    tag: "科技",
    rank: 8
  },
  {
    id: 9,
    title: "火星殖民地概念",
    author: "SpaceX_Fan",
    views: "9.1k",
    duration: "00:55",
    image: "https://images.unsplash.com/photo-1614728423169-3f65fd722b7e?q=80&w=600&auto=format&fit=crop",
    tag: "宇宙",
    rank: 9
  },
  {
    id: 10,
    title: "纳米机器人医疗",
    author: "MedTech",
    views: "3.2k",
    duration: "00:35",
    image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop",
    tag: "医疗",
    rank: 10
  },
  {
    id: 11,
    title: "全息投影通讯",
    author: "HoloCom",
    views: "4.5k",
    duration: "00:18",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop",
    tag: "通讯",
    rank: 11
  },
  {
    id: 12,
    title: "数字孪生工厂",
    author: "Industry4.0",
    views: "2.8k",
    duration: "01:10",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
    tag: "工业",
    rank: 12
  },
  {
    id: 13,
    title: "虚拟时尚秀场",
    author: "FashionAI",
    views: "3.5k",
    duration: "00:45",
    image: "https://images.unsplash.com/photo-1537832816519-689ad163238b?q=80&w=600&auto=format&fit=crop",
    tag: "时尚",
    rank: 13
  },
  {
    id: 14,
    title: "古代文明复原",
    author: "HistoryTech",
    views: "5.1k",
    duration: "01:30",
    image: "https://images.unsplash.com/photo-1599739291060-4578e77dac5d?q=80&w=600&auto=format&fit=crop",
    tag: "历史",
    rank: 14
  },
  {
    id: 15,
    title: "微观世界探秘",
    author: "MicroScope",
    views: "2.2k",
    duration: "00:28",
    image: "https://images.unsplash.com/photo-1530263503756-b37130e527da?q=80&w=600&auto=format&fit=crop",
    tag: "科学",
    rank: 15
  },
  {
    id: 16,
    title: "极光与星空延时",
    author: "NatureLover",
    views: "8.4k",
    duration: "00:50",
    image: "https://images.unsplash.com/photo-1483347752969-5224ac168928?q=80&w=600&auto=format&fit=crop",
    tag: "自然",
    rank: 16
  },
  {
    id: 17,
    title: "赛博朋克摩托追逐",
    author: "CyberRider",
    views: "6.9k",
    duration: "00:42",
    image: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=600&auto=format&fit=crop",
    tag: "动作",
    rank: 17
  },
  {
    id: 18,
    title: "AI 建筑设计概念",
    author: "ArchMind",
    views: "4.1k",
    duration: "01:05",
    image: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=600&auto=format&fit=crop",
    tag: "建筑",
    rank: 18
  },
  {
    id: 19,
    title: "幻想森林精灵",
    author: "FantasyWorld",
    views: "9.5k",
    duration: "00:38",
    image: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=600&auto=format&fit=crop",
    tag: "奇幻",
    rank: 19
  },
  {
    id: 20,
    title: "深海未知生物",
    author: "DeepBlue",
    views: "3.8k",
    duration: "00:52",
    image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?q=80&w=600&auto=format&fit=crop",
    tag: "海洋",
    rank: 20
  },
  {
    id: 21,
    title: "未来飞行汽车",
    author: "FutureTransport",
    views: "5.7k",
    duration: "00:33",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop",
    tag: "科技",
    rank: 21
  },
  {
    id: 22,
    title: "AI 音乐可视化",
    author: "SoundWave",
    views: "2.9k",
    duration: "02:10",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600&auto=format&fit=crop",
    tag: "音乐",
    rank: 22
  },
  {
    id: 23,
    title: "机器人情感表达",
    author: "RoboSoul",
    views: "4.6k",
    duration: "00:48",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=600&auto=format&fit=crop",
    tag: "情感",
    rank: 23
  },
  {
    id: 24,
    title: "粒子特效风暴",
    author: "VFXPro",
    views: "7.1k",
    duration: "00:15",
    image: "https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=600&auto=format&fit=crop",
    tag: "特效",
    rank: 24
  }
];

import { VideoCard } from "@/components/shared/VideoCard";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Video } from "@/types/video";

// ... existing imports

export function VideoGrid() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const { handleError } = useErrorHandler();
  
  const [realVideos, setRealVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      try {
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
            throw error;
        }
        if (data) {
            setRealVideos(data);
        }
      } catch (error) {
        handleError(error, "Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query, category, searchParams, handleError]);

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

      {/* Recommended (Moved to top) */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mb-16"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-blue-500">👍</span> 为你推荐
          </h3>
          <span className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">查看更多 &gt;</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex bg-white/5 rounded-xl border border-white/10 p-3 gap-4 hover:bg-white/10 transition-colors">
                    <div className="w-40 h-24 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img src={`https://images.unsplash.com/photo-${i === 1 ? '1518020382971-260167947129' : i === 2 ? '1451187580459-43490279c0fa' : i === 3 ? '1534447677768-be436bb09401' : '1504609773096-104ff10a61d8'}?q=80&w=400&auto=format&fit=crop`} className="w-full h-full object-cover" alt="thumb" />
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
      </motion.div>
      
      {/* Latest Uploads */}
      {realVideos && realVideos.length > 0 && (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-16"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-green-500">🆕</span> 最新上传
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {realVideos.map((video) => (
                    <VideoCard 
                        key={video.id}
                        id={video.id}
                        title={video.title}
                        url={video.url}
                        user_id={video.user_id}
                        author={`用户 ${video.user_id?.slice(0, 6)}...`}
                        created_at={video.created_at}
                    />
                ))}
            </div>
        </motion.div>
      )}

      {/* Hot Videos */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mb-16"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-orange-500">🔥</span> 热门视频
          </h3>
          <span className="text-sm text-blue-400 cursor-pointer hover:text-blue-300">查看更多 &gt;</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard 
                key={video.id}
                id={video.id}
                title={video.title}
                image={video.image}
                author={video.author}
                views={video.views}
                duration={video.duration}
                rank={video.rank}
                showRank={true}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
