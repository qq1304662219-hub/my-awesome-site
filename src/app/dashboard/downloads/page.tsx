"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { VideoCard } from "@/components/shared/VideoCard"
import { Loader2, Download, Package, Calendar, Search, Filter, ShoppingBag } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getStoragePathFromUrl } from "@/lib/utils"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function MyAssetsPage() {
  const { user } = useAuthStore()
  const [downloads, setDownloads] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      await Promise.all([fetchDownloads(), fetchOrders()])
    } finally {
      setLoading(false)
    }
  }

  const fetchDownloads = async () => {
    try {
      const { data, error } = await supabase
        .from('user_downloads')
        .select(`
          created_at,
          videos (*)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedDownloads = data
        ?.filter(item => item.videos)
        .map(item => ({
          ...item.videos,
          downloaded_at: item.created_at
        })) || []

      setDownloads(formattedDownloads)
    } catch (error) {
      console.error("Error fetching downloads:", error)
    }
  }

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
                        .createSignedUrl(storagePath, 60 * 60 * 24); 
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
    }
  }

  const filteredDownloads = downloads.filter(item => 
    item.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredOrders = orders.filter(order => 
    order.id.includes(searchQuery) || 
    order.order_items.some((item: any) => item.video?.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            我的资产
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理您的下载历史和购买订单
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜索资产..." 
            className="pl-9 bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="downloads" className="space-y-6">
        <TabsList className="bg-muted border border-border p-1">
          <TabsTrigger 
            value="downloads" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground"
          >
            <Download className="w-4 h-4 mr-2" />
            下载历史
          </TabsTrigger>
          <TabsTrigger 
            value="orders" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            购买记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="downloads" className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredDownloads.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDownloads.map((video, index) => (
                  <motion.div
                    key={`${video.id}-${video.downloaded_at}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative group"
                  >
                    <VideoCard {...video} />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-medium text-white border border-white/10 shadow-lg flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(video.downloaded_at).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border backdrop-blur-sm"
              >
                <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <Download className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">暂无下载记录</h3>
                <p className="text-muted-foreground text-sm">
                  您下载的视频将会显示在这里
                </p>
                <Link href="/videos">
                  <Button variant="link" className="text-primary mt-2">
                    去浏览视频
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                 {filteredOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="bg-card border-border overflow-hidden hover:bg-muted/50 transition-colors group">
                      <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-muted/30">
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString()}
                          </div>
                          <div className="font-mono text-xs opacity-70">
                            ID: {order.id.slice(0, 8)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="font-bold text-foreground">
                            ¥{order.total_amount}
                          </div>
                          <Badge 
                            variant="outline"
                            className={order.status === 'completed' 
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'}
                          >
                            {order.status === 'completed' ? '已完成' : order.status}
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-4">
                        {order.order_items.map((item: any) => (
                          <div key={item.id} className="flex gap-4 group/item hover:bg-muted/50 p-2 rounded-lg transition-colors">
                            <div className="relative w-32 aspect-video bg-muted rounded-md overflow-hidden border border-border shrink-0">
                              {item.video?.thumbnail_url ? (
                                 <Image 
                                   src={item.video.thumbnail_url} 
                                   alt={item.video.title || 'Video'} 
                                   fill 
                                   className="object-cover group-hover/item:scale-105 transition-transform duration-500"
                                 />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted text-xs">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                              <div>
                                <h4 className="font-medium text-foreground truncate text-sm">{item.video?.title || 'Unknown Video'}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                   <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/30 text-primary bg-primary/5">
                                     {item.license_type === 'personal' ? '个人授权' : '企业授权'}
                                   </Badge>
                                   <span className="text-muted-foreground text-xs">¥{item.price}</span>
                                </div>
                              </div>
                              <div className="flex gap-3 mt-2">
                                 {item.video?.url && (
                                   <a 
                                     href={item.video.url} 
                                     target="_blank" 
                                     rel="noopener noreferrer"
                                     className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors"
                                   >
                                     <Download className="w-3 h-3" />
                                     下载资源
                                   </a>
                                 )}
                                 <Link href={`/video/${item.video?.id}`} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                   查看详情
                                 </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                 ))}
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border backdrop-blur-sm"
              >
                <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">暂无购买记录</h3>
                <p className="text-muted-foreground text-sm">
                  您购买的视频将会显示在这里
                </p>
                <Link href="/videos">
                  <Button variant="link" className="text-primary mt-2">
                    去选购素材
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}