'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Search, Edit, Trash2, Plus } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface VideoItem {
  id: string
  title: string
  url: string
  created_at: string
  views: number
  downloads: number
  price: number
  status: string
}

export default function MyVideos() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editPrice, setEditPrice] = useState('0')

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
      setVideos(data as VideoItem[])
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!deleteId) return

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', deleteId)

    if (error) {
      toast.error('删除失败: ' + error.message)
    } else {
      toast.success('作品已删除')
      setVideos(videos.filter(v => v.id !== deleteId))
    }
    setDeleteId(null)
  }

  const openEdit = (video: VideoItem) => {
    setEditingVideo(video)
    setEditTitle(video.title)
    setEditPrice(video.price?.toString() || '0')
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingVideo) return

    const { error } = await supabase
      .from('videos')
      .update({ 
        title: editTitle,
        price: parseFloat(editPrice)
      })
      .eq('id', editingVideo.id)

    if (error) {
      toast.error('更新失败: ' + error.message)
    } else {
      toast.success('作品已更新')
      setVideos(videos.map(v => v.id === editingVideo.id ? { ...v, title: editTitle, price: parseFloat(editPrice) } : v))
      setIsEditOpen(false)
    }
  }

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">作品管理</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="搜索作品..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white w-64" 
            />
          </div>
          <Link href="/dashboard/upload">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              上传作品
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                    <tr>
                        <th className="px-6 py-4">封面 / 标题</th>
                        <th className="px-6 py-4">状态</th>
                        <th className="px-6 py-4">价格</th>
                        <th className="px-6 py-4">数据</th>
                        <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {filteredVideos.length > 0 ? (
                        filteredVideos.map((video) => (
                            <tr key={video.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-20 bg-black/50 rounded overflow-hidden flex-shrink-0 relative">
                                            {video.url.match(/\.(mp4|webm|ogg)$/i) ? (
                                                <video src={video.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={video.url} alt={video.title} className="w-full h-full object-cover" />
                                            )}
                                        </div>
                                        <div className="max-w-xs truncate">
                                            <div className="font-medium text-white truncate" title={video.title}>{video.title}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                <span>{new Date(video.created_at).toLocaleDateString()}</span>
                                                <span className="text-gray-600">|</span>
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(video.id);
                                                        toast.success('ID 已复制');
                                                    }}
                                                    className="hover:text-blue-400 cursor-pointer flex items-center gap-1"
                                                    title="点击复制视频 ID"
                                                >
                                                    ID: {video.id.slice(0, 8)}...
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {video.status === 'published' ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                            🟢 已发布
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400">
                                            🟡 审核中
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-white">
                                    {video.price > 0 ? `¥${video.price}` : '免费'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="space-y-1 text-xs">
                                        <div>👁️ {video.views || 0} 浏览</div>
                                        <div>⬇️ {video.downloads || 0} 下载</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(video)} className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-400">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <button 
                                            onClick={() => setDeleteId(video.id)}
                                            className="text-gray-400 hover:text-red-400 transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                暂无作品
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>编辑作品信息</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="title">标题</Label>
                    <Input
                        id="title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="price">价格 (元)</Label>
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)} className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white">取消</Button>
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">保存修改</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-[#1a1f2e] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-gray-400">
                确定要删除这个作品吗？此操作无法撤销。
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteId(null)} className="border-white/10 text-gray-300 hover:bg-white/5 hover:text-white">取消</Button>
                <Button onClick={handleDelete} variant="destructive" className="bg-red-600 hover:bg-red-700">确认删除</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
