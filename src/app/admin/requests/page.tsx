'use client'

import { useEffect, useState } from "react"
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
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      
      const res = await fetch(`/api/admin/requests?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Failed to fetch requests")
      setRequests(data.requests || [])
    } catch (error: any) {
      console.error("Error fetching requests:", error)
      toast.error(error.message || "加载悬赏列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这个悬赏任务吗？此操作不可恢复。")) return

    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

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
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'closed' })
      })
      const data = await res.json()
        
      if (!res.ok) throw new Error(data.error)
        
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
        <h1 className="text-2xl font-bold text-foreground">悬赏任务管理</h1>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded">
            总数: {requests.length}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索任务标题..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>
        <Button onClick={fetchRequests} variant="secondary">
          刷新
        </Button>
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">加载中...</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">暂无悬赏任务</div>
        ) : (
          <div className="divide-y divide-border">
            {requests.map((request) => (
              <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={request.profiles?.avatar_url} />
                    <AvatarFallback>?</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground truncate max-w-[300px]" title={request.title}>
                        {request.title}
                      </h3>
                      <Badge variant={request.status === 'open' ? 'default' : 'secondary'} className={request.status === 'open' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-muted text-muted-foreground'}>
                        {request.status === 'open' ? '进行中' : '已结束'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{request.profiles?.full_name || 'Unknown'}</span>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 text-yellow-500">
                        <Coins className="w-3 h-3" />
                        {request.budget}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/requests/${request.id}`} target="_blank">
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary text-muted-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  
                  {request.status === 'open' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleClose(request.id)}
                        className="hover:bg-yellow-500/10 hover:text-yellow-500 text-muted-foreground"
                        title="关闭任务"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(request.id)}
                    className="hover:bg-red-500/10 hover:text-red-500 text-muted-foreground"
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
