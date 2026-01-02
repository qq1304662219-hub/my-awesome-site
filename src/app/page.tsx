"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { LandingHero } from "@/components/landing/LandingHero"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { FeaturedCreators } from "@/components/landing/FeaturedCreators"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Zap, TrendingUp, Award } from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Navbar />
      
      <LandingHero />

      {/* Popular Tags Section (New) */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-20">
        {/* ... existing tags code ... */}
      </section>

      {/* Curated Categories Section */}
      <section className="container mx-auto px-4 mb-20">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                灵感分类
            </h2>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { name: "自然风光", en: "Nature", icon: "🌿", color: "from-green-500/20 to-emerald-500/20", border: "hover:border-green-500/50" },
                { name: "城市建筑", en: "Architecture", icon: "🏙️", color: "from-blue-500/20 to-cyan-500/20", border: "hover:border-blue-500/50" },
                { name: "科技未来", en: "Technology", icon: "🚀", color: "from-purple-500/20 to-pink-500/20", border: "hover:border-purple-500/50" },
                { name: "商务生活", en: "Business", icon: "💼", color: "from-orange-500/20 to-amber-500/20", border: "hover:border-orange-500/50" },
            ].map((cat) => (
                <Link key={cat.en} href={`/explore?category=${cat.en}`}>
                    <div className={`
                        group relative overflow-hidden rounded-xl bg-gradient-to-br ${cat.color} border border-border p-6 h-40 flex flex-col justify-end transition-all duration-300 ${cat.border} hover:-translate-y-1 hover:shadow-xl
                    `}>
                        <div className="absolute top-4 right-4 text-4xl opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12">{cat.icon}</div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">{cat.en}</p>
                    </div>
                </Link>
            ))}
         </div>
      </section>

      {/* Featured Videos Section */}
      <section className="container mx-auto px-4 py-12 pt-0">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-2">
                    <TrendingUp className="w-8 h-8 text-blue-400" />
                    内容精选
                </h2>
                <p className="text-muted-foreground">
                    探索社区最受欢迎的 AI 视频作品
                </p>
            </div>
            <Link href="/explore">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent gap-2">
                    查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
            </Link>
        </div>
        
        <ErrorBoundary>
            <VideoGrid filters={{ category: null, style: null, ratio: null, model: null }} sort="popular" />
        </ErrorBoundary>
      </section>

      {/* Featured Creators Section */}
      <FeaturedCreators />

    </main>
  )
}
