'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { deleteVideoWithStorage } from '@/lib/storage-utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Edit, Trash2, Plus, Filter, MoreHorizontal, Eye, Download, Copy, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Video } from '@/types/video'

const SCENARIOS = [
  { value: "Live", label: "直播背景" },
  { value: "Commerce", label: "电商短视频" },
  { value: "Game", label: "游戏/CG" },
  { value: "Wallpaper", label: "动态壁纸" },
  { value: "Other", label: "其他" }
]

const AI_MODELS = [
  { value: "Sora", label: "Sora" },
  { value: "Runway Gen-2", label: "Runway Gen-2" },
  { value: "Pika Labs", label: "Pika Labs" },
  { value: "Stable Video Diffusion", label: "Stable Video Diffusion" },
  { value: "Midjourney", label: "Midjourney" },
  { value: "DALL-E 3", label: "DALL-E 3" },
  { value: "Other", label: "其他" }
]

export default function MyVideos() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingVideo, setEditingVideo] = useState<Video | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('0')
  const [editDescription, setEditDescription] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editAiModel, setEditAiModel] = useState('')
  const [editPrompt, setEditPrompt] = useState('')

  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setVideos(data as Video[])
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await deleteVideoWithStorage(supabase, deleteId)
      toast.success('作品已删除')
      setVideos(videos.filter(v => v.id !== deleteId))
    } catch (error: any) {
      toast.error('删除失败: ' + error.message)
    }
    setDeleteId(null)
  }

  const openEdit = (video: Video) => {
    setEditingVideo(video)
    setEditTitle(video.title)
    setEditPrice(video.price?.toString() || '0')
    setEditDescription(video.description || '')
    setEditTags(video.tags?.join(', ') || '')
    setEditCategory(video.category || 'Other')
    setEditAiModel(video.ai_model || 'Other')
    setEditPrompt(video.prompt || '')
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingVideo) return

    const tagsArray = editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean)

    const { error } = await supabase
      .from('videos')
      .update({ 
        title: editTitle,
        price: parseFloat(editPrice),
        description: editDescription,
        tags: tagsArray,
        category: editCategory,
        ai_model: editAiModel,
        prompt: editPrompt
      })
      .eq('id', editingVideo.id)

    if (error) {
      toast.error('更新失败: ' + error.message)
    } else {
      toast.success('作品已更新')
      setVideos(videos.map(v => v.id === editingVideo.id ? { 
        ...v, 
        title: editTitle, 
        price: parseFloat(editPrice),
        description: editDescription,
        tags: tagsArray,
        category: editCategory,
        ai_model: editAiModel,
        prompt: editPrompt
      } : v))
      setIsEditOpen(false)
    }
  }

  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && v.status === 'published') ||
      (statusFilter === 'pending' && v.status === 'pending') ||
      (statusFilter === 'rejected' && v.status === 'rejected')
    return matchesSearch && matchesStatus
  })

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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  if (loading) return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24">
        <div className="flex justify-between items-center">
             <div className="space-y-2">
                 <Skeleton className="h-8 w-48" />
                 <Skeleton className="h-4 w-96" />
             </div>
             <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
        </div>
    </div>
  )

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">作品管理</h1>
            <p className="text-muted-foreground">管理您发布的 AI 视频作品，查看状态和收益。</p>
        </div>
        <Link href="/dashboard/upload">
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              发布新作品
            </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索作品标题..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background border-input text-foreground focus:border-primary/50 transition-colors" 
                />
             </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-border text-foreground hover:bg-muted gap-2">
                        <Filter className="h-4 w-4" />
                        {statusFilter === 'all' ? '全部状态' : 
                         statusFilter === 'published' ? '已发布' : 
                         statusFilter === 'pending' ? '审核中' : '已拒绝'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-popover border-border text-popover-foreground">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')} className="hover:bg-muted cursor-pointer">全部状态</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('published')} className="hover:bg-muted cursor-pointer">已发布</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="hover:bg-muted cursor-pointer">审核中</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="hover:bg-muted cursor-pointer">已拒绝</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
        <div className="text-sm text-muted-foreground">
            共 <span className="text-foreground font-medium">{filteredVideos.length}</span> 个作品
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/50 text-foreground uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">封面 / 标题</th>
                        <th className="px-6 py-4">状态</th>
                        <th className="px-6 py-4">价格</th>
                        <th className="px-6 py-4">数据表现</th>
                        <th className="px-6 py-4">发布时间</th>
                        <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    <AnimatePresence>
                    {filteredVideos.length > 0 ? (
                        filteredVideos.map((video) => (
                            <motion.tr 
                                key={video.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="hover:bg-muted/50 transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-28 bg-muted rounded-lg overflow-hidden flex-shrink-0 relative border border-border group-hover:border-primary/30 transition-colors">
                                            {video.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video src={video.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={video.url || '/placeholder.png'} alt={video.title} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="max-w-xs">
                                            <div className="font-medium text-foreground truncate text-base mb-1" title={video.title}>{video.title}</div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-muted text-muted-foreground border-border">
                                                    {video.category || '其他'}
                                                </Badge>
                                                <div 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(video.id.toString());
                                                        toast.success('ID 已复制');
                                                    }}
                                                    className="text-xs text-muted-foreground hover:text-primary cursor-pointer flex items-center gap-1 transition-colors"
                                                    title="点击复制视频 ID"
                                                >
                                                    <Copy className="h-3 w-3" />
                                                    ID: {video.id.toString().slice(0, 6)}...
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {video.status === 'published' ? (
                                        <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:bg-green-500/20 gap-1">
                                            <CheckCircle className="h-3 w-3" /> 已发布
                                        </Badge>
                                    ) : video.status === 'rejected' ? (
                                        <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20 gap-1">
                                            <XCircle className="h-3 w-3" /> 已拒绝
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20 gap-1">
                                            <AlertCircle className="h-3 w-3" /> 审核中
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-foreground font-medium">
                                    {(video.price || 0) > 0 ? `¥${video.price}` : <span className="text-green-500">免费</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground" title="浏览量">
                                            <Eye className="h-4 w-4" /> {video.views || 0}
                                        </div>
                                        <div className="flex items-center gap-1 text-muted-foreground" title="下载量">
                                            <Download className="h-4 w-4" /> {video.downloads || 0}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {video.created_at ? new Date(video.created_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                                            <DropdownMenuItem onClick={() => openEdit(video)} className="hover:bg-muted cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" /> 编辑信息
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-border" />
                                            <DropdownMenuItem onClick={() => setDeleteId(video.id.toString())} className="text-destructive hover:bg-destructive/10 cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" /> 删除作品
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6}>
                                <EmptyState 
                                    title="未找到相关作品" 
                                    description="尝试调整搜索关键词或筛选条件，或者发布一个新的作品。"
                                    icon={Filter}
                                />
                            </td>
                        </tr>
                    )}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-background border-border text-foreground sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>编辑作品信息</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title" className="text-foreground">标题</Label>
                    <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-background border-input text-foreground focus:border-primary/50"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="desc" className="text-foreground">描述</Label>
                    <Textarea
                        id="desc"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="bg-background border-input text-foreground min-h-[100px] focus:border-primary/50"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="price" className="text-foreground">价格 (元)</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="bg-background border-input text-foreground focus:border-primary/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category" className="text-foreground">分类</Label>
                        <select
                            id="category"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {SCENARIOS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="tags" className="text-foreground">标签 (逗号分隔)</Label>
                    <Input
                        id="tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="例如: 风景, 4K, 自然"
                        className="bg-background border-input text-foreground focus:border-primary/50"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ai_model" className="text-foreground">AI 模型</Label>
                    <select
                        id="ai_model"
                        value={editAiModel}
                        onChange={(e) => setEditAiModel(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {AI_MODELS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="prompt" className="text-foreground">Prompt (提示词)</Label>
                    <Textarea
                        id="prompt"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="bg-background border-input text-foreground min-h-[80px] focus:border-primary/50"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>取消</Button>
                <Button onClick={handleUpdate}>保存修改</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog - Simplified as a system alert for now or can use Sonner with action */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-background border-border sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">确定要删除这个作品吗？此操作无法撤销。</p>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setDeleteId(null)}>取消</Button>
                <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}