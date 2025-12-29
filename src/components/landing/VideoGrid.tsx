"use client"

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Play, Heart, Download, Flame, Clock, ThumbsUp, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { ref, inView } = useInView();

  const fetchVideos = useCallback(async (pageToFetch: number = 0) => {
    if (pageToFetch === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

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
          .range(pageToFetch * 12, (pageToFetch + 1) * 12 - 1);

      if (query) {
          latestQuery = latestQuery.ilike('title', `%${query}%`);
      }

      if (category && category !== "All" && category !== "全部") {
          latestQuery = latestQuery.eq('category', category);
      }

      const { data: latestData, error: latestError } = await latestQuery;
      if (latestError) throw latestError;

      const formatVideo = (v: any) => ({
        ...v,
        author: v.profiles?.full_name || `用户 ${v.user_id?.slice(0, 6)}`,
        user_avatar: v.profiles?.avatar_url
      });

      const formattedVideos = (latestData || []).map(formatVideo);

      if (pageToFetch === 0) {
        setLatestVideos(formattedVideos);
        
        // Fetch Hot Videos only on initial load
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
          
        if (!hotError) {
          setHotVideos((hotData || []).map(formatVideo));
        }
      } else {
        setLatestVideos(prev => [...prev, ...formattedVideos]);
      }

      if (formattedVideos.length < 12) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
      
      setPage(pageToFetch);

    } catch (error) {
      handleError(error, "获取视频列表失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, category, handleError]);

  useEffect(() => {
    setHasMore(true);
    fetchVideos(0);
  }, [fetchVideos]);

  const handleLoadMore = () => {
    fetchVideos(page + 1);
  };

  const VideoSkeleton = () => (
    <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-white/5">
      {/* Thumbnail */}
      <Skeleton className="aspect-video w-full bg-white/5" />
      
      {/* Content */}
      <div className="p-3.5">
        <div className="flex gap-3 items-start">
          {/* Avatar */}
          <Skeleton className="h-8 w-8 rounded-full bg-white/5 flex-shrink-0" />
          
          {/* Text Content */}
          <div className="flex-1 space-y-2">
            {/* Title */}
            <Skeleton className="h-4 w-3/4 bg-white/5" />
            
            {/* Author/Meta */}
            <div className="flex justify-between items-center pt-1">
               <Skeleton className="h-3 w-1/3 bg-white/5" />
               <Skeleton className="h-3 w-12 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="container mx-auto px-4 mb-20" id="videos">
      
      {/* Latest Uploads Section */}
      <div className="mb-16">
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
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {latestVideos.map((video) => (
                    <motion.div key={video.id} variants={item}>
                        <VideoCard {...video} />
                    </motion.div>
                ))}
            </motion.div>
        ) : (
            <div className="text-gray-500 text-center py-20 bg-white/5 rounded-xl border border-white/10">
              <p>暂无相关视频</p>
            </div>
        )}

        {/* Load More Button */}
        {!loading && latestVideos.length > 0 && hasMore && (
           <div className="mt-12 flex justify-center">
             <Button 
                variant="outline" 
                className="rounded-full px-12 py-6 text-base border-white/10 hover:bg-white/10 hover:text-white bg-white/5 transition-all hover:scale-105"
                onClick={handleLoadMore}
                disabled={loadingMore}
             >
                {loadingMore ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        加载中...
                    </>
                ) : (
                    "查看更多"
                )}
             </Button>
           </div>
        )}
      </div>

      {/* Hot Videos Section */}
      {hotVideos.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" /> 热门推荐
            </h3>
          </div>
          
          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {hotVideos.map((video, index) => (
              <motion.div key={`hot-${video.id}`} variants={item}>
                  <VideoCard 
                      {...video}
                      rank={index + 1}
                      showRank={index < 3}
                  />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}
    </div>
  );
}
