'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

const SCENARIOS = [
  "Live",
  "Commerce", 
  "Game", 
  "Wallpaper", 
  "Other"
]

export default function FixDataPage() {
  const [loading, setLoading] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])

  const addLog = (msg: string) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`])

  const handleFix = async () => {
    try {
      setLoading(true)
      setLog([])
      addLog("开始修复数据...")

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("请先登录")
        return
      }

      // 1. Fetch all videos
      const { data: videos, error } = await supabase
        .from('videos')
        .select('*')
      
      if (error) throw error
      
      addLog(`找到 ${videos.length} 个视频`)

      let updatedCount = 0
      
      for (const video of videos) {
        const updates: any = {}
        let needsUpdate = false

        // Fix 1: Set Status to Published
        if (video.status !== 'published') {
          updates.status = 'published'
          needsUpdate = true
        }

        // Fix 2: Assign Ownerless Videos
        if (!video.user_id) {
          updates.user_id = user.id
          needsUpdate = true
        }

        // Fix 3: Random Category if missing
        if (!video.category) {
          updates.category = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)]
          needsUpdate = true
        }

        // Fix 4: Ensure price is a number
        if (video.price === null || video.price === undefined) {
             updates.price = 0
             needsUpdate = true
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('videos')
            .update(updates)
            .eq('id', video.id)
          
          if (updateError) {
            addLog(`更新视频 ${video.id} 失败: ${updateError.message}`)
          } else {
            updatedCount++
          }
        }
      }

      addLog(`修复完成! 共更新了 ${updatedCount} 个视频`)
      toast.success(`修复完成! 共更新了 ${updatedCount} 个视频`)

    } catch (e: any) {
      console.error(e)
      toast.error("修复失败: " + e.message)
      addLog("Error: " + e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteAdmin = async () => {
    try {
        if (!user) {
            toast.error("请先登录")
            return
        }
        setLoading(true)
        addLog("正在将当前用户提升为管理员...")
        
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id)

        if (error) throw error

        addLog("成功！您现在是管理员了。请刷新页面生效。")
        toast.success("提升成功！请刷新页面。")
    } catch (e: any) {
        console.error(e)
        toast.error("提升失败: " + e.message)
        addLog("Error: " + e.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
            <h1 className="text-2xl font-bold mb-2">数据修复工具</h1>
            <p className="text-gray-400">
                此工具将执行以下操作：
                <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>将所有视频状态设为 "已发布" (published)</li>
                    <li>将所有无主视频 (user_id 为空) 归属给当前登录用户</li>
                    <li>为没有分类的视频随机分配分类</li>
                    <li>修正价格为空的数据</li>
                </ul>
            </p>
        </div>

        <div className="bg-white/5 p-6 rounded-xl border border-white/10 space-y-4">
            <div className="mb-4 text-sm">
                当前状态: {user ? (
                    <span className="text-green-400">已登录 ({user.email})</span>
                ) : (
                    <span className="text-red-400">未登录 (请先点击下方登录按钮)</span>
                )}
            </div>

            {!user && (
                <Link href="/auth">
                    <Button className="w-full mb-4 bg-white text-black hover:bg-gray-200">
                        前往登录页面
                    </Button>
                </Link>
            )}

            <Button 
                onClick={handleFix} 
                disabled={loading || !user}
                className="w-full bg-blue-600 hover:bg-blue-700"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        正在修复...
                    </>
                ) : (
                    "开始修复数据"
                )}
            </Button>

            <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">管理员权限丢失？</p>
                <Button 
                    onClick={handlePromoteAdmin} 
                    disabled={loading || !user}
                    variant="outline"
                    className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
                >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "👑 一键设置为管理员"}
                </Button>
            </div>
        </div>

        {log.length > 0 && (
            <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-gray-300 max-h-96 overflow-y-auto space-y-1 border border-white/10">
                {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        )}
      </div>
    </div>
  )
}