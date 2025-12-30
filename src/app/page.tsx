"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { LandingHero } from "@/components/landing/LandingHero"
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
  const [filters, setFilters] = useState<FilterState>({
    category: null,
    style: null,
    ratio: null
  })

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

      <div id="explore-content" className="flex border-t border-white/5 relative">
        <FunctionalSidebar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          className="hidden lg:block sticky top-0 h-screen"
        />
        <div className="flex-1 min-h-screen bg-[#020817]">
            <VideoGrid filters={filters} />
        </div>
      </div>
    </main>
  )
}
