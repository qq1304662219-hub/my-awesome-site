"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { LandingHero } from "@/components/landing/LandingHero"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { FeaturedCreators } from "@/components/landing/FeaturedCreators"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Zap, Mountain, Building2, Rocket, Briefcase, Sparkles } from "lucide-react"
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Navbar />
      
      <LandingHero />

      {/* Popular Tags Section (New) */}
      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-20">
        {/* Tags content would be here, assuming handled by LandingHero or separate component but structure implies it's here */}
      </section>

      {/* Curated Categories Section */}
      <section className="container mx-auto px-4 py-20">
         <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold flex items-center gap-2">
                <Zap className="w-8 h-8 text-yellow-500" />
                灵感分类
            </h2>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
                { name: "自然风光", en: "Nature", icon: Mountain, color: "text-emerald-500" },
                { name: "城市建筑", en: "Architecture", icon: Building2, color: "text-blue-500" },
                { name: "科技未来", en: "Technology", icon: Rocket, color: "text-purple-500" },
                { name: "商务生活", en: "Business", icon: Briefcase, color: "text-amber-500" },
            ].map((cat) => (
                <Link key={cat.en} href={`/explore?category=${cat.en}`}>
                    <div className="group relative overflow-hidden rounded-xl bg-card border border-border p-6 h-32 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
                        <div className={`absolute top-4 right-4 p-2 rounded-lg bg-secondary/50 group-hover:bg-secondary transition-colors ${cat.color}`}>
                            <cat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">{cat.name}</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mt-1">{cat.en}</p>
                        </div>
                    </div>
                </Link>
            ))}
         </div>
      </section>

      {/* Featured Videos Section */}
      <section className="w-full py-20">
        <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                        内容精选
                    </h2>
                    <p className="text-muted-foreground">
                        官方甄选优质 AI 视频作品，激发你的创作灵感
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
        </div>
      </section>

      {/* Featured Creators Section */}
      <section className="py-20">
          <FeaturedCreators />
      </section>

    </main>
  )
}
