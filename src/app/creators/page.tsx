"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, Trophy, MapPin, Users, Video, Search, ArrowRight } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Creator {
    id: string
    username: string
    full_name: string
    avatar_url: string
    bio: string
    is_verified: boolean
    verified_title: string
    badges: string[]
    location: string
    works_count: number
    followers_count: number
    views_count: number
    recent_works?: any[]
}

export default function CreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("all") // all, verified, award
    const { user } = useAuthStore()
    const [isApplyOpen, setIsApplyOpen] = useState(false)
    const [applicationForm, setApplicationForm] = useState({
        portfolio: "",
        bio: "",
        social: ""
    })

    useEffect(() => {
        fetchCreators()
    }, [filter])

    const fetchCreators = async () => {
        // ... (existing code)
        setLoading(true)
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (filter === 'verified') {
                query = query.eq('is_verified', true)
            } else if (filter === 'award') {
                query = query.contains('badges', ['award_winner'])
            }

            const { data, error } = await query

            if (error) throw error

            // Fetch recent works for each creator (limit 3)
            const creatorsWithWorks = await Promise.all(data.map(async (creator) => {
                const { data: works } = await supabase
                    .from('videos')
                    .select('id, thumbnail_url, url, title')
                    .eq('user_id', creator.id)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                    .limit(3)
                
                // Get followers count
                const { count } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', creator.id)

                return {
                    ...creator,
                    recent_works: works || [],
                    followers_count: count || 0
                }
            }))

            setCreators(creatorsWithWorks)
        } catch (error) {
            console.error("Error fetching creators:", error)
            toast.error("加载创作者失败")
        } finally {
            setLoading(false)
        }
    }

    const handleApply = () => {
        if (!user) {
            toast.error("请先登录")
            return
        }
        setIsApplyOpen(true)
    }

    const submitApplication = async () => {
        if (!applicationForm.portfolio || !applicationForm.bio) {
             toast.error("请填写完整信息")
             return
        }

        try {
            const { error } = await supabase
                .from('creator_applications')
                .insert({
                    user_id: user!.id,
                    portfolio_url: applicationForm.portfolio,
                    bio: applicationForm.bio,
                    social_links: { other: applicationForm.social }
                })
            
            if (error) throw error
            
            toast.success("申请已提交，请等待审核")
            setIsApplyOpen(false)
        } catch (e) {
            console.error(e)
            toast.error("提交失败")
        }
    }


    return (
        <main className="min-h-screen bg-[#020817] text-white">
            <Navbar />
            
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge className="mb-4 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20 px-4 py-1">
                            <Trophy className="w-3 h-3 mr-2" />
                            汇聚全球顶尖 AI 创作者
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-gray-400 bg-clip-text text-transparent">
                            发现 AI 影像的未来力量
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                            加入我们的优质创作者生态，展示您的作品，与行业领袖交流，获取商业机会。
                        </p>
                        <div className="flex justify-center gap-4">
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleApply}>
                                申请入驻认证
                            </Button>
                            <Button size="lg" variant="outline" className="border-white/10 hover:bg-white/5">
                                了解权益
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filter & Search */}
            <section className="container mx-auto px-4 mb-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <Tabs defaultValue="all" onValueChange={setFilter} className="w-full md:w-auto">
                        <TabsList className="bg-white/5 border border-white/10">
                            <TabsTrigger value="all">全部创作者</TabsTrigger>
                            <TabsTrigger value="verified">认证创作者</TabsTrigger>
                            <TabsTrigger value="award">获奖者</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input 
                            placeholder="搜索创作者..." 
                            className="bg-white/5 border-white/10 pl-10 text-white placeholder:text-gray-500"
                        />
                    </div>
                </div>
            </section>

            {/* Creators Grid */}
            <section className="container mx-auto px-4 pb-20">
                {loading ? (
                    <div className="text-center py-20 text-gray-500">加载中...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creators.map((creator, index) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card className="bg-[#0f172a] border-white/10 overflow-hidden hover:border-blue-500/30 transition-all duration-300 group h-full flex flex-col">
                                    <div className="p-6 pb-4 flex items-start justify-between">
                                        <div className="flex gap-4">
                                            <Link href={`/profile/${creator.id}`}>
                                                <Avatar className="w-16 h-16 border-2 border-white/10 group-hover:border-blue-500 transition-colors">
                                                    <AvatarImage src={creator.avatar_url} />
                                                    <AvatarFallback>{creator.username?.[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Link>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link href={`/profile/${creator.id}`} className="font-bold text-lg text-white hover:text-blue-400 transition-colors">
                                                        {creator.full_name || creator.username}
                                                    </Link>
                                                    {creator.is_verified && (
                                                        <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                                                    )}
                                                </div>
                                                {creator.verified_title && (
                                                    <div className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full inline-block mb-2">
                                                        {creator.verified_title}
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
                                                    {creator.bio || "这个创作者很懒，什么都没写"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Stats */}
                                    <div className="px-6 py-2 flex gap-6 text-sm text-gray-500 border-b border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <Video className="w-3.5 h-3.5" />
                                            <span>{creator.works_count || creator.recent_works.length} 作品</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{creator.followers_count} 粉丝</span>
                                        </div>
                                        {creator.location && (
                                            <div className="flex items-center gap-1.5 ml-auto">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>{creator.location}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Recent Works Showcase */}
                                    <div className="p-4 bg-black/20 mt-auto">
                                        <div className="grid grid-cols-3 gap-2">
                                            {creator.recent_works && creator.recent_works.length > 0 ? (
                                                creator.recent_works.map((work: any) => (
                                                    <Link href={`/video/${work.id}`} key={work.id} className="relative aspect-video rounded-md overflow-hidden bg-white/5 group/work">
                                                        {work.thumbnail_url ? (
                                                            <img src={work.thumbnail_url} alt={work.title} className="w-full h-full object-cover group-hover/work:scale-110 transition-transform duration-500" />
                                                        ) : (
                                                            <video src={work.url} className="w-full h-full object-cover" muted />
                                                        )}
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="col-span-3 text-center py-4 text-xs text-gray-600">
                                                    暂无公开作品
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </section>

            <Footer />

            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogContent className="bg-[#1a1f2e] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle>申请成为认证创作者</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            请填写您的创作经历和作品集链接，我们将尽快审核。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="portfolio">作品集链接 (Behance, VJshi, etc)</Label>
                            <Input
                                id="portfolio"
                                value={applicationForm.portfolio}
                                onChange={(e) => setApplicationForm({ ...applicationForm, portfolio: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="https://..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">个人简介 / 创作风格</Label>
                            <Textarea
                                id="bio"
                                value={applicationForm.bio}
                                onChange={(e) => setApplicationForm({ ...applicationForm, bio: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="专注于科幻风格 AI 视频创作..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="social">其他社交媒体 (可选)</Label>
                            <Input
                                id="social"
                                value={applicationForm.social}
                                onChange={(e) => setApplicationForm({ ...applicationForm, social: e.target.value })}
                                className="bg-white/5 border-white/10"
                                placeholder="Twitter / Instagram / Bilibili"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApplyOpen(false)} className="border-white/10 hover:bg-white/5">
                            取消
                        </Button>
                        <Button onClick={submitApplication} className="bg-blue-600 hover:bg-blue-700">
                            提交申请
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    )
}
