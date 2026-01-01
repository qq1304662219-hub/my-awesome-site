'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Trash2, Search, ExternalLink, Coins, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Request {
  id: string
  title: string
  description: string
  budget: number
  status: 'open' | 'closed'
  user_id: string
  created_at: string
  profiles?: {
    full_name: string
    avatar_url: string
  }
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("requests")
        .select(`
          *,
          profiles:user_id(full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })

      if (search) {
        query = query.ilike("title", `%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error("Error fetching requests:", error)
      toast.error("加载悬赏列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个悬赏任务吗？此操作不可恢复。")) return

    try {
      const { error } = await supabase
        .from("requests")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("悬赏任务已删除")
      setRequests(requests.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error deleting request:", error)
      toast.error("删除失败")
    }
  }

  const handleClose = async (id: string) => {
    if (!confirm("确定要关闭这个悬赏任务吗？")) return

    try {
        const { error } = await supabase
            .from("requests")
            .update({ status: 'closed' })
            .eq("id", id)
        
        if (error) throw error
        
        toast.success("悬赏任务已关闭")
        setRequests(requests.map(r => r.id === id ? { ...r, status: 'closed' } : r))
    } catch (error) {
        console.error("Error closing request:", error)
        toast.error("关闭失败")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">悬赏任务管理</h1>
        <div className="flex gap-2 text-sm text-gray-400">
          <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">
            总数: {requests.length}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索任务标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            className="w-full bg-[#0B1120] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <Button onClick={fetchRequests} variant="secondary">
          刷新
        </Button>
      </div>

      {/* List */}
      <div className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">加载中...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无悬赏任务</div>
        ) : (
          <div className="divide-y divide-white/10">
            {requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={request.profiles?.avatar_url} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white truncate max-w-[300px]" title={request.title}>
                        {request.title}
                      </h3>
                      <Badge variant={request.status === 'open' ? 'default' : 'secondary'} className={request.status === 'open' ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-gray-700 text-gray-300'}>
                        {request.status === 'open' ? '进行中' : '已结束'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{request.profiles?.full_name || 'Unknown'}</span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Coins className="w-3 h-3" />
                        {request.budget}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/requests/${request.id}`} target="_blank">
                    <Button variant="ghost" size="icon" className="hover:bg-blue-500/10 hover:text-blue-400">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  
                  {request.status === 'open' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleClose(request.id)}
                        className="hover:bg-yellow-500/10 hover:text-yellow-400"
                        title="关闭任务"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(request.id)}
                    className="hover:bg-red-500/10 hover:text-red-400"
                    title="删除任务"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
