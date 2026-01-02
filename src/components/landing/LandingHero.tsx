"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles, Search, PlayCircle, Zap } from "lucide-react"
import { SearchInput, SearchInputHandle } from "@/components/shared/SearchInput"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export function LandingHero() {
  const router = useRouter()
  const searchInputRef = useRef<SearchInputHandle>(null)
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({
    videos: "10W+",
    creators: "5000+", 
    time: "24h"
  })

  useEffect(() => {
    setMounted(true)
    const fetchStats = async () => {
      try {
        const { count: videoCount } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published')
          
        const { count: creatorCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'creator')
          
        if (videoCount !== null || creatorCount !== null) {
          setStats(prev => ({
            ...prev,
            videos: videoCount ? (videoCount > 10000 ? `${(videoCount/10000).toFixed(1)}W+` : `${videoCount}+`) : "0+",
            creators: creatorCount ? (creatorCount > 1000 ? `${(creatorCount/1000).toFixed(1)}k+` : `${creatorCount}+`) : "0+"
          }))
        }
      } catch (e) {
        console.error('Error fetching stats:', e)
      }
    }
    fetchStats()
  }, [])

  const handleLearnMore = () => {
    if (searchInputRef.current) {
      searchInputRef.current.search()
    } else {
      router.push('/explore')
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted-foreground)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted-foreground)/0.1)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Radial Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.15),transparent)]"></div>
        
        {/* Moving Gradient Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="container relative z-10 px-4 text-center max-w-5xl mx-auto pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-300 mb-8 backdrop-blur-sm hover:bg-blue-500/20 transition-all cursor-pointer group">
            <Zap className="h-4 w-4 fill-blue-500/50 group-hover:fill-blue-500 transition-colors" />
            <span className="text-sm font-medium">AI 视频生成与素材交易平台</span>
            <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-foreground mb-6 leading-tight">
            <span className="block">创意无界</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient-x">
              AI Vision
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            汇聚全球顶尖 AI 创作者，探索 Sora, Midjourney, Runway 等前沿模型生成的 4K 视频素材。
            <br className="hidden md:block" />
            为您的创意项目注入无限灵感。
          </p>

          {/* Search Section */}
          <div className="w-full max-w-3xl mx-auto relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
             <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl border border-border p-2 flex items-center shadow-2xl">
                <Search className="h-6 w-6 text-muted-foreground ml-4" />
                <SearchInput 
                    ref={searchInputRef}
                    className="flex-1"
                    inputClassName="!bg-transparent !border-none !text-lg !h-14 !text-foreground !placeholder:text-muted-foreground !shadow-none !rounded-none focus:!ring-0"
                    placeholder="搜索: 赛博朋克, 自然风光, 商业广告, 4K..."
                    showIcon={false}
                />
                <Button onClick={handleLearnMore} size="lg" className="h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 transition-all hover:scale-105">
                    搜索
                </Button>
             </div>
          </div>

          {/* Trending Tags */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
             <span className="text-muted-foreground text-sm py-1.5">热门趋势:</span>
             {['Sora', 'Runway Gen-3', 'Midjourney V6', 'Cyberpunk', 'Nature', 'Abstract'].map((tag, i) => (
                <Link key={tag} href={`/explore?q=${tag}`}>
                    <span className="px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground text-sm hover:bg-muted/80 hover:text-foreground hover:border-foreground/20 transition-all cursor-pointer">
                        {tag}
                    </span>
                </Link>
             ))}
          </div>

          {/* Stats / Trust Indicators */}
          <div className="mt-20 grid grid-cols-3 gap-8 md:gap-16 border-t border-border pt-10">
              <div className="text-center">
                  <h4 className="text-3xl font-bold text-foreground mb-1">{stats.videos}</h4>
                  <p className="text-sm text-muted-foreground">优质素材</p>
              </div>
              <div className="text-center">
                  <h4 className="text-3xl font-bold text-foreground mb-1">{stats.creators}</h4>
                  <p className="text-sm text-muted-foreground">认证创作者</p>
              </div>
              <div className="text-center">
                  <h4 className="text-3xl font-bold text-foreground mb-1">{stats.time}</h4>
                  <p className="text-sm text-muted-foreground">极速审核</p>
              </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
