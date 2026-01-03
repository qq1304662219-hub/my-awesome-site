"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/useAuthStore"
import { useCartStore } from "@/store/useCartStore"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"

export function CartDrawerContent({ onClose }: { onClose: () => void }) {
    const router = useRouter()
    const { user } = useAuthStore()
    const { fetchCartCount } = useCartStore()
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchCartItems = async () => {
        if (!user) {
            setItems([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select(`
                    id,
                    license_type,
                    video:videos (
                        id,
                        title,
                        thumbnail_url,
                        price,
                        duration
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching cart items:', error)
            toast.error('获取购物车数据失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCartItems()
    }, [user])

    const toggleAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(new Set(items.map(item => item.id)))
        } else {
            setSelectedItems(new Set())
        }
    }

    const toggleItem = (id: string) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedItems(newSelected)
    }

    const handleDelete = async () => {
        if (selectedItems.size === 0) return

        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('cart_items')
                .delete()
                .in('id', Array.from(selectedItems))

            if (error) throw error

            toast.success('删除成功')
            setSelectedItems(new Set())
            await fetchCartItems()
            await fetchCartCount() // Update global count
        } catch (error) {
            console.error('Error deleting items:', error)
            toast.error('删除失败')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCheckout = () => {
        // Navigate to cart page for checkout
        router.push('/cart')
        onClose()
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            checked={items.length > 0 && selectedItems.size === items.length}
                            onCheckedChange={(checked) => toggleAll(checked as boolean)}
                            disabled={items.length === 0}
                        />
                        <span className="text-foreground cursor-pointer" onClick={() => items.length > 0 && toggleAll(selectedItems.size !== items.length)}>
                            全选
                        </span>
                    </div>
                    <span className="text-muted-foreground mx-2">|</span>
                    <span className="text-foreground font-bold">
                        我的购物车 ({items.length})
                    </span>
                </div>
                <div className="w-4" /> 
            </div>

            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p>加载中...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            <ShoppingCart className="h-8 w-8 opacity-50" />
                        </div>
                        <p>暂无数据</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-3 bg-card p-3 rounded-lg border border-border">
                                <Checkbox 
                                    checked={selectedItems.has(item.id)}
                                    onCheckedChange={() => toggleItem(item.id)}
                                    className="mt-1"
                                />
                                <div className="w-24 aspect-video bg-muted rounded overflow-hidden relative shrink-0">
                                    {item.video?.thumbnail_url ? (
                                        <Image 
                                            src={item.video.thumbnail_url} 
                                            alt={item.video.title || 'video'} 
                                            fill 
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-xs">
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-sm font-medium truncate">{item.video?.title || '未命名视频'}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.license_type === 'personal' ? '个人授权' : 
                                             item.license_type === 'enterprise' ? '企业授权' : '企业PLUS授权'}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-sm font-bold text-primary">¥{item.video?.price || 0}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-border bg-muted/50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="select-all"
                            checked={items.length > 0 && selectedItems.size === items.length}
                            onCheckedChange={(checked) => toggleAll(checked as boolean)}
                            disabled={items.length === 0}
                        />
                        <label htmlFor="select-all" className="text-sm text-muted-foreground cursor-pointer">全选</label>
                    </div>
                    <div className="flex gap-2">
                         <Button 
                            variant="outline" 
                            size="sm"
                            className="border-border text-muted-foreground h-8"
                            onClick={() => router.push('/cart')}
                            disabled={items.length === 0}
                         >
                            查看详情
                         </Button>
                         <Button 
                            size="sm"
                            variant="destructive"
                            className="h-8"
                            onClick={handleDelete}
                            disabled={selectedItems.size === 0 || isDeleting}
                         >
                            {isDeleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                            删除
                         </Button>
                    </div>
                </div>
                {items.length > 0 && (
                    <Button className="w-full" onClick={handleCheckout}>
                        去结算 ({selectedItems.size})
                    </Button>
                )}
            </div>
        </div>
    )
}
