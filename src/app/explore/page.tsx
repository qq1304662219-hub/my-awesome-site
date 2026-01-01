"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { SearchFilter } from "@/components/landing/SearchFilter"
import { SidebarFilters } from "@/components/landing/SidebarFilters"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function ExploreContent() {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const searchParams = useSearchParams()

  const filters = {
    category: searchParams.get("category"),
    style: searchParams.get("style"),
    ratio: searchParams.get("ratio"),
    model: searchParams.get("model"),
    resolution: searchParams.get("resolution"),
    duration: searchParams.get("duration"),
    query: searchParams.get("q")
  }

  const sort = searchParams.get("sort") || "newest"

  return (
    <>
      <div className="relative z-10 bg-[#020817] pb-20 pt-24">
          <div className="container mx-auto px-4 py-8">
            <div className="flex gap-8 items-start">
                
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-64 border-r border-white/10 pr-6 shrink-0 sticky top-24 h-fit">
                    <SidebarFilters />
                </div>
                
                {/* Mobile Filter Sheet */}
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetContent side="left" className="w-[300px] bg-[#020817] border-white/10 p-0 text-white">
                        <div className="h-full overflow-y-auto p-6">
                            <SidebarFilters />
                        </div>
                    </SheetContent>
                </Sheet>
                
                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    <SearchFilter onOpenFilters={() => setIsMobileOpen(true)} />
                    <VideoGrid filters={filters} sort={sort} />
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
