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
  profile?: any
  stats: {
    videoCount: number
    totalViews: number
    totalDownloads: number
    totalIncome: number
  }
}

export function ProfileStats({ user, profile, stats }: ProfileStatsProps) {
  const joinDate = user?.created_at ? new Date(user.created_at) : new Date()
  const daysJoined = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 3600 * 24))
  
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0]
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
  const bio = profile?.bio || user?.user_metadata?.bio
  
  const formatBalance = (balance: number) => {
    if (balance === undefined || balance === null) return '0.00';
    if (balance > 99999999 || balance.toString().includes('e')) return '99,999,999+';
    return balance.toFixed(2);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Profile Header Card */}
      <Card className="bg-card border-border overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <CardContent className="p-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-500 blur"></div>
                <Avatar className="h-24 w-24 border-2 border-background relative">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-3xl bg-secondary text-primary font-bold">
                    {user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground tracking-tight">
                    {displayName}
                  </h1>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 px-3 py-1">
                    {profile?.role === 'super_admin' ? '👑 超级管理员' : 
                     profile?.role === 'admin' ? '🛡️ 管理员' : '✨ 创作者'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full border border-border">
                    <CalendarDays className="h-3.5 w-3.5" />
                    已加入 {daysJoined} 天
                  </span>
                  {bio && (
                     <span className="truncate max-w-xs block">
                      {bio}
                     </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
               <Link href="/dashboard/settings">
                  <Button variant="outline" className="border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
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
             <StatItem label="创作收益" value={formatBalance(stats.totalIncome)} unit="元" highlight />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function StatItem({ label, value, unit, highlight = false }: { label: string, value: string | number, unit: string, highlight?: boolean }) {
    return (
        <div className="space-y-1 p-4 rounded-xl bg-secondary/30 border border-border hover:bg-secondary/50 transition-colors">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-1">
                <p className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
                    {value}
                </p>
                <span className="text-xs text-muted-foreground">{unit}</span>
            </div>
        </div>
    )
}
