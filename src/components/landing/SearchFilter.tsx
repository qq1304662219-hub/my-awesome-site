"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

const CATEGORIES = ["All", "Nature", "Abstract", "Technology", "People", "Animals", "Urban", "Other"];

export function SearchFilter({ onOpenFilters }: { onOpenFilters?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    setActiveCategory(searchParams.get("category") || "All");
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
        // (to avoid infinite loops if the URL update triggers the first useEffect which triggers this one)
        // But since we are debouncing user input, we should check if URL needs update.
        const currentQ = searchParams.get("q") || "";
        if (currentQ !== searchQuery.trim()) {
            router.push(`/?${params.toString()}`);
        }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== "All") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 mb-20">
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

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative mb-6">
            <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
                className="w-full h-12 pl-12 pr-24 bg-white/5 border-white/10 text-white rounded-full focus-visible:ring-blue-500 placeholder:text-gray-500"
                placeholder="搜索生成的AI视频，场景，Midjourney..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
                className="absolute right-1 top-1 bottom-1 rounded-full bg-blue-600 hover:bg-blue-700 px-6"
            >
                搜索
            </Button>
            </div>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-8">
            <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full max-w-4xl">
            <TabsList className="w-full h-auto flex flex-wrap justify-center bg-transparent gap-2">
                {CATEGORIES.map((cat) => (
                <TabsTrigger 
                    key={cat} 
                    value={cat}
                    className="rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white/5 text-gray-400 hover:text-white border border-transparent data-[state=active]:border-blue-500 transition-all"
                >
                    {cat === "All" ? "全部" : cat}
                </TabsTrigger>
                ))}
            </TabsList>
            </Tabs>
        </div>
      </motion.div>


      {/* Filters */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl mx-auto py-1 px-3 bg-white/5 rounded-xl border border-white/10 flex flex-wrap items-center gap-2"
      >
        <span className="text-gray-400 text-xs">高级筛选:</span>
        <Select>
          <SelectTrigger className="w-[110px] bg-black/20 border-white/10 text-gray-300 h-7 text-xs">
            <SelectValue placeholder="所有分辨率" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1080p">1080P</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[110px] bg-black/20 border-white/10 text-gray-300 h-7 text-xs">
            <SelectValue placeholder="所有时长" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">Short</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[110px] bg-black/20 border-white/10 text-gray-300 h-7 text-xs">
            <SelectValue placeholder="所有格式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4</SelectItem>
            <SelectItem value="webm">WebM</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 text-xs px-2" onClick={() => {
              setSearchQuery("");
              setActiveCategory("All");
              router.push("/explore");
            }}>
                <RotateCcw className="h-3 w-3 mr-1" /> 重置
            </Button>
            
            <Button 
              variant="secondary" 
              size="sm" 
              className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 h-7 text-xs px-2"
              onClick={onOpenFilters}
            >
                <SlidersHorizontal className="h-3 w-3 mr-1" /> 多向筛选
            </Button>
        </div>
      </motion.div>
    </div>
  );
}
