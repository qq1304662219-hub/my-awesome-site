"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { useCartStore } from "@/store/useCartStore"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface CartItem {
  id: string
  video: {
    id: string
    title: string
    thumbnail_url: string
    price: number
    license_type?: string
  }
  price: number
  license_type: string
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const { user, profile, setProfile } = useAuthStore()
  const { fetchCartCount } = useCartStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          license_type,
          video:video_id (
            id,
            title,
            thumbnail_url,
            price
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform data to match interface if needed, or rely on loose typing
      // Note: supabase join returns array or object depending on relationship.
      // Assuming video_id is FK to videos(id)
      const formattedItems = data?.map((item: any) => ({
        id: item.id,
        video: item.video,
        price: item.video.price || 0, // Default price if not set
        license_type: item.license_type
      })) || []

      setItems(formattedItems)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("加载购物车失败")
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setItems(prev => prev.filter(item => item.id !== id))
      setSelectedItems(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      toast.success("已移除商品")
      fetchCartCount()
    } catch (error) {
      toast.error("移除失败")
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(i => i.id)))
    }
  }

  const calculateTotal = () => {
    let total = 0
    items.forEach(item => {
      if (selectedItems.has(item.id)) {
        total += item.price
      }
    })
    return total
  }

  const handleCheckout = async () => {
    if (selectedItems.size === 0) return
    if (!user) return

    const total = calculateTotal()
    const balance = profile?.balance || 0

    if (balance < total) {
      toast.error("余额不足，请充值")
      router.push(`/recharge?returnUrl=${encodeURIComponent('/cart')}`)
      return
    }

    setProcessing(true)
    try {
      const checkoutItems = items.filter(i => selectedItems.has(i.id))
      
      const { data: orderId, error } = await supabase.rpc('handle_purchase', {
        p_user_id: user.id,
        p_total_amount: total,
        p_video_ids: checkoutItems.map(i => i.video.id),
        p_prices: checkoutItems.map(i => i.price),
        p_license_types: checkoutItems.map(i => i.license_type)
      })

      if (error) throw error

      // Remove purchased items from cart
      await supabase
        .from('cart_items')
        .delete()
        .in('id', Array.from(selectedItems))

      // Update local balance
      if (profile) {
        setProfile({ ...profile, balance: balance - total })
      }

      await fetchCartCount()
      toast.success("支付成功！")
      router.push("/dashboard/orders")
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast.error(error.message || "支付失败")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      
      <div className="container mx-auto px-4 py-24 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShoppingCart className="text-primary" />
          我的购物车
          <span className="text-sm font-normal text-muted-foreground mt-2">({items.length} 件商品)</span>
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-muted/50 rounded-2xl border border-border">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-6">购物车是空的</p>
            <Button onClick={() => router.push('/explore')} variant="outline" className="border-input hover:bg-accent hover:text-accent-foreground">
              去逛逛
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
                <Checkbox 
                  checked={selectedItems.size === items.length && items.length > 0}
                  onCheckedChange={toggleAll}
                  className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="text-sm text-muted-foreground">全选</span>
              </div>

              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-card rounded-xl border border-border group hover:border-primary/50 transition-colors">
                  <div className="flex items-center">
                    <Checkbox 
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="border-input data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                  </div>
                  
                  <div className="relative w-32 aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                    {item.video.thumbnail_url ? (
                       <Image 
                         src={item.video.thumbnail_url} 
                         alt={item.video.title} 
                         fill 
                         className="object-cover"
                       />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-medium text-foreground line-clamp-1">{item.video.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">ID: {item.video.id.slice(0, 8)}...</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {item.license_type === 'personal' ? '个人授权' : '企业授权'}
                      </div>
                      <div className="font-bold text-lg text-foreground">¥{item.price}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="self-center p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-2xl p-6 text-foreground sticky top-24 shadow-sm">
                <h3 className="text-lg font-bold mb-6">订单摘要</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-muted-foreground">
                    <span>已选商品</span>
                    <span>{selectedItems.size} 件</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>总计金额</span>
                    <span className="font-medium text-foreground">¥{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>账户余额</span>
                    <span className="font-medium text-foreground">¥{profile?.balance || 0}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-lg">应付总额</span>
                    <span className="text-3xl font-bold text-primary">¥{calculateTotal()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={selectedItems.size === 0 || processing}
                  onClick={handleCheckout}
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "立即结算"}
                </Button>

                {(profile?.balance || 0) < calculateTotal() && (
                   <p className="text-destructive text-sm text-center mt-3">余额不足，请先充值</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}