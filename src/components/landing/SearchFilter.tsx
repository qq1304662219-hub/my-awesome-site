"use client"

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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

const CATEGORIES = [
  { id: "All", label: "全部" },
  { id: "Nature", label: "自然" },
  { id: "Abstract", label: "抽象" },
  { id: "Technology", label: "科技" },
  { id: "People", label: "人物" },
  { id: "Animals", label: "动物" },
  { id: "Urban", label: "城市" },
  { id: "Other", label: "其他" }
];

export function SearchFilter({ onOpenFilters }: { onOpenFilters?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
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
        const currentQ = searchParams.get("q") || "";
        if (currentQ !== searchQuery.trim()) {
            router.push(`${pathname}?${params.toString()}`);
        }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, router, searchParams, pathname]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const params = new URLSearchParams(searchParams.toString());
    if (category && category !== "All") {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="container mx-auto px-4 mb-12">
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
        <div className="max-w-2xl mx-auto relative mb-8">
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

        {/* Filter Section - Reference Style */}
        <div className="max-w-6xl mx-auto space-y-4 mb-8">
            {/* Row 1: Main Tabs */}
            <div className="flex items-center gap-4 border-b border-white/5 pb-2">
                <div className="flex gap-6">
                    <button className="text-white font-medium border-b-2 border-blue-500 pb-2">视频</button>
                    <button className="text-gray-400 hover:text-white transition-colors pb-2">图片</button>
                    <button className="text-gray-400 hover:text-white transition-colors pb-2">音乐</button>
                    <button className="text-gray-400 hover:text-white transition-colors pb-2">案例</button>
                    <button className="text-gray-400 hover:text-white transition-colors pb-2">服务</button>
                </div>
            </div>

            {/* Row 2: Type Filter */}
            <div className="flex items-start gap-4">
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-3 py-1 text-sm rounded-md transition-all ${
                                activeCategory === cat.id
                                    ? "bg-white text-black font-medium"
                                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">实拍素材</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">AE模板</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">C4D模型</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">Pr模板</button>
                    <button 
                        onClick={onOpenFilters}
                        className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white flex items-center"
                    >
                        更多 <SlidersHorizontal className="inline w-3 h-3 ml-1" />
                    </button>
                </div>
            </div>

            {/* Row 3: Style Filter */}
            <div className="flex items-start gap-4">
                <div className="flex flex-wrap gap-2">
                    <button className="px-3 py-1 text-sm rounded-md bg-white text-black font-medium">全部风格</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">实拍专区</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">立体三维</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">平面二维</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">抽象光影</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">科技未来</button>
                    <button className="px-3 py-1 text-sm rounded-md bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white">粒子特效</button>
                </div>
            </div>
        </div>
      </motion.div>


      {/* Filters Bar */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-6xl mx-auto py-2 border-t border-white/5 flex flex-wrap items-center gap-4 text-sm"
      >
        <div className="flex items-center gap-2">
            <span className="text-gray-400 cursor-pointer hover:text-white transition-colors">综合排序</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-400 cursor-pointer hover:text-white transition-colors">最新发布</span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-400 cursor-pointer hover:text-white transition-colors">最多浏览</span>
        </div>

        <div className="h-4 w-px bg-white/10 mx-2"></div>

        <Select>
          <SelectTrigger className="w-[100px] border-none bg-transparent text-gray-400 hover:text-white h-8 p-0 text-sm focus:ring-0">
            <SelectValue placeholder="分辨率" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1080p">1080P</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[100px] border-none bg-transparent text-gray-400 hover:text-white h-8 p-0 text-sm focus:ring-0">
            <SelectValue placeholder="宽高比" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="16:9">16:9</SelectItem>
            <SelectItem value="9:16">9:16</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[100px] border-none bg-transparent text-gray-400 hover:text-white h-8 p-0 text-sm focus:ring-0">
            <SelectValue placeholder="时长" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">短视频</SelectItem>
            <SelectItem value="medium">中长视频</SelectItem>
          </SelectContent>
        </Select>

         <Select>
          <SelectTrigger className="w-[100px] border-none bg-transparent text-gray-400 hover:text-white h-8 p-0 text-sm focus:ring-0">
            <SelectValue placeholder="格式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mp4">MP4</SelectItem>
            <SelectItem value="webm">WebM</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-8 text-xs px-2" onClick={() => {
              setSearchQuery("");
              setActiveCategory("All");
              router.push("/");
            }}>
                <RotateCcw className="h-3 w-3 mr-1" /> 重置筛选
            </Button>
        </div>
      </motion.div>
    </div>
  );
}
