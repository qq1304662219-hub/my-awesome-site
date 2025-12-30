"use client"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface FilterState {
  category: string | null;
  style: string | null;
  ratio: string | null;
}

interface FunctionalSidebarProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string | null) => void;
  className?: string;
}

const CATEGORIES = [
  { value: "Live", label: "直播背景" },
  { value: "Commerce", label: "电商短视频" },
  { value: "Game", label: "游戏/CG" },
  { value: "Wallpaper", label: "动态壁纸" },
  // { value: "Other", label: "其他" }
]

const STYLES = [
  { value: "Sci-Fi", label: "赛博/科幻" },
  { value: "Chinese", label: "国潮/古风" },
  { value: "Anime", label: "二次元/动漫" },
  { value: "Realistic", label: "超写实/实拍感" },
  { value: "Abstract", label: "粒子/抽象" },
  // { value: "Other", label: "其他" }
]

const RATIOS = [
  { value: "16:9", label: "横屏 16:9" },
  { value: "9:16", label: "竖屏 9:16 (手机专用)" }
]

export function FunctionalSidebar({ filters, onFilterChange, className }: FunctionalSidebarProps) {
  return (
    <div className={cn("w-64 flex-shrink-0 bg-[#020817] border-r border-white/5", className)}>
      <div className="sticky top-20 h-[calc(100vh-5rem)]">
        <ScrollArea className="h-full px-4 py-6">
          <div className="space-y-8">
            {/* Scenario */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">
                📂 场景用途
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((item) => (
                  <Button
                    key={item.value}
                    variant="ghost"
                    onClick={() => onFilterChange('category', filters.category === item.value ? null : item.value)}
                    className={cn(
                      "w-full justify-start text-sm font-normal",
                      filters.category === item.value 
                        ? "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Style */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">
                🎨 视觉风格
              </h3>
              <div className="space-y-1">
                {STYLES.map((item) => (
                  <Button
                    key={item.value}
                    variant="ghost"
                    onClick={() => onFilterChange('style', filters.style === item.value ? null : item.value)}
                    className={cn(
                      "w-full justify-start text-sm font-normal",
                      filters.style === item.value 
                        ? "bg-purple-600/10 text-purple-400 hover:bg-purple-600/20" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Ratio */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-400 uppercase tracking-wider px-2">
                📐 视频比例
              </h3>
              <div className="space-y-1">
                {RATIOS.map((item) => (
                  <Button
                    key={item.value}
                    variant="ghost"
                    onClick={() => onFilterChange('ratio', filters.ratio === item.value ? null : item.value)}
                    className={cn(
                      "w-full justify-start text-sm font-normal",
                      filters.ratio === item.value 
                        ? "bg-pink-600/10 text-pink-400 hover:bg-pink-600/20" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
