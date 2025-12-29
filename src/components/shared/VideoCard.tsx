
import Link from "next/link";
import Image from "next/image";
import { Play, Heart, Clock, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VideoCardProps {
  id: string | number;
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
}: VideoCardProps) {
  const isVideoUrl = url?.match(/\.(mp4|webm|mov)$/i);
  const displayImage = image || url; // Fallback to url if image is missing (for image/video mix)

  return (
    <div className="group relative bg-[#0f172a] rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      {/* Thumbnail Area */}
      <div className="aspect-video relative overflow-hidden bg-black/50">
        <Link href={`/video/${id}`} className="block w-full h-full" prefetch={true}>
          {isVideoUrl ? (
            <video
              src={url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
              muted
              loop
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
          ) : (
            <div className="relative w-full h-full">
               <Image
                src={displayImage || "/placeholder-image.jpg"}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90 group-hover:opacity-100"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          {/* Rank Badge */}
          {showRank && rank && (
            <div className="absolute top-2 left-2 z-10">
              <Badge
                className={`
                  ${
                    rank === 1
                      ? "bg-yellow-500"
                      : rank === 2
                      ? "bg-gray-400"
                      : rank === 3
                      ? "bg-orange-600"
                      : "bg-blue-500"
                  } 
                  text-white border-0 w-6 h-6 flex items-center justify-center rounded-full p-0 shadow-lg
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
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
              <Play className="fill-white text-white ml-1 w-5 h-5" />
            </div>
          </div>
        </Link>
        
        {/* Hover Actions (Top Right) */}
        <div className="absolute top-2 right-2 z-30 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
             <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-white hover:text-black border border-white/10 transition-colors">
                            <Heart className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>收藏</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-black/60 backdrop-blur-md hover:bg-white hover:text-black border border-white/10 transition-colors">
                            <Clock className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left"><p>稍后观看</p></TooltipContent>
                </Tooltip>
             </TooltipProvider>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="p-3.5">
        <div className="flex gap-3 items-start">
             {/* Author Avatar */}
             <div className="flex-shrink-0 pt-0.5">
                {user_id ? (
                     <Link href={`/profile/${user_id}`}>
                        <Avatar className="h-8 w-8 border border-white/10 hover:border-blue-500 transition-colors">
                            <AvatarImage src={user_avatar} />
                            <AvatarFallback className="bg-blue-600 text-[10px] text-white">
                                {author?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                     </Link>
                ) : (
                    <div className="h-8 w-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                         <span className="text-[10px] text-gray-400">?</span>
                    </div>
                )}
             </div>

             <div className="flex-1 min-w-0">
                <Link href={`/video/${id}`} prefetch={true} className="block group/title">
                    <h4 className="text-gray-200 text-sm font-medium truncate mb-1 group-hover/title:text-blue-400 transition-colors">
                        {title}
                    </h4>
                </Link>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2 truncate">
                         <span className="truncate hover:text-gray-300 transition-colors cursor-pointer">
                            {author || "未知作者"}
                         </span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                     <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        {views && (
                            <span className="flex items-center gap-1 hover:text-gray-300 transition-colors">
                                <Play className="w-3 h-3" /> {views}
                            </span>
                        )}
                         <span className="hover:text-gray-300 transition-colors">
                             {created_at ? new Date(created_at).toLocaleDateString('zh-CN') : ''}
                         </span>
                     </div>
                     
                     <Button variant="ghost" size="icon" className="h-5 w-5 text-gray-500 hover:text-white -mr-1">
                        <MoreHorizontal className="h-3 w-3" />
                     </Button>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
