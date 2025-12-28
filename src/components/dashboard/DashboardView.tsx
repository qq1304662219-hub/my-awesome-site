"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { DragDropUpload } from "./DragDropUpload"
import { MasonryGrid } from "./MasonryGrid"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Compass } from "lucide-react"

export function DashboardView() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchVideos = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      
      setVideos(data || [])
    } catch (error) {
      console.error("Error fetching videos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">我的素材库</h1>
                <p className="text-gray-400">管理您的所有 AI 生成内容</p>
            </div>
            {/* Upload Area */}
            <div className="w-full md:w-auto min-w-[300px]">
                <DragDropUpload onUploadComplete={fetchVideos} />
            </div>
        </div>

        {/* Gallery */}
        {loading ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {[1,2,3,4,5,6].map(i => (
                    <Skeleton key={i} className="w-full h-64 rounded-xl bg-white/5" />
                ))}
            </div>
        ) : videos.length > 0 ? (
            <MasonryGrid videos={videos} onVideoDeleted={fetchVideos} />
        ) : (
            <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10 border-dashed">
                <p className="text-gray-400 mb-4">您的素材库空空如也</p>
                <div className="flex justify-center gap-4">
                    <Button 
                        variant="outline" 
                        onClick={() => document.getElementById('videos')?.scrollIntoView({ behavior: 'smooth' })}
                        className="gap-2 border-white/20 hover:bg-white/10"
                    >
                        <Compass className="w-4 h-4" /> 探索社区灵感
                    </Button>
                </div>
            </div>
        )}
      </motion.div>
    </div>
  )
}
