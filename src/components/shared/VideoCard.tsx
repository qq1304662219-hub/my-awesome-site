"use client"

import Link from "next/link";
import Image from "next/image";
import { Play, Heart, Clock, ShoppingCart, Loader2, FolderPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { AddToCollectionModal } from "@/components/video/AddToCollectionModal";
import { cn } from "@/lib/utils";

export interface VideoCardProps {
  id: string;
  title: string;
  author?: string;
  user_id?: string;
  user_avatar?: string;
  views?: string | number;
  duration?: string;
  image?: string;
  url?: string;
  rank?: number;
  created_at?: string;
  showRank?: boolean;
  price?: number;
  ai_model?: string;
  className?: string;
  aspectRatio?: "video" | "square" | "portrait" | "auto";
}

export function VideoCard({
  id,
  title,
  author,
  user_id,
  user_avatar,
  views,
  duration,
  image,
  url,
  rank,
  created_at,
  showRank = false,
  price = 0,
  ai_model,
  className,
  aspectRatio = "video",
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isVideoUrl = url?.match(/\.(mp4|webm|mov)$/i);
  // Prioritize image (thumbnail), fallback to url if it's an image
  const displayImage = image || (!isVideoUrl ? url : null); 
  const [addingToCart, setAddingToCart] = useState(false);
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkLiked = async () => {
        const { data } = await supabase
            .from('likes')
            .select('*')
            .eq('user_id', user.id)
            .eq('video_id', id)
            .single();
        if (data) setHasLiked(true);
    };
    checkLiked();
  }, [user, id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
        toast.error("请先登录");
        return;
    }

    if (hasLiked) {
        await supabase.from('likes').delete().eq('user_id', user.id).eq('video_id', id);
        setHasLiked(false);
        toast.success("已取消点赞");
    } else {
        await supabase.from('likes').insert({ user_id: user.id, video_id: id });
        setHasLiked(true);
        toast.success("已点赞");

        if (user_id && user.id !== user_id) {
            await supabase.from("notifications").insert({
                user_id: user_id,
                actor_id: user.id,
                type: "like",
                resource_id: id,
                resource_type: "video",
                content: `赞了你的视频${title ? `: ${title}` : ''}`,
                is_read: false
            });
        }
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || !isVideoUrl) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setIsHovered(entry.isIntersecting);
      });
    }, { threshold: 0.5 }); // Lower threshold for better mobile experience

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [isMobile, isVideoUrl]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
        toast.error("请先登录");
        return;
    }

    setAddingToCart(true);
    try {
        const { error } = await supabase.from('cart_items').insert({
            user_id: user.id,
            video_id: id,
            license_type: 'personal'
        });

        if (error) {
            if (error.code === '23505') { // Unique violation
                toast.warning("该视频已在购物车中");
            } else {
                throw error;
            }
        } else {
            toast.success("已加入购物车");
        }
    } catch (error) {
        console.error(error);
        toast.error("加入购物车失败");
    } finally {
        setAddingToCart(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "group relative flex flex-col rounded-xl overflow-hidden bg-card border border-border transition-all duration-300 hover:shadow-2xl hover:border-primary/50 active:scale-[0.98]", 
        className
      )}
      onMouseEnter={() => {
        if (!isMobile) {
            setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isMobile) {
            setIsHovered(false);
        }
      }}
    >
      {/* Thumbnail Area */}
      <div className={cn(
        "relative overflow-hidden bg-muted",
        aspectRatio === "video" ? "aspect-video" : 
        aspectRatio === "square" ? "aspect-square" :
        aspectRatio === "portrait" ? "aspect-[3/4]" : ""
      )}>
          {/* AI Model Badge */}
          {ai_model && (
            <div className="absolute bottom-2 left-2 z-20">
                <Badge variant="secondary" className="bg-background/60 hover:bg-background/70 text-foreground backdrop-blur-sm border border-border text-[10px] px-1.5 py-0.5 shadow-sm">
                    {ai_model}
                </Badge>
            </div>
        )}
        
        <Link href={`/video/${id}`} className="block w-full h-full" prefetch={true}>
          {/* Show Video on Hover if available */}
          {isVideoUrl && isHovered ? (
            <video
              src={url}
              className={cn("w-full object-cover animate-in fade-in duration-300", aspectRatio !== "auto" ? "h-full" : "h-auto")}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : (
            /* Show Image otherwise */
            aspectRatio === "auto" ? (
                 <div className="relative w-full">
                   {displayImage ? (
                     <img
                         src={displayImage}
                         alt={title}
                         className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                         loading="lazy"
                     />
                   ) : (
                      isVideoUrl && (
                         <video
                             src={url}
                             className="w-full h-auto object-cover opacity-90"
                             muted
                             playsInline
                         />
                      )
                   )}
                 </div>
            ) : (
                <div className="relative w-full h-full">
                  {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    /* Fallback for video without thumbnail and not hovering */
                     isVideoUrl && (
                        <video
                            src={url}
                            className="w-full h-full object-cover opacity-90"
                            muted
                            playsInline
                        />
                     )
                  )}
                </div>
            )
          )}

          {/* Add to Cart Button (Hover) */}
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-sm border border-white/10"
                onClick={handleAddToCart}
                disabled={addingToCart}
                aria-label="添加到购物车"
             >
                {addingToCart ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
             </Button>
          </div>

          {/* Rank Badge */}
          {showRank && rank && (
            <div className="absolute top-2 left-2 z-10">
              <Badge
                className={`
                  ${
                    rank === 1
                      ? "bg-yellow-500 text-black dark:bg-yellow-600"
                      : rank === 2
                      ? "bg-gray-400 text-white dark:bg-gray-500"
                      : rank === 3
                      ? "bg-orange-600 text-white dark:bg-orange-700"
                      : "bg-blue-500 text-white dark:bg-blue-600"
                  } 
                  border-0 w-6 h-6 flex items-center justify-center rounded-full p-0 shadow-lg
                `}
              >
                {rank}
              </Badge>
            </div>
          )}

          {/* Duration Badge */}
          {duration && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] font-medium text-white z-10 border border-white/10">
              {duration}
            </div>
          )}

          {/* Play Overlay */}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none z-20">
            <div className="w-12 h-12 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300" aria-label="播放视频">
              <Play className="fill-white text-white ml-1 w-5 h-5" />
            </div>
          </div>
        </Link>
        
        {/* Hover Actions (Top Right) */}
        <div className={`absolute top-2 right-12 z-30 flex gap-2 transition-all duration-300 ${isMobile ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0'}`}>
             <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className={`h-8 w-8 rounded-full backdrop-blur-md hover:bg-secondary hover:text-foreground border border-border transition-colors ${hasLiked ? 'bg-primary text-primary-foreground' : 'bg-background/60 text-muted-foreground'}`}
                            aria-label="收藏"
                            onClick={handleLike}
                        >
                            <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom"><p>{hasLiked ? "取消收藏" : "收藏"}</p></TooltipContent>
                </Tooltip>
                <AddToCollectionModal 
                    videoId={id}
                    trigger={
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-8 w-8 rounded-full bg-black/50 hover:bg-primary text-white backdrop-blur-sm border border-white/10 transition-colors" 
                            aria-label="添加到收藏"
                            onClick={(e) => {
                                e.stopPropagation(); 
                            }}
                        >
                            <FolderPlus className="h-4 w-4" />
                        </Button>
                    }
                />
             </TooltipProvider>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-3.5">
        <div className="flex gap-3 items-start">
             {/* Author Avatar */}
             <div className="flex-shrink-0 pt-0.5">
                {user_id ? (
                     <Link href={`/profile/${user_id}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar className="h-8 w-8 border border-border hover:border-primary transition-colors">
                            <AvatarImage src={user_avatar} />
                            <AvatarFallback className="bg-primary text-[10px] text-primary-foreground">
                                {author?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                     </Link>
                ) : (
                    <Avatar className="h-8 w-8 border border-border">
                        <AvatarImage src={user_avatar} />
                        <AvatarFallback className="bg-muted text-[10px] text-muted-foreground">U</AvatarFallback>
                    </Avatar>
                )}
             </div>

             {/* Info */}
             <div className="flex-1 min-w-0">
                <Link href={`/video/${id}`} className="block group/title">
                    <h3 className="text-sm font-medium text-foreground group-hover/title:text-primary transition-colors line-clamp-2 leading-tight mb-1">
                        {title}
                    </h3>
                </Link>
                
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                         {user_id ? (
                            <Link href={`/profile/${user_id}`} className="hover:text-primary transition-colors cursor-pointer truncate" onClick={(e) => e.stopPropagation()}>
                                {author || "Unknown"}
                            </Link>
                         ) : (
                            <span className="hover:text-foreground transition-colors cursor-pointer truncate">
                                {author || "Unknown"}
                            </span>
                         )}
                    </div>
                    <span className="flex-shrink-0 ml-2">{views} 次观看</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                        {created_at ? new Date(created_at).toLocaleDateString() : ''}
                    </span>
                    {price > 0 ? (
                        <span className="text-yellow-600 dark:text-yellow-400 font-bold text-xs">
                            {price} A币
                        </span>
                    ) : (
                         <span className="text-green-600 dark:text-green-400 font-bold text-xs">
                            免费
                        </span>
                    )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
