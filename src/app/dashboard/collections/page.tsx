"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { FolderPlus, Lock, Globe, Trash2, Video, Plus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function MyCollectionsPage() {
  const { user } = useAuthStore()
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCollections()
    }
  }, [user])

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          collection_items (count)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast.error("获取收藏夹失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newCollectionName.trim()) return

    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          user_id: user?.id,
          is_public: isPublic
        })
        .select()
        .single()

      if (error) throw error

      setCollections([{ ...data, collection_items: [{ count: 0 }] }, ...collections])
      setCreateOpen(false)
      setNewCollectionName("")
      toast.success("创建成功")
    } catch (error) {
      console.error("Error creating collection:", error)
      toast.error("创建失败")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个收藏夹吗？其中的视频不会被删除。")) return

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCollections(collections.filter(c => c.id !== id))
      toast.success("删除成功")
    } catch (error) {
      console.error("Error deleting collection:", error)
      toast.error("删除失败")
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-32 pb-12 flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">我的收藏夹</h1>
            <p className="text-gray-400">管理您收藏的视频素材</p>
          </div>
          
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                新建收藏夹
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0B1120] border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>新建收藏夹</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>名称</Label>
                  <Input 
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="例如：赛博朋克风格..."
                    className="bg-black/20 border-white/10 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={isPublic ? "border-blue-500 text-blue-400" : "border-white/10 text-gray-400"}
                    onClick={() => setIsPublic(true)}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    公开
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={!isPublic ? "border-blue-500 text-blue-400" : "border-white/10 text-gray-400"}
                    onClick={() => setIsPublic(false)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    私密
                  </Button>
                </div>
                <Button onClick={handleCreate} className="w-full bg-blue-600 hover:bg-blue-700">
                  创建
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">加载中...</div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
            <FolderPlus className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300">暂无收藏夹</h3>
            <p className="text-gray-500 mt-2">快去探索视频并添加到收藏夹吧</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(collection => (
              <div key={collection.id} className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-colors group relative">
                <Link href={`/dashboard/collections/${collection.id}`} className="block p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <FolderPlus className="h-6 w-6" />
                    </div>
                    {collection.is_public ? (
                      <Globe className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold mb-1 group-hover:text-blue-400 transition-colors">{collection.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Video className="h-3 w-3" />
                    {collection.collection_items[0]?.count || 0} 个视频
                  </div>
                </Link>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(collection.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
