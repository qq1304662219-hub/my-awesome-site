"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Loader2, Package, Calendar, Download } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface OrderItem {
  id: string
  price: number
  license_type: string
  video: {
    id: string
    title: string
    thumbnail_url: string
    url: string
  }
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            price,
            license_type,
            video:video_id (
              id,
              title,
              thumbnail_url,
              url
            )
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedData = (data || []).map((order: any) => ({
        ...order,
        order_items: order.order_items.map((item: any) => ({
          ...item,
          video: Array.isArray(item.video) ? item.video[0] : item.video
        }))
      }))

      setOrders(formattedData)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Package className="text-blue-500" />
            我的订单
          </h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">暂无订单记录</p>
              <Link href="/videos" className="text-blue-400 hover:text-blue-300">去购买素材</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-white/5 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-white/10">
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                      </div>
                      <div>订单号: {order.id.slice(0, 8)}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'} className={order.status === 'completed' ? 'bg-green-600' : 'bg-gray-600'}>
                        {order.status === 'completed' ? '已完成' : order.status}
                      </Badge>
                      <span className="font-bold text-white">总计: ¥{order.total_amount}</span>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="relative w-24 aspect-video bg-black rounded overflow-hidden border border-white/5 shrink-0">
                           {item.video?.thumbnail_url ? (
                             <Image 
                               src={item.video.thumbnail_url} 
                               alt={item.video.title || "video"} 
                               fill 
                               className="object-cover"
                             />
                           ) : (
                             <div className="w-full h-full bg-gray-800" />
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium truncate">{item.video?.title || "Unknown Video"}</h4>
                          <div className="text-xs text-gray-500 mt-1 flex gap-2">
                             <span className="bg-white/10 px-1.5 py-0.5 rounded text-gray-300">
                               {item.license_type === 'personal' ? '个人授权' : '企业授权'}
                             </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">¥{item.price}</div>
                          {item.video?.url ? (
                            <a 
                              href={item.video.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-end gap-1 mt-1"
                            >
                              <Download className="w-3 h-3" /> 下载
                            </a>
                          ) : (
                            <span className="text-xs text-gray-500 flex items-center justify-end gap-1 mt-1">
                              暂无资源
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}