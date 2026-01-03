"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, FolderPlus, Check, Lock, Globe } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface AddToCollectionModalProps {
  videoId: string
  trigger?: React.ReactNode
}

export function AddToCollectionModal({ videoId, trigger }: AddToCollectionModalProps) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [selectedCollections, setSelectedCollections] = useState<number[]>([])

  useEffect(() => {
    if (open && user) {
      fetchCollections()
    }
  }, [open, user])

  const fetchCollections = async () => {
    setLoading(true)
    try {
      // 1. Fetch user's collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (collectionsError) throw collectionsError

      // 2. Fetch which collections already contain this video
      const { data: itemsData, error: itemsError } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('video_id', videoId)

      if (itemsError) throw itemsError

      setCollections(collectionsData || [])
      setSelectedCollections(itemsData?.map(item => item.collection_id) || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
      toast.error("获取收藏夹失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return

    setCreating(true)
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

      setCollections([data, ...collections])
      setNewCollectionName("")
      toast.success("创建收藏夹成功")
    } catch (error) {
      console.error("Error creating collection:", error)
      toast.error("创建收藏夹失败")
    } finally {
      setCreating(false)
    }
  }

  const toggleCollection = async (collectionId: number) => {
    const isSelected = selectedCollections.includes(collectionId)
    
    try {
      if (isSelected) {
        // Remove
        const { error } = await supabase
          .from('collection_items')
          .delete()
          .eq('collection_id', collectionId)
          .eq('video_id', videoId)

        if (error) throw error
        setSelectedCollections(prev => prev.filter(id => id !== collectionId))
        toast.success("已从收藏夹移除")
      } else {
        // Add
        const { error } = await supabase
          .from('collection_items')
          .insert({
            collection_id: collectionId,
            video_id: videoId
          })

        if (error) throw error
        setSelectedCollections(prev => [...prev, collectionId])
        toast.success("已添加到收藏夹")
      }
    } catch (error) {
      console.error("Error updating collection:", error)
      toast.error("操作失败")
    }
  }

  if (!user) {
    // Keep rendering but handle click in DialogTrigger or parent
    // Actually, to handle it properly with DialogTrigger, we can use an onClick on the trigger wrapper
    // But DialogTrigger hijacks the click.
    // Better strategy: Use onOpenChange to intercept
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !user) {
      toast.error("请先登录")
      router.push("/auth")
      return
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="secondary" className="bg-secondary/50 hover:bg-secondary text-secondary-foreground border-0">
            <FolderPlus className="h-4 w-4 mr-2" />
            收藏
          </Button>
        )}
      </DialogTrigger>
    <DialogContent className="sm:max-w-md bg-card border-border">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold text-foreground">添加到收藏夹</DialogTitle>
      </DialogHeader>
      
      <div className="flex flex-col gap-4 py-4">
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {/* Create New Collection Trigger */}
          <button
            onClick={() => setShowCreateInput(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-muted/50 transition-colors group text-left"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">新建收藏夹</h3>
              <p className="text-sm text-muted-foreground">创建新的分类来整理视频</p>
            </div>
          </button>

          {/* Create New Collection Input */}
          {showCreateInput && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border animate-in fade-in slide-in-from-top-2">
              <div className="space-y-3">
                <Input
                  placeholder="收藏夹名称"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="bg-background border-border"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setShowCreateInput(false)}
                    className="hover:bg-muted"
                  >
                    取消
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim() || creating}
                  >
                    {creating ? "创建中..." : "创建"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Collections List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              还没有收藏夹，创建一个吧
            </div>
          ) : (
            <div className="space-y-2">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => toggleCollection(collection.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                    selectedCollections.includes(collection.id)
                      ? "bg-primary/10 border-primary/50"
                      : "bg-card border-border hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      selectedCollections.includes(collection.id)
                        ? "bg-primary/20"
                        : "bg-muted"
                    }`}>
                      <FolderHeart className={`w-6 h-6 ${
                        selectedCollections.includes(collection.id)
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`} />
                    </div>
                    <div className="text-left">
                      <h3 className={`font-medium ${
                        selectedCollections.includes(collection.id)
                          ? "text-primary"
                          : "text-foreground"
                      }`}>{collection.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {collection.count || 0} 个视频
                      </p>
                    </div>
                  </div>
                  {selectedCollections.includes(collection.id) && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => setOpen(false)} className="hover:bg-muted">
            取消
          </Button>
          <Button onClick={() => setOpen(false)} className="bg-primary hover:bg-primary/90">
            完成
          </Button>
        </div>
      </div>
    </DialogContent>
    </Dialog>
  )
}
