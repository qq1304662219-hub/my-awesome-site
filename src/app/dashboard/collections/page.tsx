"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { FolderPlus, Lock, Globe, Trash2, Video, Plus, Search, MoreHorizontal, Folder } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"

export default function MyCollectionsPage() {
  const { user } = useAuthStore()
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

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
    // Note: In a real app, you might want a custom confirmation dialog.
    // For now, browser confirm is okay, or we could use a state for a delete dialog.
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

  const filteredCollections = collections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 md:p-8 space-y-8 min-h-screen bg-background text-foreground">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">我的收藏夹</h1>
          <p className="text-muted-foreground mt-1">管理您收藏的视频素材，支持公开分享与私密保存</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索收藏夹..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-muted/50 border-border w-[200px] focus:w-[250px] transition-all"
            />
          </div>
          
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                新建收藏夹
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-card-foreground sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>新建收藏夹</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label>名称</Label>
                  <Input 
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="例如：赛博朋克风格..."
                    className="bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label>可见性</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`cursor-pointer rounded-lg border p-3 flex items-center justify-center gap-2 transition-all ${isPublic ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted text-muted-foreground'}`}
                      onClick={() => setIsPublic(true)}
                    >
                      <Globe className="h-4 w-4" />
                      公开
                    </div>
                    <div 
                      className={`cursor-pointer rounded-lg border p-3 flex items-center justify-center gap-2 transition-all ${!isPublic ? 'bg-primary/10 border-primary text-primary' : 'border-border hover:bg-muted text-muted-foreground'}`}
                      onClick={() => setIsPublic(false)}
                    >
                      <Lock className="h-4 w-4" />
                      私密
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  创建收藏夹
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredCollections.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border"
        >
          <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <FolderPlus className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">暂无收藏夹</h3>
          <p className="text-muted-foreground max-w-sm text-center mb-6">
            {searchTerm ? "没有找到匹配的收藏夹" : "创建一个收藏夹来整理您喜欢的视频素材"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setCreateOpen(true)} variant="secondary">
              立即创建
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredCollections.map((collection, index) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-card border-border overflow-hidden hover:border-primary/50 hover:bg-muted/50 transition-all group">
                  <Link href={`/dashboard/collections/${collection.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-primary/5">
                          <Folder className="h-7 w-7 fill-current" />
                        </div>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(collection.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate" title={collection.name}>
                          {collection.name}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Video className="h-3.5 w-3.5" />
                            <span>{collection.collection_items[0]?.count || 0} 个视频</span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted border border-border">
                            {collection.is_public ? (
                              <>
                                <Globe className="h-3 w-3" />
                                <span className="text-xs">公开</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                <span className="text-xs">私密</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
