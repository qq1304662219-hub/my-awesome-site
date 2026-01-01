"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function SearchFilter({ onOpenFilters }: { onOpenFilters?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialQuery = searchParams.get("q") || "";

  const [searchQuery, setSearchQuery] = useState(initialQuery);

  useEffect(() => {
    const query = searchParams.get("q") || "";
    if (query !== searchQuery) {
        setSearchQuery(query);
    }
  }, [searchParams]);

  // Real-time search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchQuery.trim()) {
            params.set("q", searchQuery.trim());
        } else {
            params.delete("q");
        }
        
        // Only push if the query actually changed relative to the URL
        const currentQ = searchParams.get("q") || "";
        if (currentQ !== searchQuery.trim()) {
            router.push(`${pathname}?${params.toString()}`);
        }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams, pathname]);

  // Handle sort change
  const handleSortChange = (value: string) => {
    setSort(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 mb-8">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 inline-block mb-2 blur-[0.5px]">
            探索 未来视界
            </h2>
            <p className="text-gray-500">个性化筛选 AI 视频素材库，上传 Prompts，作品，互助共赢。</p>
        </div>

        {/* Search Bar & Sort */}
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                    className="w-full h-12 pl-12 bg-white/5 border-white/10 text-white rounded-full focus-visible:ring-blue-500 placeholder:text-gray-500"
                    placeholder="搜索生成的AI视频，场景，Midjourney..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="flex gap-2">
                <Select value={sort} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[140px] h-12 bg-white/5 border-white/10 text-white rounded-full">
                        <ArrowUpDown className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="排序" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">最新发布</SelectItem>
                        <SelectItem value="popular">最多浏览</SelectItem>
                    </SelectContent>
                </Select>
                
                <Button 
                    variant="outline" 
                    className="lg:hidden h-12 px-6 border-white/10 bg-white/5 text-gray-300 rounded-full"
                    onClick={onOpenFilters}
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    筛选
                </Button>
            </div>
        </div>
      </motion.div>
    </div>
  )
}
