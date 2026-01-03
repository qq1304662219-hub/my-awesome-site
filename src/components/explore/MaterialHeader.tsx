"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, ChevronDown, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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

import {
    CATEGORIES,
    STYLES,
    AI_MODELS,
    MOVEMENTS,
    RATIOS,
    RESOLUTIONS,
    DURATIONS,
    FPS_OPTIONS
} from "@/lib/constants"

const filterConfig = [
    { key: "style", label: "视觉风格", options: STYLES },
    { key: "category", label: "内容题材", options: CATEGORIES },
    { key: "model", label: "AI 模型", options: AI_MODELS },
    { key: "movement", label: "镜头语言", options: MOVEMENTS },
    { key: "ratio", label: "比例", options: RATIOS },
    { key: "resolution", label: "画质", options: RESOLUTIONS },
    { key: "duration", label: "时长", options: DURATIONS },
    { key: "fps", label: "帧率", options: FPS_OPTIONS },
]

export function MaterialHeader() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    
    // Local state for search query to avoid jitter
    const [query, setQuery] = useState(searchParams.get("q") || "")

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

    // Calculate active filters for display
    const activeFilters = filterConfig.flatMap(config => {
        const value = searchParams.get(config.key)
        if (!value) return []
        const option = config.options.find(opt => opt.value === value)
        return [{
            key: config.key,
            label: config.label,
            value: value,
            display: option ? option.label : value
        }]
    })

    const clearAllFilters = () => {
        const params = new URLSearchParams(searchParams.toString())
        filterConfig.forEach(config => params.delete(config.key))
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40 border-b border-border transition-all">
            <div className="container mx-auto px-4 py-4 space-y-4">
                
                {/* Row 1: Search & Filter Dropdowns */}
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
                    {/* Search Bar */}
                    <div className="relative w-full xl:w-[500px] shrink-0 group">
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

                    {/* Filter Dropdowns - Scrollable on mobile */}
                    <div className="flex-1 w-full overflow-x-auto no-scrollbar pb-2 xl:pb-0">
                        <div className="flex items-center gap-2 min-w-max xl:w-full xl:justify-end">
                            <span className="text-xs font-medium text-muted-foreground mr-1 hidden md:inline-block">筛选属性:</span>
                            
                            {filterConfig.map((config) => (
                                <FilterDropdown 
                                    key={config.key}
                                    label={config.label} 
                                    value={getFilterValue(config.key)}
                                    options={config.options}
                                    onChange={(v) => updateFilter(config.key, v)}
                                />
                            ))}

                            <div className="w-px h-6 bg-border mx-2" />

                             {/* Sort */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground whitespace-nowrap">
                                        排序 <ChevronDown className="w-3 h-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateFilter("sort", "newest")}>最新发布</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateFilter("sort", "popular")}>最多浏览</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateFilter("sort", "most_downloaded")}>最多下载</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateFilter("sort", "most_collected")}>最多收藏</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateFilter("sort", "most_liked")}>最多点赞</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>

                {/* Row 2: Selected Filters (Conditions Bar) */}
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        <span className="text-xs text-muted-foreground mr-1">已选条件:</span>
                        {activeFilters.map((filter) => (
                            <Badge 
                                key={`${filter.key}-${filter.value}`} 
                                variant="secondary"
                                className="gap-1 pl-2 pr-1 py-1 hover:bg-destructive/10 hover:text-destructive transition-colors group cursor-pointer"
                                onClick={() => updateFilter(filter.key, null)}
                            >
                                {filter.display}
                                <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            </Badge>
                        ))}
                        
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={clearAllFilters}
                            className="text-xs text-muted-foreground hover:text-foreground h-6 px-2 ml-auto sm:ml-0"
                        >
                            清空筛选
                        </Button>
                    </div>
                )}
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
                        h-8 border-dashed gap-1 text-xs font-normal whitespace-nowrap
                        ${value ? "bg-accent border-solid text-accent-foreground border-accent" : "text-muted-foreground border-border"}
                    `}
                >
                    {label}
                    {value && (
                        <>
                            <div className="w-px h-3 bg-border mx-1" />
                            <span className="font-medium max-w-[80px] truncate">{activeLabel}</span>
                        </>
                    )}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto">
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
