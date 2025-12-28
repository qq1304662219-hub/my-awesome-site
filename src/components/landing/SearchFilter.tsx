"use client"

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

export function SearchFilter() {
  const tags = ["热门", "4K", "赛博朋克", "风景", "二次元", "抽象艺术", "未来科技", "城市"];
  const categories = ["全部", "营销视频", "写实自然", "3D动画", "中国风", "科幻", "抽象", "二次元", "太空"];

  return (
    <div className="container mx-auto px-4 mb-20">
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
            onKeyDown={handleKeyDown}
          />
          <Button 
            className="absolute right-1 top-1 bottom-1 rounded-full bg-blue-600 hover:bg-blue-700 px-6"
            onClick={handleSearch}
          >
            搜索
          </Button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <span className="text-orange-500 flex items-center text-sm mr-2">🔥 热门:</span>
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="bg-white/5 hover:bg-white/10 text-gray-300 cursor-pointer border-white/5">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex justify-center mb-8">
        <Tabs defaultValue="全部" className="w-full max-w-4xl">
          <TabsList className="w-full h-auto flex flex-wrap justify-center bg-transparent gap-2">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white/5 text-gray-400 hover:text-white border border-transparent data-[state=active]:border-blue-500 transition-all"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Filters */}
      <div className="max-w-4xl mx-auto p-4 bg-white/5 rounded-xl border border-white/10 flex flex-wrap items-center gap-4">
        <span className="text-gray-400 text-sm">高级筛选:</span>
        <Select>
          <SelectTrigger className="w-[120px] bg-black/20 border-white/10 text-gray-300 h-9">
            <SelectValue placeholder="所有分辨率" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1080p">1080P</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[120px] bg-black/20 border-white/10 text-gray-300 h-9">
            <SelectValue placeholder="所有时长" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">Short</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[120px] bg-black/20 border-white/10 text-gray-300 h-9">
            <SelectValue placeholder="所有色调" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="light">Light</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <RotateCcw className="h-4 w-4 mr-1" /> 重置
            </Button>
            <Button variant="secondary" size="sm" className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
                <SlidersHorizontal className="h-4 w-4 mr-1" /> 多向筛选
            </Button>
        </div>
      </div>
    </div>
  );
}
