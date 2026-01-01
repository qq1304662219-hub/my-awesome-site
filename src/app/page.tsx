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

      {/* Featured Videos Section */}
      <section className="container mx-auto px-4 py-20">
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
            <VideoGrid filters={{ category: null, style: null, ratio: null, model: null }} />
        </ErrorBoundary>
      </section>
    </main>
  )
}
