"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { X, Megaphone, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

interface Announcement {
  id: string
  title: string
  content: string
  link?: string
  priority: number
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const now = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('announcements')
          .select('id, title, content, link, priority')
          .eq('is_active', true)
          .or(`start_time.is.null,start_time.lte.${now}`)
          .or(`end_time.is.null,end_time.gte.${now}`)
          .order('priority', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
            console.error("Error fetching announcement:", error)
        }
        
        if (data) {
          // Check if user dismissed this specific announcement
          const dismissedId = localStorage.getItem('dismissed_announcement')
          if (dismissedId !== data.id) {
            setAnnouncement(data)
          } else {
            setIsVisible(false)
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcements")
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncement()
  }, [])

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem('dismissed_announcement', announcement.id)
      setIsVisible(false)
    }
  }

  if (loading || !announcement || !isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="flex p-1 bg-white/20 rounded-lg shrink-0">
                  <Megaphone className="w-4 h-4 text-white" />
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm font-medium truncate">
                  <span className="font-bold bg-white/20 px-2 py-0.5 rounded text-xs uppercase tracking-wider shrink-0">
                    New
                  </span>
                  <span className="truncate">
                    {announcement.title} 
                    <span className="mx-2 opacity-70 hidden sm:inline">|</span> 
                    <span className="font-normal opacity-90">{announcement.content}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                {announcement.link && (
                  <Link 
                    href={announcement.link} 
                    className="hidden sm:flex items-center text-xs font-semibold bg-white text-purple-600 px-3 py-1.5 rounded-full hover:bg-white/90 transition-colors"
                  >
                    查看详情 <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                )}
                <button 
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="关闭公告"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Link Overlay */}
          {announcement.link && (
            <Link href={announcement.link} className="absolute inset-0 sm:hidden z-10" />
          )}
          {/* Close button z-index fix for mobile */}
          <button 
            onClick={handleDismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:hidden z-20 text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
