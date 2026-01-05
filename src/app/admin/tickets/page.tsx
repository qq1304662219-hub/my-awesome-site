"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, MessageSquare, CheckCircle, XCircle, Clock, Send } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [replyText, setReplyText] = useState("")
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          user:profiles(full_name, email, avatar_url)
        `)
        .order('created_at', { ascending: false })

      if (search) {
        query = query.or(`subject.ilike.%${search}%,message.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("加载工单列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async () => {
    if (!selectedTicket || !replyText.trim()) return

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          reply: replyText,
          status: 'resolved',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id)

      if (error) throw error

      // Send notification to user
      await supabase.from('notifications').insert({
        user_id: selectedTicket.user_id,
        type: 'system',
        content: `您的工单 "${selectedTicket.subject}" 已有回复：${replyText}`,
        is_read: false
      })

      toast.success("回复已发送")
      setDialogOpen(false)
      setReplyText("")
      fetchTickets()
    } catch (error) {
      console.error("Error replying to ticket:", error)
      toast.error("回复失败")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> 待处理</Badge>
      case 'resolved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> 已解决</Badge>
      case 'closed':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/20"><XCircle className="w-3 h-3 mr-1" /> 已关闭</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">工单管理</h1>
          <p className="text-muted-foreground">处理用户提交的反馈与问题</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="搜索工单 (标题/内容)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
          className="bg-transparent border-none text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
        />
        <Button onClick={fetchTickets}>搜索</Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">状态</TableHead>
              <TableHead className="text-muted-foreground">标题</TableHead>
              <TableHead className="text-muted-foreground">提交用户</TableHead>
              <TableHead className="text-muted-foreground">提交时间</TableHead>
              <TableHead className="text-muted-foreground text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  暂无工单
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="border-border hover:bg-muted/50">
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{ticket.subject}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{ticket.message}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span className="text-sm text-foreground">{ticket.user?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-muted-foreground">{ticket.user?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {format(new Date(ticket.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={dialogOpen && selectedTicket?.id === ticket.id} onOpenChange={(open) => {
                        setDialogOpen(open)
                        if (open) setSelectedTicket(ticket)
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="hover:bg-primary/10 hover:text-primary">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          回复
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>回复工单</DialogTitle>
                          <DialogDescription>
                            回复将通过站内信通知用户
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2 p-4 bg-muted rounded-lg">
                                <div className="font-semibold text-sm text-foreground">问题描述:</div>
                                <p className="text-sm text-muted-foreground">{ticket.message}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">回复内容</label>
                                <Textarea 
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="请输入您的回复..."
                                    className="h-32 bg-background border-input"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                          <Button variant="ghost" onClick={() => setDialogOpen(false)}>取消</Button>
                          <Button onClick={handleReply} className="bg-primary text-primary-foreground">
                            <Send className="w-4 h-4 mr-2" /> 发送回复
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
