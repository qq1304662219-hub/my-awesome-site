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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Search, Edit, Trash2, Plus, Filter, MoreHorizontal, Eye, Download, Copy, CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { Video } from '@/types/video'
import {
  CATEGORIES as CONTENT_SUBJECTS,
  STYLES as VISUAL_STYLES,
  AI_MODELS,
  MOVEMENTS as LENS_LANGUAGES,
  RATIOS,
  RESOLUTIONS as QUALITIES,
  DURATIONS,
  FPS_OPTIONS
} from "@/lib/constants"

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
  
  // New 8 classification dimensions
  const [editStyle, setEditStyle] = useState('') // Visual Style
  const [editCategory, setEditCategory] = useState('') // Content Subject
  const [editAiModel, setEditAiModel] = useState('') // AI Model
  const [editMovement, setEditMovement] = useState('') // Lens Language (Movement)
  const [editRatio, setEditRatio] = useState('') // Ratio
  const [editResolution, setEditResolution] = useState('') // Quality (Resolution)
  const [editDurationRange, setEditDurationRange] = useState('') // Duration Range
  const [editFpsRange, setEditFpsRange] = useState('') // Frame Rate Range
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
    
    // Map existing fields or use defaults
    setEditStyle(video.style || '')
    setEditCategory(video.category || '') // This is now Content Subject
    setEditAiModel(video.ai_model || '')
    // For new fields that might not exist in old records, default to empty
    setEditMovement(video.movement || '') 
    setEditRatio(video.ratio || '')
    setEditResolution(video.resolution || '')
    setEditDurationRange(video.duration_range || '')
    setEditFpsRange(video.fps_range || '')
    
    setEditPrompt(video.prompt || '')
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingVideo) return

    const tagsArray = editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean)

    const updateData = { 
        title: editTitle,
        price: parseFloat(editPrice),
        description: editDescription,
        tags: tagsArray,
        style: editStyle,
        category: editCategory,
        ai_model: editAiModel,
        prompt: editPrompt,
        // New fields to be saved to DB
        ratio: editRatio,
        resolution: editResolution,
        movement: editMovement,
        duration_range: editDurationRange,
        fps_range: editFpsRange,
    }

    const { error } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', editingVideo.id)

    if (error) {
      toast.error('更新失败: ' + error.message)
    } else {
      toast.success('作品已更新')
      setVideos(videos.map(v => v.id === editingVideo.id ? { 
        ...v, 
        ...updateData,
        // Ensure type compatibility if needed
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
                    <Label htmlFor="title" className="text-foreground">标题 <span className="text-red-500">*</span></Label>
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
                
                <div className="grid gap-2">
                    <Label htmlFor="prompt" className="text-foreground">Prompt (提示词)</Label>
                    <Textarea
                        id="prompt"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        placeholder="生成该视频使用的提示词..."
                        className="bg-background border-input text-foreground min-h-[80px] focus:border-primary/50"
                    />
                </div>

                {/* Video Classification Attributes */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                    <Label className="text-sm font-semibold text-foreground mb-2 block">视频分类属性 (必填)</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Content Subject */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">内容题材</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="选择题材" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {CONTENT_SUBJECTS.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Visual Style */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">视觉风格</Label>
                            <Select value={editStyle} onValueChange={setEditStyle}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="选择风格" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {VISUAL_STYLES.map(s => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* AI Model */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">AI 模型</Label>
                            <Select value={editAiModel} onValueChange={setEditAiModel}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="选择模型" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {AI_MODELS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Lens Language */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">镜头语言</Label>
                            <Select value={editMovement} onValueChange={setEditMovement}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="选择镜头" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {LENS_LANGUAGES.map(l => (
                                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Quality/Resolution */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                画质/分辨率
                                <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-500">自动识别</Badge>
                            </Label>
                            <Select value={editResolution} onValueChange={setEditResolution} disabled>
                                <SelectTrigger className="bg-muted border-input text-foreground opacity-100">
                                    <SelectValue placeholder="选择画质" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {QUALITIES.map(q => (
                                        <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Ratio */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                比例
                                <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-500">自动识别</Badge>
                            </Label>
                            <Select value={editRatio} onValueChange={setEditRatio} disabled>
                                <SelectTrigger className="bg-muted border-input text-foreground opacity-100">
                                    <SelectValue placeholder="选择比例" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {RATIOS.map(r => (
                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                时长
                                <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-200 text-blue-500">自动识别</Badge>
                            </Label>
                            <Select value={editDurationRange} onValueChange={setEditDurationRange} disabled>
                                <SelectTrigger className="bg-muted border-input text-foreground opacity-100">
                                    <SelectValue placeholder="选择时长" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {DURATIONS.map(d => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Frame Rate */}
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs flex items-center gap-1">
                                帧率
                                <span className="text-[10px] text-muted-foreground">(请手动选择)</span>
                            </Label>
                            <Select value={editFpsRange} onValueChange={setEditFpsRange}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue placeholder="选择帧率" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {FPS_OPTIONS.map(f => (
                                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="price" className="text-foreground">价格 (A币)</Label>
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
                    <Label htmlFor="tags" className="text-foreground">标签 (输入后逗号分隔)</Label>
                    <Input
                        id="tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="例如: 4K, 自然, 延时摄影"
                        className="bg-background border-input text-foreground focus:border-primary/50"
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