"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, MapPin, Link as LinkIcon, Edit } from "lucide-react"
import Link from "next/link"

interface ProfileStatsProps {
  user: any
  stats: {
    videoCount: number
    totalViews: number
    followersCount?: number
    followingCount?: number
  }
}

export function ProfileStats({ user, stats }: ProfileStatsProps) {
  // Mock data for display based on image reference
  const joinDate = user?.created_at ? new Date(user.created_at) : new Date()
  const daysJoined = Math.floor((new Date().getTime() - joinDate.getTime()) / (1000 * 3600 * 24))
  
  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-2 border-blue-500/50">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl bg-blue-600">
                  {user?.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-white">
                    {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
                  </h1>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    创作者
                  </Badge>
                </div>
                
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  已加入 {daysJoined} 天
                  <span className="mx-2">|</span>
                  和 AI Vision 一起，让创意更有价值
                </p>

                {user?.user_metadata?.bio && (
                   <p className="text-gray-500 text-sm max-w-lg truncate">
                    {user.user_metadata.bio}
                   </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
               <Link href="/settings" className="text-blue-400 text-sm hover:underline">
                  在线记录 {daysJoined}
               </Link>
            </div>
          </div>

          {/* Stats Row - Styled like the reference image "Balance" section */}
          <div className="mt-8 pt-8 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-8">
                <div className="flex gap-12">
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-white">{stats.videoCount}</p>
                        <p className="text-sm text-gray-400">发布作品 (个)</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-white">{stats.totalViews}</p>
                        <p className="text-sm text-gray-400">获得浏览 (次)</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-3xl font-bold text-white">0.0</p>
                        <p className="text-sm text-gray-400">创作收益 (元)</p>
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <Button variant="outline" className="border-white/10 hover:bg-white/10 text-white">
                        收益明细
                    </Button>
                    <Button className="bg-white text-black hover:bg-gray-200">
                        提现
                    </Button>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity/Earnings Section - "Activity Earnings" from reference */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">活动收益</h3>
                <Button variant="link" className="text-blue-400 p-0 h-auto">我的代金券</Button>
            </div>
            
            <div className="bg-white/5 rounded-lg p-6 flex justify-between items-center">
                <div className="space-y-4">
                    <p className="text-gray-400">邀新活动</p>
                    <div className="flex gap-12">
                        <div>
                            <p className="text-2xl font-bold text-white">0</p>
                            <p className="text-xs text-gray-500 mt-1">已邀请 (人)</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">0</p>
                            <p className="text-xs text-gray-500 mt-1">已获代金券 (张)</p>
                        </div>
                    </div>
                </div>
                <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">
                    活动详情
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
