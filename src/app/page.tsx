"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { LandingHero } from "@/components/landing/LandingHero"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30">
      <Navbar />
      
      <LandingHero />

      {/* Popular Tags Section (New) */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-wider">热门搜索 (Trending)</h3>
            <div className="flex flex-wrap gap-3">
                {["Cyberpunk", "Nature", "City", "Abstract", "Business", "Technology", "Space", "Anime", "4K", "Sora"].map((tag) => (
                    <Link key={tag} href={`/explore?q=${encodeURIComponent(tag)}`}>
                        <span className="px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/50 hover:text-blue-400 transition-all cursor-pointer text-sm text-gray-300">
                            #{tag}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
      </section>

      {/* Curated Categories Section (New) */}
      <section className="container mx-auto px-4 mb-20">
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { name: "自然风光", en: "Nature", icon: "🌿", color: "from-green-500/20 to-emerald-500/20", border: "hover:border-green-500/50" },
                { name: "城市建筑", en: "Architecture", icon: "🏙️", color: "from-blue-500/20 to-cyan-500/20", border: "hover:border-blue-500/50" },
                { name: "科技未来", en: "Technology", icon: "🚀", color: "from-purple-500/20 to-pink-500/20", border: "hover:border-purple-500/50" },
                { name: "商务生活", en: "Business", icon: "💼", color: "from-orange-500/20 to-amber-500/20", border: "hover:border-orange-500/50" },
            ].map((cat) => (
                <Link key={cat.en} href={`/explore?category=${cat.en}`}>
                    <div className={`
                        group relative overflow-hidden rounded-xl bg-gradient-to-br ${cat.color} border border-white/5 p-6 h-32 flex flex-col justify-end transition-all duration-300 ${cat.border} hover:-translate-y-1 hover:shadow-xl
                    `}>
                        <div className="absolute top-4 right-4 text-3xl opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all duration-300 transform group-hover:rotate-12">{cat.icon}</div>
                        <h3 className="text-lg font-bold text-white mb-1">{cat.name}</h3>
                        <p className="text-xs text-gray-400 uppercase tracking-widest">{cat.en}</p>
                    </div>
                </Link>
            ))}
         </div>
      </section>

      {/* Featured Videos Section */}
      <section className="container mx-auto px-4 py-20 pt-0">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
                    热门创作
                </h2>
                <p className="text-gray-400">
                    探索社区最受欢迎的 AI 视频作品
                </p>
            </div>
            <Link href="/explore">
                <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5 gap-2">
                    查看全部 <ArrowRight className="w-4 h-4" />
                </Button>
            </Link>
        </div>
        
        <ErrorBoundary>
            <VideoGrid filters={{ category: null, style: null, ratio: null, model: null }} sort="popular" />
        </ErrorBoundary>
      </section>
    </main>
  )
}
