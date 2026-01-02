"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Wallet, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface ProfileStatsProps {
  user: any
  stats: {
    videoCount: number
    totalViews: number
    totalDownloads: number
    totalIncome: number
  }
}

export function ProfileStats({ user, stats }: ProfileStatsProps) {
  const joinDate = user?.created_at ? new Date(user.created_at) : new Date()
  const daysJoined = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 3600 * 24))
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Profile Header Card */}
      <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-white/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 blur"></div>
                <Avatar className="h-24 w-24 border-2 border-[#0B1120] relative">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="text-3xl bg-[#1e293b] text-blue-400 font-bold">
                    {user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white tracking-tight">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </h1>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1">
                    {user?.role === 'super_admin' ? '👑 超级管理员' : 
                     user?.role === 'admin' ? '🛡️ 管理员' : '✨ 创作者'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    已加入 {daysJoined} 天
                  </span>
                  {user?.user_metadata?.bio && (
                     <span className="truncate max-w-xs block">
                      {user.user_metadata.bio}
                     </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
               <Link href="/dashboard/settings">
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                      编辑资料
                  </Button>
               </Link>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
             <StatItem label="发布作品" value={stats.videoCount} unit="个" />
             <StatItem label="获得浏览" value={stats.totalViews} unit="次" />
             <StatItem label="总下载量" value={stats.totalDownloads} unit="次" />
             <StatItem label="创作收益" value={stats.totalIncome.toFixed(2)} unit="元" highlight />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatItem({ label, value, unit, highlight = false }: { label: string, value: string | number, unit: string, highlight?: boolean }) {
    return (
        <div className="space-y-1 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <p className="text-sm text-gray-400">{label}</p>
            <div className="flex items-baseline gap-1">
                <p className={`text-2xl font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>
                    {value}
                </p>
                <span className="text-xs text-gray-500">{unit}</span>
            </div>
        </div>
    )
}
