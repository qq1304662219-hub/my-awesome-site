"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export function LandingHero() {
  const handleLearnMore = () => {
    // 触发自定义事件通知父组件显示探索区
    window.dispatchEvent(new Event('start-explore'))
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 bg-[#020817]">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Deep Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-blue-900/20 blur-[120px] rounded-full opacity-60" />
        
        {/* Flowing Lines SVG */}
        <svg className="absolute w-full h-full opacity-40 scale-125" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M-200 600 C 200 400, 600 800, 1600 200" stroke="url(#grad1)" strokeWidth="2" className="animate-pulse" />
            <path d="M-200 750 C 300 550, 700 950, 1600 350" stroke="url(#grad1)" strokeWidth="2" strokeDasharray="20 20" />
            <path d="M-200 450 C 100 250, 500 650, 1600 50" stroke="url(#grad2)" strokeWidth="1.5" />
            <path d="M-200 900 C 400 700, 800 1000, 1600 500" stroke="url(#grad2)" strokeWidth="2" opacity="0.5" />
            <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#3b82f6" stopOpacity="0"/>
                    <stop offset="0.5" stopColor="#8b5cf6" />
                    <stop offset="1" stopColor="#ec4899" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="1440" y2="900" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#6366f1" stopOpacity="0"/>
                    <stop offset="0.5" stopColor="#d946ef" />
                    <stop offset="1" stopColor="#8b5cf6" stopOpacity="0"/>
                </linearGradient>
            </defs>
        </svg>

        {/* Particles */}
        <div className="absolute inset-0">
            {[...Array(15)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute bg-white rounded-full blur-[1px]"
                initial={{ 
                    x: Math.random() * 100 + "%", 
                    y: Math.random() * 100 + "%", 
                    opacity: Math.random() * 0.3 + 0.1, 
                    scale: Math.random() * 0.5 + 0.5 
                }}
                animate={{ 
                    y: [null, Math.random() * -50 - 50],
                    opacity: [null, 0]
                }}
                transition={{ 
                    duration: Math.random() * 10 + 15, 
                    repeat: Infinity, 
                    ease: "linear" 
                }}
                style={{
                    width: Math.random() * 3 + 1 + "px",
                    height: Math.random() * 3 + 1 + "px",
                    left: Math.random() * 100 + "%",
                    top: Math.random() * 100 + "%",
                }}
            />
            ))}
        </div>
      </div>

      <div className="container relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-4 backdrop-blur-sm shadow-lg shadow-purple-500/10">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">AI 驱动的下一代视觉创意平台</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white drop-shadow-2xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80 filter drop-shadow-lg">AI 驱动的</span>
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 filter drop-shadow-[0_0_25px_rgba(168,85,247,0.4)] animate-gradient-x bg-[length:200%_auto]">
              视觉灵感库
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            探索、创作、分享。数百万 AI 生成的视频与图像素材，
            为你的创意项目提供无限可能。
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8"
          >
            <Button 
                size="lg" 
                className="h-12 px-8 text-base rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-900/20"
                onClick={handleLearnMore}
            >
              开始探索
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
