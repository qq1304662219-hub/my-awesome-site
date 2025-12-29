
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoCardProps {
  id: string | number;
  title: string;
  author?: string;
  user_id?: string;
  views?: string;
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
    <div className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-all hover:transform hover:-translate-y-1">
      <div className="aspect-video relative overflow-hidden bg-black/50">
        <Link href={`/video/${id}`} className="block w-full h-full">
          {isVideoUrl ? (
            <video
              src={url}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              muted
              loop
              onMouseOver={(e) => e.currentTarget.play()}
              onMouseOut={(e) => e.currentTarget.pause()}
            />
          ) : (
            <div className="relative w-full h-full">
               <Image
                src={displayImage || "/placeholder-image.jpg"} // Add a fallback placeholder path if needed
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

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
                  text-white border-0 w-6 h-6 flex items-center justify-center rounded-full p-0
                `}
              >
                {rank}
              </Badge>
            </div>
          )}

          {duration && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-xs text-white z-10">
              {duration}
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Play className="fill-white text-white ml-1" />
            </div>
          </div>
        </Link>
      </div>
      
      <div className="p-4">
        <Link href={`/video/${id}`}>
          <h4 className="text-white font-medium truncate mb-2 hover:text-blue-400 transition-colors">
            {title}
          </h4>
        </Link>
        <div className="flex items-center justify-between text-xs text-gray-400">
            {user_id ? (
                <Link href={`/profile/${user_id}`} className="hover:text-white transition-colors flex items-center gap-1">
                    <span>用户 {user_id.slice(0, 6)}...</span>
                </Link>
            ) : (
                 <span>{author || "Unknown Author"}</span>
            )}
          
          {views && (
            <span className="flex items-center gap-1">
              <Play className="w-3 h-3" /> {views}
            </span>
          )}
           {created_at && (
            <span className="text-xs text-gray-500">
                {new Date(created_at).toLocaleDateString()}
            </span>
           )}
        </div>
      </div>
    </div>
  );
}
