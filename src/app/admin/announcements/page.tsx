"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Plus, Search, MoreHorizontal, Pencil, Trash2, Megaphone, Calendar, Link as LinkIcon, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Announcement {
  id: string
  title: string
  content: string
  link?: string
  is_active: boolean
  start_time?: string
  end_time?: string
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    link: "",
    is_active: true,
    start_time: "",
    end_time: ""
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('title', `%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("加载公告列表失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [search])

  const handleOpenDialog = (item?: Announcement) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        content: item.content,
        link: item.link || "",
        is_active: item.is_active,
        start_time: item.start_time ? new Date(item.start_time).toISOString().slice(0, 16) : "",
        end_time: item.end_time ? new Date(item.end_time).toISOString().slice(0, 16) : ""
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: "",
        content: "",
        link: "",
        is_active: true,
        start_time: "",
        end_time: ""
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error("标题和内容不能为空")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        title: formData.title,
        content: formData.content,
        link: formData.link || null,
        is_active: formData.is_active,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : null,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : null,
      }

      if (editingItem) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingItem.id)
        if (error) throw error
        toast.success("公告更新成功")
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert(payload)
        if (error) throw error
        toast.success("公告创建成功")
      }

      setIsDialogOpen(false)
      fetchAnnouncements()
    } catch (error) {
      console.error("Error saving announcement:", error)
      toast.error("保存失败")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条公告吗？此操作不可恢复。")) return

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success("删除成功")
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (error) {
      toast.error("删除失败")
    }
  }

  const toggleStatus = async (item: Announcement) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !item.is_active })
        .eq('id', item.id)

      if (error) throw error
      setAnnouncements(announcements.map(a => 
        a.id === item.id ? { ...a, is_active: !a.is_active } : a
      ))
      toast.success(item.is_active ? "已停用" : "已启用")
    } catch (error) {
      toast.error("状态更新失败")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">公告管理</h1>
          <p className="text-muted-foreground">发布网站公告、活动通知和优惠信息</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" /> 新增公告
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-lg">
        <Search className="w-5 h-5 text-muted-foreground" />
        <Input 
          placeholder="搜索公告标题..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-foreground focus-visible:ring-0 placeholder:text-muted-foreground"
        />
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-xl">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="text-muted-foreground">状态</TableHead>
              <TableHead className="text-muted-foreground">标题 / 内容</TableHead>
              <TableHead className="text-muted-foreground">有效期</TableHead>
              <TableHead className="text-muted-foreground">创建时间</TableHead>
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
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  暂无公告
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((item) => (
                <TableRow key={item.id} className="border-border hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                        <Switch 
                            checked={item.is_active} 
                            onCheckedChange={() => toggleStatus(item)}
                        />
                        <span className={`text-xs ${item.is_active ? 'text-green-500' : 'text-muted-foreground'}`}>
                            {item.is_active ? '启用' : '停用'}
                        </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-foreground flex items-center gap-2">
                        {item.title}
                        {item.link && <LinkIcon className="w-3 h-3 text-blue-500" />}
                      </span>
                      <span className="text-sm text-muted-foreground line-clamp-1">{item.content}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground">
                        {item.start_time ? (
                            <span className="text-green-600/80">开始: {new Date(item.start_time).toLocaleDateString()}</span>
                        ) : (
                            <span>即时开始</span>
                        )}
                        {item.end_time ? (
                            <span className="text-red-600/80">结束: {new Date(item.end_time).toLocaleDateString()}</span>
                        ) : (
                            <span>永久有效</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent hover:text-accent-foreground text-muted-foreground">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground shadow-xl">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleOpenDialog(item)} className="cursor-pointer focus:bg-accent">
                            <Pencil className="w-4 h-4 mr-2" /> 编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border" />
                        <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive focus:bg-accent focus:text-destructive cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" /> 删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-background border-border text-foreground sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑公告' : '新增公告'}</DialogTitle>
            <DialogDescription>
              发布新的网站公告或活动通知。
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题</Label>
              <Input 
                id="title" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="例如：春节活动大促"
                className="bg-background border-input"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="content">内容详情</Label>
              <Textarea 
                id="content" 
                value={formData.content} 
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="请输入公告的具体内容..."
                className="bg-background border-input min-h-[100px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="link">跳转链接 (可选)</Label>
              <Input 
                id="link" 
                value={formData.link} 
                onChange={(e) => setFormData({...formData, link: e.target.value})}
                placeholder="https://..."
                className="bg-background border-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="start_time">开始时间 (可选)</Label>
                    <Input 
                        id="start_time" 
                        type="datetime-local"
                        value={formData.start_time} 
                        onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                        className="bg-background border-input"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="end_time">结束时间 (可选)</Label>
                    <Input 
                        id="end_time" 
                        type="datetime-local"
                        value={formData.end_time} 
                        onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                        className="bg-background border-input"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between border border-border p-3 rounded-md">
                <div className="space-y-0.5">
                    <Label className="text-base">立即启用</Label>
                    <div className="text-xs text-muted-foreground">
                        发布后是否立即显示在首页
                    </div>
                </div>
                <Switch 
                    checked={formData.is_active} 
                    onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-primary hover:bg-primary/90">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? '保存修改' : '立即发布'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
