"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, ShieldAlert, Terminal, Clock, Filter, Download } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock data generator for demonstration if DB table doesn't exist
const generateMockLogs = () => {
  const actions = ['delete_video', 'ban_user', 'approve_creator', 'reject_withdrawal', 'update_settings', 'login']
  const targets = ['Video-123', 'User-888', 'Creator-007', 'Payment-999', 'System', 'Admin-Panel']
  const admins = ['admin@example.com', 'super@example.com', 'manager@example.com']
  
  return Array.from({ length: 20 }).map((_, i) => ({
    id: `log-${i}`,
    action: actions[Math.floor(Math.random() * actions.length)],
    admin_email: admins[Math.floor(Math.random() * admins.length)],
    target: targets[Math.floor(Math.random() * targets.length)],
    ip_address: `192.168.1.${Math.floor(Math.random() * 255)}`,
    details: 'Operation performed successfully via admin dashboard',
    created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString()
  })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("all")

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      // Try to fetch from real table
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        // Fallback to mock data if table doesn't exist
        console.warn("Audit logs table not found, using mock data")
        setLogs(generateMockLogs())
      } else {
        setLogs(data || [])
      }
    } catch (error) {
      console.error("Error fetching logs:", error)
      setLogs(generateMockLogs())
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    if (action.includes('delete') || action.includes('ban') || action.includes('reject')) {
      return <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20">{action}</Badge>
    }
    if (action.includes('approve') || action.includes('create')) {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">{action}</Badge>
    }
    if (action.includes('login')) {
      return <Badge variant="secondary">{action}</Badge>
    }
    return <Badge variant="outline">{action}</Badge>
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.admin_email.toLowerCase().includes(search.toLowerCase()) || 
      log.target.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase())
    
    const matchesFilter = actionFilter === "all" || log.action === actionFilter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">系统日志</h1>
          <p className="text-muted-foreground">监控管理员操作记录与系统安全审计</p>
        </div>
        <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> 导出日志
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
            placeholder="搜索操作人、目标或详情..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-transparent border-none text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
            />
        </div>
        <div className="flex gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="筛选操作类型" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">所有操作</SelectItem>
                    <SelectItem value="login">系统登录</SelectItem>
                    <SelectItem value="delete_video">删除视频</SelectItem>
                    <SelectItem value="ban_user">封禁用户</SelectItem>
                    <SelectItem value="update_settings">更新设置</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground w-[180px]">操作时间</TableHead>
              <TableHead className="text-muted-foreground">操作人 (Admin)</TableHead>
              <TableHead className="text-muted-foreground">动作 (Action)</TableHead>
              <TableHead className="text-muted-foreground">目标 (Target)</TableHead>
              <TableHead className="text-muted-foreground">IP 地址</TableHead>
              <TableHead className="text-muted-foreground">详情</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  暂无日志记录
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="border-border hover:bg-muted/50">
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-bold">
                            {log.admin_email[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{log.admin_email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {log.target}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.ip_address}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={log.details}>
                    {log.details}
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
