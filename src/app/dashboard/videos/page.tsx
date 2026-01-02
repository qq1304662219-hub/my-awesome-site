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
      (statusFilter === 'published' && v.status === 'approved') ||
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
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">作品管理</h1>
            <p className="text-gray-400">管理您发布的 AI 视频作品，查看状态和收益。</p>
        </div>
        <Link href="/dashboard/upload">
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20">
              <Plus className="h-4 w-4 mr-2" />
              发布新作品
            </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#1e293b]/50 p-4 rounded-xl border border-white/5">
        <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="搜索作品标题..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-black/20 border-white/10 text-white focus:border-blue-500/50 transition-colors" 
                />
             </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2">
                        <Filter className="h-4 w-4" />
                        {statusFilter === 'all' ? '全部状态' : 
                         statusFilter === 'published' ? '已发布' : 
                         statusFilter === 'pending' ? '审核中' : '已拒绝'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1e293b] border-white/10 text-white">
                    <DropdownMenuItem onClick={() => setStatusFilter('all')} className="hover:bg-white/5 cursor-pointer">全部状态</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('published')} className="hover:bg-white/5 cursor-pointer">已发布</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('pending')} className="hover:bg-white/5 cursor-pointer">审核中</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter('rejected')} className="hover:bg-white/5 cursor-pointer">已拒绝</DropdownMenuItem>
                </DropdownMenuContent>
             </DropdownMenu>
        </div>
        <div className="text-sm text-gray-500">
            共 <span className="text-white font-medium">{filteredVideos.length}</span> 个作品
        </div>
      </div>

      <div className="bg-[#1e293b]/30 rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-black/20 text-gray-200 uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">封面 / 标题</th>
                        <th className="px-6 py-4">状态</th>
                        <th className="px-6 py-4">价格</th>
                        <th className="px-6 py-4">数据表现</th>
                        <th className="px-6 py-4">发布时间</th>
                        <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    <AnimatePresence>
                    {filteredVideos.length > 0 ? (
                        filteredVideos.map((video) => (
                            <motion.tr 
                                key={video.id} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="hover:bg-white/[0.02] transition-colors group"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-16 w-28 bg-black/50 rounded-lg overflow-hidden flex-shrink-0 relative border border-white/5 group-hover:border-blue-500/30 transition-colors">
                                            {video.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video src={video.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={video.url || '/placeholder.png'} alt={video.title} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="max-w-xs">
                                            <div className="font-medium text-white truncate text-base mb-1" title={video.title}>{video.title}</div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-white/5 text-gray-400 border-white/5">
                                                    {video.category || '其他'}
                                                </Badge>
                                                <div 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(video.id.toString());
                                                        toast.success('ID 已复制');
                                                    }}
                                                    className="text-xs text-gray-600 hover:text-blue-400 cursor-pointer flex items-center gap-1 transition-colors"
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
                                    {video.status === 'approved' ? (
                                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 gap-1">
                                            <CheckCircle className="h-3 w-3" /> 已发布
                                        </Badge>
                                    ) : video.status === 'rejected' ? (
                                        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 gap-1">
                                            <XCircle className="h-3 w-3" /> 已拒绝
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20 gap-1">
                                            <AlertCircle className="h-3 w-3" /> 审核中
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-white font-medium">
                                    {(video.price || 0) > 0 ? `¥${video.price}` : <span className="text-green-400">免费</span>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1 text-gray-400" title="浏览量">
                                            <Eye className="h-4 w-4" /> {video.views || 0}
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400" title="下载量">
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
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-gray-400 hover:text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white">
                                            <DropdownMenuItem onClick={() => openEdit(video)} className="hover:bg-white/5 cursor-pointer">
                                                <Edit className="mr-2 h-4 w-4" /> 编辑信息
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-white/10" />
                                            <DropdownMenuItem onClick={() => setDeleteId(video.id.toString())} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                                                <Trash2 className="mr-2 h-4 w-4" /> 删除作品
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-6 py-24 text-center">
                                <div className="flex flex-col items-center justify-center text-gray-500">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <Filter className="h-8 w-8 opacity-50" />
                                    </div>
                                    <p className="text-lg font-medium text-white mb-1">未找到相关作品</p>
                                    <p className="text-sm max-w-sm mx-auto">尝试调整搜索关键词或筛选条件，或者发布一个新的作品。</p>
                                </div>
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
        <DialogContent className="bg-[#1e293b] border-white/10 text-white sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>编辑作品信息</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title" className="text-gray-300">标题</Label>
                    <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-black/20 border-white/10 text-white focus:border-blue-500/50"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="desc" className="text-gray-300">描述</Label>
                    <Textarea
                        id="desc"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="bg-black/20 border-white/10 text-white min-h-[100px] focus:border-blue-500/50"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="price" className="text-gray-300">价格 (元)</Label>
                        <Input
                            id="price"
                            type="number"
                            min="0"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="bg-black/20 border-white/10 text-white focus:border-blue-500/50"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category" className="text-gray-300">分类</Label>
                        <select
                            id="category"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {SCENARIOS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="tags" className="text-gray-300">标签 (逗号分隔)</Label>
                    <Input
                        id="tags"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        placeholder="例如: 风景, 4K, 自然"
                        className="bg-black/20 border-white/10 text-white focus:border-blue-500/50"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="ai_model" className="text-gray-300">AI 模型</Label>
                    <select
                        id="ai_model"
                        value={editAiModel}
                        onChange={(e) => setEditAiModel(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {AI_MODELS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="prompt" className="text-gray-300">Prompt (提示词)</Label>
                    <Textarea
                        id="prompt"
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="bg-black/20 border-white/10 text-white min-h-[80px] focus:border-blue-500/50"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-white/10 text-white hover:bg-white/5">取消</Button>
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">保存修改</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog - Simplified as a system alert for now or can use Sonner with action */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-[#1e293b] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <p className="text-gray-400">确定要删除这个作品吗？此操作无法撤销。</p>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setDeleteId(null)} className="text-white hover:bg-white/5">取消</Button>
                <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">确认删除</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}