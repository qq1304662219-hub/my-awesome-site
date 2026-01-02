"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Trash2, ShoppingCart } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="container mx-auto px-4 py-24 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <ShoppingCart className="text-blue-500" />
          我的购物车
          <span className="text-sm font-normal text-gray-500 mt-2">({items.length} 件商品)</span>
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-6">购物车是空的</p>
            <Button onClick={() => router.push('/explore')} variant="outline" className="border-white/10 text-white hover:bg-white/10">
              去逛逛
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                <Checkbox 
                  checked={selectedItems.size === items.length && items.length > 0}
                  onCheckedChange={toggleAll}
                  className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <span className="text-sm text-gray-400">全选</span>
              </div>

              {items.map(item => (
                <div key={item.id} className="flex gap-4 p-4 bg-[#0f172a] rounded-xl border border-white/10 group">
                  <div className="flex items-center">
                    <Checkbox 
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>
                  
                  <div className="relative w-32 aspect-video bg-black rounded-lg overflow-hidden border border-white/5">
                    {item.video.thumbnail_url ? (
                       <Image 
                         src={item.video.thumbnail_url} 
                         alt={item.video.title} 
                         fill 
                         className="object-cover"
                       />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-medium text-white line-clamp-1">{item.video.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">ID: {item.video.id.slice(0, 8)}...</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                        {item.license_type === 'personal' ? '个人授权' : '企业授权'}
                      </div>
                      <div className="font-bold text-lg">¥{item.price}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="self-center p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 text-black sticky top-24">
                <h3 className="text-lg font-bold mb-6">订单摘要</h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-600">
                    <span>已选商品</span>
                    <span>{selectedItems.size} 件</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>总计金额</span>
                    <span className="font-medium">¥{calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>账户余额</span>
                    <span className="font-medium">¥{profile?.balance || 0}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-lg">应付总额</span>
                    <span className="text-3xl font-bold text-blue-600">¥{calculateTotal()}</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={selectedItems.size === 0 || processing}
                  onClick={handleCheckout}
                >
                  {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "立即结算"}
                </Button>

                {(profile?.balance || 0) < calculateTotal() && (
                   <p className="text-red-500 text-sm text-center mt-3">余额不足，请先充值</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}