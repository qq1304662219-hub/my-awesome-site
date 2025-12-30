"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingFeatures } from "@/components/landing/LandingFeatures"
import { FunctionalSidebar } from "@/components/landing/FunctionalSidebar"
import { VideoGrid } from "@/components/landing/VideoGrid"

interface FilterState {
  category: string | null;
  style: string | null;
  ratio: string | null;
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showExplore, setShowExplore] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    style: null,
    ratio: null
  })

  // 监听来自 LandingHero 的“开始探索”点击事件
  useEffect(() => {
    const handleStartExplore = () => {
        setShowExplore(true)
        // 延时滚动，等待 DOM 渲染
        setTimeout(() => {
            document.getElementById('explore-content')?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    window.addEventListener('start-explore', handleStartExplore)
    return () => window.removeEventListener('start-explore', handleStartExplore)
  }, [])

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleFilterChange = (key: keyof FilterState, value: string | null) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30">
      <Navbar simple={true} />
      
      <LandingHero />

      {showExplore && (
        <div id="explore-content" className="flex border-t border-white/5 relative min-h-screen animate-in fade-in zoom-in duration-500">
            <FunctionalSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            className="hidden lg:block sticky top-0 h-screen"
            />
            <div className="flex-1 min-h-screen bg-[#020817]">
                <VideoGrid filters={filters} />
            </div>
        </div>
      )}
    </main>
  )
}
