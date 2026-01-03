"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Loader2, MessageCircle, Clock, CheckCircle, XCircle, Plus, Search, AlertCircle, FileText } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

interface Ticket {
  id: string
  subject: string
  message: string
  category: string
  status: string
  reply: string
  created_at: string
  updated_at: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { user } = useAuthStore()
  
  // New Ticket State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "general",
    message: ""
  })

  useEffect(() => {
    if (!user) return
    fetchTickets()
  }, [user])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
      toast.error("获取工单失败")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast.error("请填写完整信息")
      return
    }

    try {
      setSubmitting(true)
      const { error } = await supabase
        .from('tickets')
        .insert({
          user_id: user!.id,
          subject: newTicket.subject,
          category: newTicket.category,
          message: newTicket.message,
          status: 'open'
        })

      if (error) throw error

      toast.success("工单提交成功")
      setIsDialogOpen(false)
      setNewTicket({ subject: "", category: "general", message: "" })
      fetchTickets()
    } catch (error) {
      console.error("Error creating ticket:", error)
      toast.error("提交失败，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20">待处理</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-blue-500/20">处理中</Badge>
      case 'closed':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 border-green-500/20">已结单</Badge>
      default:
        return <Badge variant="outline" className="text-muted-foreground border-border">{status}</Badge>
    }
  }

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ticket.message.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
                <MessageCircle className="text-primary h-8 w-8" />
                工单中心
              </h1>
              <p className="text-muted-foreground">遇到问题？提交工单，我们会尽快为您解决</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  <Plus className="w-4 h-4 mr-2" />
                  提交工单
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>提交新工单</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    请详细描述您遇到的问题，我们会尽快回复。
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-foreground">问题类型</Label>
                    <Select 
                      value={newTicket.category} 
                      onValueChange={(val) => setNewTicket({...newTicket, category: val})}
                    >
                      <SelectTrigger id="category" className="bg-muted/50 border-border text-foreground">
                        <SelectValue placeholder="选择问题类型" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="general">一般问题</SelectItem>
                        <SelectItem value="account">账号相关</SelectItem>
                        <SelectItem value="payment">支付问题</SelectItem>
                        <SelectItem value="technical">技术支持</SelectItem>
                        <SelectItem value="feature">功能建议</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-foreground">工单标题</Label>
                    <Input 
                      id="subject" 
                      placeholder="简要描述问题..." 
                      className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-foreground">详细描述</Label>
                    <Textarea 
                      id="message" 
                      placeholder="请详细描述您的问题，以便我们更快为您解决..." 
                      className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground min-h-[120px]"
                      value={newTicket.message}
                      onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted/50">取消</Button>
                  <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      "提交工单"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索工单..." 
                className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] bg-card border-border text-foreground">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="open">待处理</SelectItem>
                <SelectItem value="in_progress">处理中</SelectItem>
                <SelectItem value="closed">已结单</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTickets.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center py-20 bg-card/50 rounded-xl border border-dashed border-border backdrop-blur-sm"
                >
                  <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">暂无工单记录</h3>
                  <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    {searchQuery ? "未找到匹配的工单" : "您还没有提交过任何工单，有问题随时联系我们"}
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket, index) => (
                    <motion.div 
                      key={ticket.id} 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                              {ticket.subject}
                            </h3>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              ID: {ticket.id.slice(0, 8)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(ticket.created_at), "yyyy-MM-dd HH:mm")}
                            </span>
                            {ticket.category && (
                                <Badge variant="outline" className="text-muted-foreground border-border py-0 h-5">
                                    {ticket.category === 'general' && '一般问题'}
                                    {ticket.category === 'account' && '账号相关'}
                                    {ticket.category === 'payment' && '支付问题'}
                                    {ticket.category === 'technical' && '技术支持'}
                                    {ticket.category === 'feature' && '功能建议'}
                                    {!['general','account','payment','technical','feature'].includes(ticket.category) && ticket.category}
                                </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4 mb-4 text-foreground/80 text-sm whitespace-pre-wrap border border-border">
                        {ticket.message}
                      </div>

                      {ticket.reply && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="bg-primary/5 border border-primary/20 rounded-lg p-4 ml-4 md:ml-8 relative"
                        >
                          <div className="absolute left-0 top-6 -translate-x-full w-4 md:w-8 h-[1px] bg-primary/20" />
                          <div className="flex items-center gap-2 text-primary text-sm font-bold mb-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                              <MessageCircle className="w-3 h-3" />
                            </div>
                            客服回复
                          </div>
                          <div className="text-foreground/80 text-sm whitespace-pre-wrap pl-8 border-l-2 border-primary/20">
                            {ticket.reply}
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          )}
        </motion.div>
      </main>
    </div>
  )
}
