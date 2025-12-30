"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Gift, Users, Coins } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { supabase } from "@/lib/supabase"

export default function InvitePage() {
  const { user } = useAuthStore()
  const [inviteLink, setInviteLink] = useState("")
  const [stats, setStats] = useState({
    invitedCount: 0,
    rechargeCount: 0,
    earnings: 0,
    pending: 0
  })

  useEffect(() => {
    if (user) {
      setInviteLink(`${window.location.origin}/auth?invite=${user.id}&tab=register`)
      fetchStats()
    } else {
      setInviteLink("请先登录获取邀请链接")
    }
  }, [user])

  const fetchStats = async () => {
    if (!user) return

    try {
      // Get invited users count
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('invited_by', user.id)

      if (error) throw error

      setStats(prev => ({
        ...prev,
        invitedCount: count || 0
      }))
    } catch (error) {
      console.error('Error fetching invite stats:', error)
    }
  }

  const handleCopy = () => {
    if (!user) {
      toast.error("请先登录")
      return
    }
    navigator.clipboard.writeText(inviteLink)
    toast.success("邀请链接已复制")
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                邀请好友 共享福利
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
                每邀请一位好友注册并完成首充，您将获得 <span className="text-yellow-400 font-bold">500积分</span> 奖励，好友将获得 <span className="text-yellow-400 font-bold">8折优惠券</span>。
            </p>
            
            <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center gap-2">
                <Input 
                    value={inviteLink} 
                    readOnly 
                    className="bg-transparent border-none text-gray-300 focus-visible:ring-0 h-12"
                />
                <Button onClick={handleCopy} className="h-12 px-8 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold">
                    <Copy className="mr-2 h-4 w-4" /> 复制链接
                </Button>
            </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 bg-black/20">
          <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center relative group hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                          <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">1. 发送邀请</h3>
                      <p className="text-gray-400">将您的专属链接分享给好友或发布到社交平台</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center relative group hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-6 text-pink-400 group-hover:scale-110 transition-transform">
                          <Gift className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">2. 好友注册</h3>
                      <p className="text-gray-400">好友通过链接注册并完成首次充值</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center relative group hover:-translate-y-2 transition-transform duration-300">
                      <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6 text-yellow-400 group-hover:scale-110 transition-transform">
                          <Coins className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">3. 获得奖励</h3>
                      <p className="text-gray-400">奖励自动到账，可用于购买任意素材</p>
                  </div>
              </div>
          </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20">
          <div className="container mx-auto px-4">
              <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
                  <h2 className="text-3xl font-bold mb-8">我的邀请记录</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                      <div>
                          <div className="text-4xl font-bold text-white mb-2">{stats.invitedCount}</div>
                          <div className="text-gray-400 text-sm">已邀请好友</div>
                      </div>
                      <div>
                          <div className="text-4xl font-bold text-white mb-2">{stats.rechargeCount}</div>
                          <div className="text-gray-400 text-sm">成功充值</div>
                      </div>
                      <div>
                          <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.earnings}</div>
                          <div className="text-gray-400 text-sm">累计获得积分</div>
                      </div>
                      <div>
                          <div className="text-4xl font-bold text-yellow-400 mb-2">{stats.pending}</div>
                          <div className="text-gray-400 text-sm">待领取奖励</div>
                      </div>
                  </div>
                  <Button variant="outline" className="border-white/20 hover:bg-white/10">查看详细记录</Button>
              </div>
          </div>
      </section>

      <Footer />
    </div>
  )
}
