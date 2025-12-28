"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingFeatures } from "@/components/landing/LandingFeatures"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { SearchFilter } from "@/components/landing/SearchFilter"

import { SidebarFilters } from "@/components/landing/SidebarFilters"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020817] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30">
      <Navbar />
      
      <LandingHero />
      
      {user && (
         <div className="container mx-auto px-4 py-8 border-b border-white/10">
            <DashboardView />
         </div>
      )}

      <div className="relative z-10 bg-[#020817] pb-20">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <SidebarFilters />
                
                {/* Main Content */}
                <div className="flex-1">
                    <SearchFilter />
                    <VideoGrid />
                </div>
            </div>
          </div>
      </div>
      
      <LandingFeatures />
      <Footer />
    </main>
  )
}
