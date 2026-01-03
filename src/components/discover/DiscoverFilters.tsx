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
        <div className="w-full overflow-hidden">
            <div className="flex flex-nowrap items-center gap-4 py-4 overflow-x-auto pb-6 -mb-6 scrollbar-hide mask-fade-right">
                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm shrink-0">
                    <span className="text-xs font-medium px-2 text-muted-foreground flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5" /> 
                        <span className="hidden sm:inline">比例</span>
                    </span>
                    <Button 
                        variant={filters.ratio === null ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("ratio", null)}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.ratio === null ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        全部
                    </Button>
                    <Button 
                        variant={filters.ratio === "16:9" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("ratio", "16:9")}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.ratio === "16:9" ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        16:9
                    </Button>
                    <Button 
                        variant={filters.ratio === "9:16" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("ratio", "9:16")}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.ratio === "9:16" ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        9:16
                    </Button>
                </div>

                <div className="w-px h-8 bg-border/50 shrink-0 hidden sm:block" />

                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50 backdrop-blur-sm shrink-0">
                    <span className="text-xs font-medium px-2 text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">时长</span>
                    </span>
                    <Button 
                        variant={filters.duration === null ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("duration", null)}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.duration === null ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        全部
                    </Button>
                    <Button 
                        variant={filters.duration === "short" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("duration", "short")}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.duration === "short" ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        &lt;15s
                    </Button>
                    <Button 
                        variant={filters.duration === "medium" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("duration", "medium")}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.duration === "medium" ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        15-60s
                    </Button>
                    <Button 
                        variant={filters.duration === "long" ? "secondary" : "ghost"} 
                        size="sm" 
                        onClick={() => onChange("duration", "long")}
                        className={`h-8 text-xs rounded-lg transition-all ${filters.duration === "long" ? 'bg-background shadow-sm text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        &gt;60s
                    </Button>
                </div>
            </div>
        </div>
    )
}
