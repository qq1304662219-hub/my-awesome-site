"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CheckCircle, Trophy, MapPin, Users, Video, Search, MessageSquare, Plus, Filter, BadgeCheck, UserPlus } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { CreatorSidebar } from "@/components/creators/CreatorSidebar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

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
    job_title: string
    works_count: number
    followers_count: number
    views_count: number
    recent_works?: any[]
    is_online?: boolean
}

export default function CreatorsPage() {
    const [creators, setCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        role: "all",
        location: "all",
        verified: "all",
        honors: "all"
    })
    const { user } = useAuthStore()

    useEffect(() => {
        fetchCreators()
    }, [filters])

    const fetchCreators = async () => {
        setLoading(true)
        try {
            let query = supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            // Apply filters
            if (filters.verified === 'verified') {
                query = query.eq('is_verified', true)
            }
            if (filters.role !== 'all') {
                query = query.eq('job_title', filters.role)
            }
            if (filters.location !== 'all') {
                query = query.eq('location', filters.location)
            }
            if (filters.honors !== 'all') {
                // Assuming badges is a text array or jsonb containing the tag
                // Since Supabase filtering on arrays can be tricky with simple 'eq',
                // we might need 'cs' (contains) for array column.
                // Assuming 'badges' is a text[] column.
                if (filters.honors === 'award_winner') {
                    query = query.contains('badges', ['award_winner'])
                } else if (filters.honors === 'recommended') {
                    query = query.contains('badges', ['recommended'])
                }
            }

            const { data, error } = await query

            if (error) throw error

            // Fetch recent works and stats for each creator
            const creatorsWithWorks = await Promise.all(data.map(async (creator) => {
                const { data: works } = await supabase
                    .from('videos')
                    .select('id, thumbnail_url, url, title, views')
                    .eq('user_id', creator.id)
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                
                // Calculate total views (Popularity)
                const allWorks = works || []
                const totalViews = allWorks.reduce((sum, work) => sum + (work.views || 0), 0)
                const recentWorks = allWorks.slice(0, 3)

                // Get followers count
                const { count } = await supabase
                    .from('follows')
                    .select('*', { count: 'exact', head: true })
                    .eq('following_id', creator.id)

                return {
                    ...creator,
                    recent_works: recentWorks,
                    followers_count: count || 0,
                    views_count: totalViews,
                    // Mock online status (random for demo, ideally from presence)
                    is_online: Math.random() > 0.7
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

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }))
    }

    const handleFollow = async (creatorId: string) => {
        if (!user) {
            toast.error("请先登录")
            return
        }
        if (user.id === creatorId) return;

        try {
            // Check if already following (simplified for UI demo)
            // Real implementation should check state or DB first
            await supabase.from('follows').insert({
                follower_id: user.id,
                following_id: creatorId
            })
            toast.success("关注成功")
            // Ideally update local state to reflect change
        } catch (e) {
            // Assume duplicate key error means already following, so unfollow
            await supabase.from('follows').delete()
                .eq('follower_id', user.id)
                .eq('following_id', creatorId)
            toast.success("已取消关注")
        }
    }


    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />
            
            {/* Hero Section */}
            <section className="relative pt-24 pb-12 overflow-hidden border-b border-border">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-blue-500 to-muted-foreground bg-clip-text text-transparent">
                            优质创作者生态
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-6">
                            汇聚全球顶尖 AI 影像创作者，发现无限创意可能
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/certification">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Trophy className="w-4 h-4 mr-2" />
                                    申请认证
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Sidebar */}
                    <div className="md:col-span-3 hidden md:block">
                        <div className="sticky top-24">
                            <CreatorSidebar filters={filters} onFilterChange={handleFilterChange} />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="md:col-span-9">
                        {/* Mobile Filter & Search */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <div className="md:hidden w-full">
                                {/* Mobile Filter Trigger could go here, for now just hidden on mobile */}
                            </div>
                            <div className="relative w-full sm:w-72 ml-auto">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    placeholder="搜索创作者..." 
                                    className="bg-background border-input pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                                />
                            </div>
                        </div>

                        {/* Creators Grid */}
                        {loading ? (
                            <div className="flex flex-col space-y-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-[240px] bg-muted animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col space-y-6">
                                {creators.map((creator, index) => (
                                    <motion.div
                                        key={creator.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="flex flex-col md:flex-row bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 group shadow-sm hover:shadow-md">
                                            {/* Left: Profile Info */}
                                            <div className="p-6 md:w-[280px] flex flex-col gap-5 border-b md:border-b-0 md:border-r border-border shrink-0 bg-card relative">
                                                <div className="flex items-center gap-4">
                                                    <Link href={`/profile/${creator.id}`} className="relative">
                                                        <Avatar className="w-14 h-14 border-2 border-border group-hover:border-primary transition-colors">
                                                            <AvatarImage src={creator.avatar_url} />
                                                            <AvatarFallback>{creator.username?.[0]?.toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        {creator.is_online && (
                                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" title="在线"></div>
                                                        )}
                                                    </Link>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Link href={`/profile/${creator.id}`} className="font-bold text-lg text-foreground hover:text-primary transition-colors truncate">
                                                                {creator.full_name || creator.username}
                                                            </Link>
                                                            {creator.is_verified && (
                                                                <BadgeCheck className="w-4 h-4 text-amber-500" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-xs text-muted-foreground truncate">
                                                            {creator.location || '未知'}
                                                            <span className="mx-1">|</span>
                                                            {creator.job_title || '创作者'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-sm text-muted-foreground py-3 border-t border-b border-border">
                                                    <div className="text-center flex-1 border-r border-border">
                                                        <span className="text-foreground font-bold block text-lg mb-0.5">
                                                            {creator.views_count > 1000 ? (creator.views_count / 1000).toFixed(1) + 'k' : creator.views_count}
                                                        </span>
                                                        <span className="text-xs">人气</span>
                                                    </div>
                                                    <div className="text-center flex-1 border-r border-border">
                                                        <span className="text-foreground font-bold block text-lg mb-0.5">{creator.works_count || creator.recent_works?.length || 0}</span>
                                                        <span className="text-xs">作品</span>
                                                    </div>
                                                    <div className="text-center flex-1">
                                                        <span className="text-foreground font-bold block text-lg mb-0.5">{creator.followers_count || 0}</span>
                                                        <span className="text-xs">粉丝</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button 
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm"
                                                        onClick={() => handleFollow(creator.id)}
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-1.5" />
                                                        关注
                                                    </Button>
                                                    <Button 
                                                        variant="outline"
                                                        className="flex-1 border-input text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                                                    >
                                                        <MessageSquare className="w-4 h-4 mr-1.5" />
                                                        联系
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Right: Works */}
                                            <div className="flex-1 p-5 bg-muted/30 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center justify-between mb-4 px-1">
                                                    <span className="text-sm text-muted-foreground font-medium">Ta的作品</span>
                                                    <Link href={`/profile/${creator.id}`} className="text-xs text-primary hover:text-primary/80 flex items-center transition-colors">
                                                        查看全部 <span className="ml-0.5 text-[10px]">&gt;</span>
                                                    </Link>
                                                </div>
                                                
                                                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
                                                    {creator.recent_works && creator.recent_works.length > 0 ? (
                                                        creator.recent_works.map((work: any) => (
                                                            <Link 
                                                                href={`/video/${work.id}`} 
                                                                key={work.id} 
                                                                className="shrink-0 w-[200px] group/work snap-start"
                                                            >
                                                                <div className="aspect-video rounded-lg overflow-hidden relative bg-muted border border-border shadow-sm">
                                                                    {work.thumbnail_url ? (
                                                                        <img 
                                                                            src={work.thumbnail_url} 
                                                                            alt={work.title || 'video'} 
                                                                            className="w-full h-full object-cover group-hover/work:scale-105 transition-transform duration-500" 
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                                                            <Video className="w-8 h-8" />
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/work:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                                            <Video className="w-5 h-5 text-white fill-white" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <h4 className="text-sm text-muted-foreground mt-2 truncate group-hover/work:text-primary transition-colors px-1">
                                                                    {work.title || '无标题'}
                                                                </h4>
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <div className="w-full h-[112px] flex flex-col items-center justify-center text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                                                            <Video className="w-8 h-8 mb-2 opacity-50" />
                                                            <span className="text-xs">暂无作品</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                        
                        {!loading && creators.length === 0 && (
                            <div className="text-center py-20 text-muted-foreground">
                                没有找到符合条件的创作者
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    )
}
