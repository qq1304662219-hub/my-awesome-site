"use client"

import { Button } from "@/components/ui/button"
import { Monitor, Smartphone, Clock, Zap } from "lucide-react"

interface DiscoverFiltersProps {
    filters: {
        ratio: string | null
        duration: string | null
    }
    onChange: (key: string, value: string | null) => void
}

export function DiscoverFilters({ filters, onChange }: DiscoverFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 py-4 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
                <span className="text-xs font-medium px-2 text-muted-foreground flex items-center gap-1">
                    <Monitor className="w-3 h-3" /> 比例
                </span>
                <Button 
                    variant={filters.ratio === null ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("ratio", null)}
                    className="h-7 text-xs"
                >
                    全部
                </Button>
                <Button 
                    variant={filters.ratio === "16:9" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("ratio", "16:9")}
                    className="h-7 text-xs"
                >
                    16:9
                </Button>
                <Button 
                    variant={filters.ratio === "9:16" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("ratio", "9:16")}
                    className="h-7 text-xs"
                >
                    9:16
                </Button>
            </div>

            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border border-border">
                <span className="text-xs font-medium px-2 text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 时长
                </span>
                <Button 
                    variant={filters.duration === null ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("duration", null)}
                    className="h-7 text-xs"
                >
                    全部
                </Button>
                <Button 
                    variant={filters.duration === "short" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("duration", "short")}
                    className="h-7 text-xs"
                >
                    &lt;15s
                </Button>
                <Button 
                    variant={filters.duration === "medium" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("duration", "medium")}
                    className="h-7 text-xs"
                >
                    15-60s
                </Button>
                <Button 
                    variant={filters.duration === "long" ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => onChange("duration", "long")}
                    className="h-7 text-xs"
                >
                    &gt;60s
                </Button>
            </div>
        </div>
    )
}
