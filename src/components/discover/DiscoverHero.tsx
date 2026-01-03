"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Play, ArrowRight, Star } from "lucide-react"
import Link from "next/link"

interface HeroVideo {
    id: string
    title: string
    thumbnail_url: string
    description: string
    author: {
        full_name: string
        avatar_url: string
    }
}

export function DiscoverHero() {
    const [videos, setVideos] = useState<HeroVideo[]>([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchTopVideos = async () => {
            const { data } = await supabase
                .from('videos')
                .select('id, title, thumbnail_url, description, profiles(full_name, avatar_url)')
                .eq('status', 'published')
                .order('views', { ascending: false })
                .limit(5)
            
            if (data) {
                setVideos(data.map(v => ({
                    id: v.id,
                    title: v.title,
                    thumbnail_url: v.thumbnail_url,
                    description: v.description,
                    author: v.profiles as any
                })))
            }
            setLoading(false)
        }
        fetchTopVideos()
    }, [])

    useEffect(() => {
        if (videos.length === 0) return
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % videos.length)
        }, 5000)
        return () => clearInterval(timer)
    }, [videos])

    if (loading || videos.length === 0) {
        return (
            <div className="w-full h-[400px] md:h-[500px] rounded-2xl mb-12 relative overflow-hidden bg-muted">
                <div className="absolute inset-0 animate-pulse bg-muted-foreground/10" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3 space-y-4">
                    <div className="h-4 w-24 bg-muted-foreground/20 rounded" />
                    <div className="h-10 w-3/4 bg-muted-foreground/20 rounded" />
                    <div className="h-6 w-full bg-muted-foreground/20 rounded" />
                    <div className="flex gap-4 pt-4">
                        <div className="h-12 w-32 bg-muted-foreground/20 rounded-full" />
                        <div className="h-12 w-40 bg-muted-foreground/20 rounded-full" />
                    </div>
                </div>
            </div>
        )
    }

    const currentVideo = videos[currentIndex]

    return (
        <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden mb-12 group bg-card border border-border">
  <AnimatePresence mode="wait">
    <motion.div
      key={currentVideo.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear transform scale-100 group-hover:scale-105"
        style={{ backgroundImage: `url(${currentVideo.thumbnail_url})` }}
      />
      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4 text-white">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-bold uppercase tracking-wider">本周精选</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight drop-shadow-md">
            {currentVideo.title}
          </h2>
          <p className="text-gray-200 text-lg mb-8 line-clamp-2 max-w-xl drop-shadow-sm">
            {currentVideo.description || "探索 AI 生成的无限可能，体验震撼视觉盛宴。"}
          </p>
          
          <div className="flex items-center gap-4">
            <Link href={`/video/${currentVideo.id}`}>
              <Button size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 px-8 h-12 text-base shadow-lg">
                <Play className="w-4 h-4 fill-current" /> 立即观看
              </Button>
            </Link>
            <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <img 
                src={currentVideo.author?.avatar_url || "/default-avatar.png"} 
                alt={currentVideo.author?.full_name}
                className="w-8 h-8 rounded-full border border-white/20"
              />
              <span className="text-white text-sm font-medium">
                {currentVideo.author?.full_name}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  </AnimatePresence>

  {/* Indicators */}
  <div className="absolute bottom-8 right-8 flex gap-2 z-10">
    {videos.map((_, idx) => (
      <button
        key={idx}
        onClick={() => setCurrentIndex(idx)}
        className={`w-2 h-2 rounded-full transition-all duration-300 ${
          idx === currentIndex ? "w-8 bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
        }`}
      />
    ))}
  </div>
</div>
    )
}
