"use client"

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Heart, Download, Flame, Clock, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { VideoCard } from "@/components/shared/VideoCard";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Video } from "@/types/video";
import { Skeleton } from "@/components/ui/skeleton";

export function VideoGrid() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const category = searchParams.get("category");
  const { handleError } = useErrorHandler();
  
  const [latestVideos, setLatestVideos] = useState<Video[]>([]);
  const [hotVideos, setHotVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView();

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Latest Videos
      let latestQuery = supabase
          .from('videos')
          .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false })
          .limit(12);

      if (query) {
          latestQuery = latestQuery.ilike('title', `%${query}%`);
      }

      if (category && category !== "All" && category !== "全部") {
          latestQuery = latestQuery.eq('category', category);
      }

      const { data: latestData, error: latestError } = await latestQuery;
      if (latestError) throw latestError;

      // Fetch Hot Videos (simulated by random limit for now as we don't have enough data)
      // In a real app, this would order by views/likes
      const { data: hotData, error: hotError } = await supabase
          .from('videos')
          .select(`
            *,
            profiles:user_id (
              full_name,
              avatar_url
            )
          `)
          .limit(8); 
          
      if (hotError) throw hotError;

      const formatVideo = (v: any) => ({
        ...v,
        author: v.profiles?.full_name || `用户 ${v.user_id?.slice(0, 6)}`,
        user_avatar: v.profiles?.avatar_url
      });

      setLatestVideos((latestData || []).map(formatVideo));
      setHotVideos((hotData || []).map(formatVideo));

    } catch (error) {
      handleError(error, "获取视频列表失败");
    } finally {
      setLoading(false);
    }
  }, [query, category, handleError]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const VideoSkeleton = () => (
    <div className="space-y-3">
      <Skeleton className="h-[200px] w-full rounded-xl bg-white/5" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px] bg-white/5" />
        <Skeleton className="h-4 w-[200px] bg-white/5" />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 mb-20" id="videos">
      
      {/* Latest Uploads Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-16"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-500" /> 最新发布
          </h3>
        </div>
        
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[...Array(8)].map((_, i) => <VideoSkeleton key={i} />)}
           </div>
        ) : latestVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {latestVideos.map((video) => (
                    <VideoCard 
                        key={video.id}
                        {...video}
                    />
                ))}
            </div>
        ) : (
            <div className="text-gray-500 text-center py-20 bg-white/5 rounded-xl border border-white/10">
              <p>暂无相关视频</p>
            </div>
        )}
      </motion.div>

      {/* Hot Videos Section */}
      {hotVideos.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> 热门推荐
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hotVideos.map((video, index) => (
              <VideoCard 
                  key={`hot-${video.id}`}
                  {...video}
                  rank={index + 1}
                  showRank={index < 3}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
