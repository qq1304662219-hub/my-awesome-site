"use client"

import { useState, Suspense, useMemo } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { Button } from "@/components/ui/button"
import { Zap, Film, PenTool, Trophy, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { DiscoverHero } from "@/components/discover/DiscoverHero"
import { DiscoverFilters } from "@/components/discover/DiscoverFilters"
import { FeaturedCreators } from "@/components/landing/FeaturedCreators"

function DiscoverContent() {
  const [activeTab, setActiveTab] = useState("featured")
  const [activeSubTab, setActiveSubTab] = useState("all")
  const [extraFilters, setExtraFilters] = useState<{
      ratio: string | null
      duration: string | null
  }>({
      ratio: null,
      duration: null
  })

  const categories = [
    { 
        id: "featured", 
        label: "精选", 
        icon: Zap, 
        description: "每日更新全球优质 AI 视频作品",
        subTabs: [
            { id: "all", label: "全部" },
            { id: "hot", label: "本周热门" },
            { id: "pick", label: "编辑推荐" },
            { id: "latest", label: "最新发布" }
        ]
    },
    { 
        id: "shorts", 
        label: "短片", 
        icon: Film, 
        description: "富有叙事感的 AI 剧情短片",
        subTabs: [
            { id: "all", label: "全部" },
            { id: "drama", label: "剧情短片" },
            { id: "ads", label: "商业广告" },
            { id: "doc", label: "纪录片" }
        ]
    },
    { 
        id: "design", 
        label: "设计", 
        icon: PenTool, 
        description: "前沿视觉设计与动态图形",
        subTabs: [
            { id: "all", label: "全部" },
            { id: "motion", label: "动态图形" },
            { id: "3d", label: "三维设计" },
            { id: "ui", label: "UI概念" }
        ]
    },
    { 
        id: "awarded", 
        label: "获奖", 
        icon: Trophy, 
        description: "社区评选年度最佳 AI 作品",
        subTabs: [
            { id: "all", label: "全部" },
            { id: "best_year", label: "年度最佳" },
            { id: "best_visual", label: "最佳视觉" },
            { id: "best_creative", label: "最佳创意" }
        ]
    },
  ]

  const currentCategory = categories.find(c => c.id === activeTab)

  // Memoize filters to avoid unnecessary re-renders
  const filters = useMemo(() => {
    // Base filters based on main tab
    let base = { 
        category: null as string | null, 
        style: null as string | null, 
        ratio: extraFilters.ratio, 
        model: null, 
        query: null as string | null,
        duration: extraFilters.duration
    }
    
    // Logic to simulate distinct content sections using available DB fields
    switch (activeTab) {
        case "shorts":
            base.category = "Commerce"; // Default bucket for shorts
            if (activeSubTab === "drama") base.category = "Live";
            if (activeSubTab === "ads") base.category = "Commerce";
            if (activeSubTab === "doc") base.style = "Realism"; // Assuming style exists or fallback
            break;
        case "design":
            base.category = "Wallpaper"; // Default bucket for design
            if (activeSubTab === "3d") base.category = "Game";
            if (activeSubTab === "ui") base.style = "Sci-Fi";
            break;
        case "awarded":
            base.style = "Sci-Fi"; // High visual quality bucket
            if (activeSubTab === "best_visual") base.category = "Wallpaper";
            break;
    }

    return base;
  }, [activeTab, activeSubTab, extraFilters])

  const sort = useMemo(() => {
      if (activeTab === "featured" && activeSubTab === "hot") return "popular";
      if (activeTab === "awarded") return "popular";
      return "newest";
  }, [activeTab, activeSubTab])

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 mt-4">
          <DiscoverHero />
      </div>

      {/* Main Tabs */}
      <section className="container mx-auto px-4 mb-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
            {categories.map((cat) => {
                const isActive = activeTab === cat.id
                const Icon = cat.icon
                return (
                    <button
                        key={cat.id}
                        onClick={() => {
                            setActiveTab(cat.id)
                            setActiveSubTab("all") // Reset sub-tab
                        }}
                        className={`
                            group relative px-8 py-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 overflow-hidden
                            ${isActive 
                                ? 'bg-foreground text-background border-foreground shadow-xl scale-105' 
                                : 'bg-card text-muted-foreground border-border hover:border-foreground/20 hover:bg-accent'}
                        `}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-20" />
                        )}
                        <Icon className={`w-5 h-5 ${isActive ? 'text-background' : 'text-foreground'}`} />
                        <span className="font-bold text-lg">{cat.label}</span>
                    </button>
                )
            })}
        </div>

        {/* Sub Categories (Chips) */}
        {currentCategory?.subTabs && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={activeTab} // Re-animate on tab change
                className="flex flex-wrap justify-center gap-2 mb-8"
            >
                {currentCategory.subTabs.map((sub) => (
                    <button
                        key={sub.id}
                        onClick={() => setActiveSubTab(sub.id)}
                        className={`
                            px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                            ${activeSubTab === sub.id 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20' 
                                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border'}
                        `}
                    >
                        {sub.label}
                    </button>
                ))}
            </motion.div>
        )}
      </section>

      {/* Content Grid */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 border-b border-border pb-4 gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg hidden sm:block">
                    {currentCategory?.icon && <currentCategory.icon className="w-6 h-6 text-blue-500" />}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">
                        {currentCategory?.label}内容
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {currentCategory?.description}
                    </p>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <DiscoverFilters 
                    filters={extraFilters} 
                    onChange={(k, v) => setExtraFilters(prev => ({ ...prev, [k]: v }))} 
                />
                <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                    <span className="text-muted-foreground">当前排序:</span>
                    <span className="px-3 py-1 bg-muted rounded-md text-foreground font-medium">
                        {sort === 'popular' ? '最受欢迎' : '最新发布'}
                    </span>
                </div>
            </div>
        </div>

        <VideoGrid filters={filters} sort={sort} />
        
        {/* Featured Creators Section */}
        <div className="mt-20">
             <FeaturedCreators />
        </div>
      </section>
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <DiscoverContent />
      </Suspense>
      <Footer />
    </main>
  )
}
