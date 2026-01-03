"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Copy, 
  Users, 
  Coins, 
  Share2, 
  CheckCircle2, 
  Loader2,
  Gift
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface InvitedUser {
  id: string
  username: string
  full_name: string
  avatar_url: string
  created_at: string
  videos: { count: number }[]
}

export default function InviteDashboardPage() {
  const { user } = useAuthStore()
  const [inviteLink, setInviteLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([])
  const [stats, setStats] = useState({
    invitedCount: 0,
    totalEarned: 0,
    publishedCount: 0
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 1. Generate Invite Link
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user!.id)
        .single()
      
      if (profile?.username) {
        setInviteLink(`${window.location.origin}/auth?tab=register&ref=${profile.username}`)
      }

      // 2. Fetch Invited Users & Their Video Counts
      const { data: invitedData, error: invitedError } = await supabase
        .from('profiles')
        .select(`
          id, 
          username, 
          full_name, 
          avatar_url, 
          created_at,
          videos (count)
        `)
        .eq('invited_by', user!.id)
        .order('created_at', { ascending: false })

      if (invitedError) throw invitedError

      const formattedUsers = (invitedData || []).map((u: any) => ({
        ...u,
        videos: u.videos || []
      })) as InvitedUser[]
      
      setInvitedUsers(formattedUsers)

      // 3. Calculate Stats
      const invitedCount = formattedUsers.length
      const publishedCount = formattedUsers.filter(u => u.videos[0]?.count > 0).length
      
      // Fetch earnings from transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user!.id)
        .eq('type', 'income')
        .ilike('description', '%邀请%')

      const totalEarned = transactions?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0

      setStats({
        invitedCount,
        publishedCount,
        totalEarned
      })

    } catch (error) {
      console.error("Error fetching invite data:", error)
      toast.error("加载数据失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    toast.success("邀请链接已复制")
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">邀请有礼</h1>
          <p className="text-gray-400 mt-1">邀请好友加入，共同赚取 A币 奖励</p>
        </div>
      </div>

      {/* Hero / Invite Link Section */}
      <motion.div variants={item}>
        <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8 relative z-10">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white leading-relaxed">
                  每邀请一位好友注册，您将获得 <span className="text-yellow-400 text-3xl mx-1 font-extrabold">50</span> A币<br/>
                  <span className="text-lg font-normal text-gray-300">好友将获得 <span className="text-yellow-400 font-bold">20 A币</span> 新人礼包</span>
                </h2>
                <p className="text-gray-400 max-w-xl">
                  奖励自动到账，无上限，多邀多得。快去分享给您的朋友吧！
                </p>
                
                <div className="flex items-center gap-2 max-w-md mx-auto md:mx-0 mt-6 bg-black/30 p-1.5 rounded-xl border border-white/10 shadow-inner">
                  <Input 
                    value={inviteLink} 
                    readOnly 
                    className="bg-transparent border-none text-gray-300 focus-visible:ring-0 h-10 font-mono text-sm selection:bg-purple-500/30"
                  />
                  <Button onClick={handleCopy} className="bg-purple-600 hover:bg-purple-700 text-white shrink-0 font-medium px-6">
                    <Copy className="mr-2 h-4 w-4" /> 复制
                  </Button>
                </div>
              </div>
              
              <div className="hidden md:flex gap-6 pr-8">
                 <div className="flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30 backdrop-blur-sm shadow-lg shadow-blue-500/10">
                        <Share2 className="w-8 h-8 text-blue-400" />
                     </div>
                     <span className="text-xs text-blue-200 font-medium">1. 发送邀请</span>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30 backdrop-blur-sm shadow-lg shadow-purple-500/10">
                        <Users className="w-8 h-8 text-purple-400" />
                     </div>
                     <span className="text-xs text-purple-200 font-medium">2. 好友注册</span>
                 </div>
                 <div className="flex flex-col items-center gap-3">
                     <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 backdrop-blur-sm shadow-lg shadow-yellow-500/10">
                        <Gift className="w-8 h-8 text-yellow-400" />
                     </div>
                     <span className="text-xs text-yellow-200 font-medium">3. 获得奖励</span>
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#1e293b]/50 border-white/10 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              已邀请好友
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.invitedCount} <span className="text-sm font-normal text-gray-500">人</span></div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1e293b]/50 border-white/10 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              已发布作品好友
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.publishedCount} <span className="text-sm font-normal text-gray-500">人</span></div>
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b]/50 border-white/10 backdrop-blur-sm hover:bg-[#1e293b]/70 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Coins className="h-4 w-4 text-yellow-400" />
              累计获得奖励
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats.totalEarned.toFixed(0)} <span className="text-sm font-normal text-gray-500">A币</span></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Invitation List */}
      <motion.div variants={item}>
        <Card className="bg-[#1e293b]/50 border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">邀请记录</CardTitle>
            <CardDescription className="text-gray-400">
              查看您的邀请好友状态与奖励进度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-black/20 text-gray-200 uppercase font-medium border-b border-white/5">
                  <tr>
                    <th className="px-6 py-4">好友</th>
                    <th className="px-6 py-4">注册时间</th>
                    <th className="px-6 py-4">状态</th>
                    <th className="px-6 py-4 text-right">奖励</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {invitedUsers.length > 0 ? (
                    invitedUsers.map((invited) => {
                        const hasPublished = invited.videos && invited.videos[0]?.count > 0
                        return (
                            <tr key={invited.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-white/10">
                                    <AvatarImage src={invited.avatar_url} />
                                    <AvatarFallback>{invited.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{invited.full_name || invited.username || 'Unknown'}</span>
                                        <span className="text-xs text-gray-500">@{invited.username}</span>
                                    </div>
                                </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-xs">
                                {new Date(invited.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                {hasPublished ? (
                                    <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/20">
                                        已发布作品
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-400 border-gray-600">
                                        已注册
                                    </Badge>
                                )}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-yellow-400">
                                {hasPublished ? '+50' : '+20'}
                                </td>
                            </tr>
                        )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Users className="h-6 w-6" />
                          </div>
                          <p>暂无邀请记录</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
