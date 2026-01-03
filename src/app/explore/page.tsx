"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { VideoGrid } from "@/components/landing/VideoGrid"
import { MaterialHeader } from "@/components/explore/MaterialHeader"

function ExploreContent() {
  const searchParams = useSearchParams()

  const filters = {
    category: searchParams.get("category"),
    style: searchParams.get("style"),
    ratio: searchParams.get("ratio"),
    model: searchParams.get("model"),
    resolution: searchParams.get("resolution"),
    duration: searchParams.get("duration"),
    fps: searchParams.get("fps"),
    query: searchParams.get("q")
  }

  const sort = searchParams.get("sort") || "newest"

  return (
    <>
      {/* Sticky Header with Filters */}
      <MaterialHeader />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 min-h-[60vh]">
          <VideoGrid filters={filters} sort={sort} />
      </div>
    </>
  )
}

export default function ExplorePage() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navbar />
      <div className="pt-16"> {/* Offset for fixed Navbar */}
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ExploreContent />
        </Suspense>
      </div>
    </main>
  )
}
