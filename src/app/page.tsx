"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { LandingHero } from "@/components/landing/LandingHero"
import { DashboardView } from "@/components/dashboard/DashboardView"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { SearchFilter } from "@/components/landing/SearchFilter"
import { SidebarFilters } from "@/components/landing/SidebarFilters"
import { motion, AnimatePresence } from "framer-motion"

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

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

      <div className="relative z-10 bg-[#020817] pb-20" id="explore-content">
        {user ? (
            <div className="container mx-auto px-4 py-8 border-b border-white/10">
                <DashboardView />
            </div>
        ) : (
            <>
                <SearchFilter onOpenFilters={() => setIsFiltersOpen(!isFiltersOpen)} />
                <div className="container mx-auto px-4 py-8">
                    <div className="flex gap-8 items-start">
                        {/* Sidebar with Animation */}
                        <AnimatePresence initial={false}>
                        {isFiltersOpen && (
                            <motion.div
                            initial={{ width: 0, opacity: 0, x: -20 }}
                            animate={{ width: "auto", opacity: 1, x: 0 }}
                            exit={{ width: 0, opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden sticky top-24 h-fit shrink-0"
                            >
                            <div className="w-64 border-r border-white/10 pr-6">
                                <SidebarFilters />
                            </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                        
                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <VideoGrid />
                        </div>
                    </div>
                </div>
            </>
        )}
      </div>
      <Footer />
    </main>
  )
}
