"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Loader2, Package, Calendar, Download, Search } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

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

import { getStoragePathFromUrl } from "@/lib/utils"

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState("")

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

      const formattedData = await Promise.all((data || []).map(async (order: any) => {
        const orderItems = await Promise.all(order.order_items.map(async (item: any) => {
            let video = Array.isArray(item.video) ? item.video[0] : item.video;
            
            // Generate Signed URL for download
            if (video && video.url) {
                const storagePath = getStoragePathFromUrl(video.url);
                if (storagePath) {
                    const { data: signedData } = await supabase
                        .storage
                        .from('uploads')
                        .createSignedUrl(storagePath, 60 * 60 * 24); // 24 hours
                    if (signedData) {
                        video.url = signedData.signedUrl;
                    }
                }
            }

            // Generate Signed URL for thumbnail
            if (video && video.thumbnail_url) {
                const thumbPath = getStoragePathFromUrl(video.thumbnail_url);
                if (thumbPath) {
                     const { data: signedThumb } = await supabase
                        .storage
                        .from('uploads')
                        .createSignedUrl(thumbPath, 60 * 60 * 24);
                     if (signedThumb) {
                         video.thumbnail_url = signedThumb.signedUrl;
                     }
                }
            }

            return {
                ...item,
                video
            }
        }));

        return {
            ...order,
            order_items: orderItems
        }
      }))

      setOrders(formattedData)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => 
    order.id.includes(searchQuery) || 
    order.order_items.some((item) => item.video?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="flex h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Package className="text-blue-500" />
              我的订单
            </h1>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="搜索订单..." 
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-blue-500/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-[#0f172a]/30 rounded-2xl border border-dashed border-white/10 backdrop-blur-sm"
            >
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-6">暂无订单记录</p>
              <Link href="/videos">
                <Button variant="outline" className="text-blue-400 hover:text-blue-300 border-blue-500/30 hover:border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10">
                  去购买素材
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-[#0f172a]/50 border-white/10 overflow-hidden hover:bg-[#0f172a]/80 transition-colors group">
                      {/* Order Header */}
                      <div className="bg-white/5 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-white/10">
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                          </div>
                          <div className="font-mono text-xs opacity-70">
                            订单号: {order.id.slice(0, 8)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant="outline"
                            className={order.status === 'completed' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}
                          >
                            {order.status === 'completed' ? '已完成' : order.status}
                          </Badge>
                          <span className="font-bold text-white">总计: ¥{order.total_amount}</span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <CardContent className="p-6 space-y-4">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex gap-4 items-center group/item p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                            <div className="relative w-24 aspect-video bg-black rounded overflow-hidden border border-white/10 shrink-0">
                               {item.video?.thumbnail_url ? (
                                 <Image 
                                   src={item.video.thumbnail_url} 
                                   alt={item.video.title || "video"} 
                                   fill 
                                   className="object-cover group-hover/item:scale-105 transition-transform duration-500"
                                 />
                               ) : (
                                 <div className="w-full h-full bg-gray-900 flex items-center justify-center text-[10px] text-gray-500">No Image</div>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate text-sm">{item.video?.title || "Unknown Video"}</h4>
                              <div className="text-xs text-gray-500 mt-1 flex gap-2">
                                 <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10 text-gray-400">
                                   {item.license_type === 'personal' ? '个人授权' : '企业授权'}
                                 </Badge>
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                              <div className="text-white font-medium">¥{item.price}</div>
                              {item.video?.url ? (
                                <a 
                                  href={item.video.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center justify-end gap-1 hover:underline"
                                >
                                  <Download className="w-3 h-3" /> 下载
                                </a>
                              ) : (
                                <span className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                  暂无资源
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}