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
          <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
            <FolderPlus className="h-4 w-4 mr-2" />
            收藏
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0B1120] border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加到收藏夹</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {/* Create New Collection */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label>新建收藏夹</Label>
              <Input 
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="输入收藏夹名称..."
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              className={cn("mb-0.5 border-white/10 hover:bg-white/10", isPublic ? "text-blue-400" : "text-gray-400")}
              onClick={() => setIsPublic(!isPublic)}
              title={isPublic ? "公开" : "私密"}
            >
              {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </Button>
            <Button 
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim() || creating}
              className="mb-0.5 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-[1px] bg-white/10 my-2" />

          {/* Collections List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {loading ? (
              <p className="text-center text-gray-500 py-4">加载中...</p>
            ) : collections.length === 0 ? (
              <p className="text-center text-gray-500 py-4">暂无收藏夹</p>
            ) : (
              collections.map(collection => (
                <div 
                  key={collection.id}
                  onClick={() => toggleCollection(collection.id)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <FolderPlus className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm flex items-center gap-2">
                        {collection.name}
                        {!collection.is_public && <Lock className="h-3 w-3 text-gray-500" />}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(collection.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  {selectedCollections.includes(collection.id) && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
