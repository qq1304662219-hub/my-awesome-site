"use client"

import { useState, useEffect, Suspense } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { SearchFilter } from "@/components/landing/SearchFilter"
import { SidebarFilters } from "@/components/landing/SidebarFilters"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

function ExploreContent() {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  return (
    <>
      <div className="relative z-10 bg-[#020817] pb-20 pt-24">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col gap-8">
                
                {/* Main Content */}
                <div className="flex-1">
                    <SearchFilter onOpenFilters={() => setIsFiltersOpen(true)} />
                    <VideoGrid />
                </div>
            </div>
          </div>
      </div>
      
      <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <SheetContent side="left" className="bg-[#020817] border-r border-white/10 text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">筛选选项</SheetTitle>
          </SheetHeader>
          <div className="py-6">
             <SidebarFilters />
          </div>
        </SheetContent>
      </Sheet>
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
