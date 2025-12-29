"use client"

import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { SearchFilter } from "@/components/landing/SearchFilter"
import { SidebarFilters } from "@/components/landing/SidebarFilters"
import { motion, AnimatePresence } from "framer-motion"

function ExploreContent() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <>
      <div className="relative z-10 bg-[#020817] pb-20 pt-24">
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
                    <SearchFilter onOpenFilters={() => setIsFiltersOpen(!isFiltersOpen)} />
                    <VideoGrid />
                </div>
            </div>
          </div>
      </div>
    </>
  )
}

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-[#020817] text-white selection:bg-blue-500/30">
      <Navbar />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <ExploreContent />
      </Suspense>
      <Footer />
    </main>
  )
}
