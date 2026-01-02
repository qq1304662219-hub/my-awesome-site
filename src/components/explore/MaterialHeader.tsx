"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, ChevronDown, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export function MaterialHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    // Local state for search query to avoid jitter
    const [query, setQuery] = useState(searchParams.get("q") || "")
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentQ = searchParams.get("q") || ""
            if (query !== currentQ) {
                updateFilter("q", query || null)
            }
        }, 500)
        return () => clearTimeout(timer)
    }, [query])

    const updateFilter = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        // Reset page when filtering
        params.delete("page")
        router.push(`${pathname}?${params.toString()}`)
    }, [searchParams, pathname, router])

    const getFilterValue = (key: string) => searchParams.get(key)

    // Filter Configurations
    const categories = [
        { label: "全部", value: null },
        { label: "电商", value: "Commerce" },
        { label: "游戏", value: "Game" },
        { label: "直播", value: "Live" },
        { label: "壁纸", value: "Wallpaper" },
    ]

    const styles = [
        { label: "全部风格", value: null },
        { label: "赛博科幻", value: "Sci-Fi" },
        { label: "国潮古风", value: "Chinese" },
        { label: "二次元", value: "Anime" },
        { label: "真实感", value: "Realistic" },
        { label: "抽象艺术", value: "Abstract" },
        { label: "3D渲染", value: "3D" },
    ]

    const activeFiltersCount = Array.from(searchParams.entries()).filter(([key]) => 
        ['ratio', 'duration', 'resolution', 'fps', 'model'].includes(key)
    ).length

    return (
        <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40 border-b border-border transition-all">
            <div className="container mx-auto px-4 py-4 space-y-4">
                
                {/* Top Row: Search & Primary Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-96 shrink-0 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                            className="pl-10 h-10 bg-muted/50 border-transparent hover:bg-muted focus:bg-background focus:border-primary/20 transition-all rounded-full"
                            placeholder="搜索素材..." 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        {query && (
                            <button 
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-muted rounded-full"
                            >
                                <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>

                    {/* Quick Categories (Pills) */}
                    <div className="flex-1 overflow-x-auto no-scrollbar w-full">
                        <div className="flex items-center gap-2">
                            {categories.map((cat) => {
                                const isActive = searchParams.get("category") === cat.value || (!searchParams.get("category") && !cat.value)
                                return (
                                    <button
                                        key={cat.label}
                                        onClick={() => updateFilter("category", cat.value)}
                                        className={`
                                            px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                                            ${isActive 
                                                ? "bg-foreground text-background shadow-md" 
                                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"}
                                        `}
                                    >
                                        {cat.label}
                                    </button>
                                )
                            })}
                            <div className="w-px h-6 bg-border mx-2 shrink-0" />
                            {styles.slice(1).map((style) => { // Skip 'All' for style pills to save space
                                const isActive = searchParams.get("style") === style.value
                                return (
                                    <button
                                        key={style.label}
                                        onClick={() => updateFilter("style", isActive ? null : style.value)} // Toggle
                                        className={`
                                            px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all border
                                            ${isActive 
                                                ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                                                : "bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"}
                                        `}
                                    >
                                        {style.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Bottom Row: Advanced Filters (Dropdowns) */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground mr-2">筛选属性:</span>
                        
                        {/* Ratio */}
                        <FilterDropdown 
                            label="比例" 
                            value={getFilterValue("ratio")}
                            options={[
                                { label: "16:9 横屏", value: "16:9" },
                                { label: "9:16 竖屏", value: "9:16" },
                                { label: "1:1 方形", value: "1:1" },
                                { label: "21:9 宽屏", value: "21:9" },
                            ]}
                            onChange={(v) => updateFilter("ratio", v)}
                        />

                        {/* Duration */}
                        <FilterDropdown 
                            label="时长" 
                            value={getFilterValue("duration")}
                            options={[
                                { label: "0-15秒", value: "short" },
                                { label: "15-60秒", value: "medium" },
                                { label: ">60秒", value: "long" },
                            ]}
                            onChange={(v) => updateFilter("duration", v)}
                        />

                        {/* Resolution */}
                        <FilterDropdown 
                            label="画质" 
                            value={getFilterValue("resolution")}
                            options={[
                                { label: "4K Ultra HD", value: "4k" },
                                { label: "1080P Full HD", value: "1080p" },
                                { label: "720P HD", value: "720p" },
                            ]}
                            onChange={(v) => updateFilter("resolution", v)}
                        />

                         {/* FPS */}
                         <FilterDropdown 
                            label="帧率" 
                            value={getFilterValue("fps")}
                            options={[
                                { label: "60 FPS", value: "60" },
                                { label: "30 FPS", value: "30" },
                                { label: "24 FPS", value: "24" },
                            ]}
                            onChange={(v) => updateFilter("fps", v)}
                        />

                        {/* Model */}
                        <FilterDropdown 
                            label="AI模型" 
                            value={getFilterValue("model")}
                            options={[
                                { label: "Sora", value: "Sora" },
                                { label: "Runway", value: "Runway" },
                                { label: "Pika", value: "Pika" },
                                { label: "Midjourney", value: "Midjourney" },
                                { label: "Stable Video", value: "SVD" },
                            ]}
                            onChange={(v) => updateFilter("model", v)}
                        />

                        {activeFiltersCount > 0 && (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => router.push(pathname)}
                                className="text-muted-foreground hover:text-destructive h-8 px-2 text-xs"
                            >
                                清除筛选
                            </Button>
                        )}
                    </div>

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                                排序 <ChevronDown className="w-3 h-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => updateFilter("sort", "newest")}>最新发布</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateFilter("sort", "popular")}>最多浏览</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
}

function FilterDropdown({ label, value, options, onChange }: { 
    label: string, 
    value: string | null, 
    options: { label: string, value: string }[],
    onChange: (val: string | null) => void 
}) {
    const activeLabel = options.find(o => o.value === value)?.label

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className={`
                        h-8 border-dashed gap-1 text-xs font-normal
                        ${value ? "bg-accent border-solid text-accent-foreground border-accent" : "text-muted-foreground border-border"}
                    `}
                >
                    {label}
                    {value && (
                        <>
                            <div className="w-px h-3 bg-border mx-1" />
                            <span className="font-medium">{activeLabel}</span>
                        </>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onChange(null)}>
                    全部
                </DropdownMenuItem>
                {options.map((opt) => (
                    <DropdownMenuCheckboxItem 
                        key={opt.value}
                        checked={value === opt.value}
                        onCheckedChange={() => onChange(value === opt.value ? null : opt.value)}
                    >
                        {opt.label}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
