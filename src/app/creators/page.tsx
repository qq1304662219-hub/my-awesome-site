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
import { CheckCircle, Trophy, MapPin, Users, Video, Search, MessageSquare, Plus, Filter } from "lucide-react"
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
        <main className="min-h-screen bg-[#020817] text-white">
            <Navbar />
            
            {/* Hero Section */}
            <section className="relative pt-24 pb-12 overflow-hidden border-b border-white/5">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
                <div className="container mx-auto px-4 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-blue-100 to-gray-400 bg-clip-text text-transparent">
                            优质创作者生态
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-6">
                            汇聚全球顶尖 AI 影像创作者，发现无限创意可能
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/certification">
                                <Button className="bg-blue-600 hover:bg-blue-700">
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
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <Input 
                                    placeholder="搜索创作者..." 
                                    className="bg-white/5 border-white/10 pl-10 text-white placeholder:text-gray-500 focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Creators Grid */}
                        {loading ? (
                            <div className="flex flex-col space-y-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-[240px] bg-white/5 animate-pulse rounded-xl" />
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
                                        <div className="flex flex-col md:flex-row bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/30 transition-all duration-300 group">
                                            {/* Left: Profile Info */}
                                            <div className="p-6 md:w-[280px] flex flex-col gap-5 border-b md:border-b-0 md:border-r border-white/10 shrink-0 bg-[#0f172a] relative">
                                                <div className="flex items-center gap-4">
                                                    <Link href={`/profile/${creator.id}`}>
                                                        <Avatar className="w-14 h-14 border-2 border-white/10 group-hover:border-blue-500 transition-colors">
                                                            <AvatarImage src={creator.avatar_url} />
                                                            <AvatarFallback>{creator.username?.[0]?.toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                    </Link>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <Link href={`/profile/${creator.id}`} className="font-bold text-lg text-white hover:text-blue-400 transition-colors truncate">
                                                                {creator.full_name || creator.username}
                                                            </Link>
                                                            {creator.is_verified && (
                                                                <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-500/20" />
                                                            )}
                                                        </div>
                                                        <div className="flex items-center text-xs text-gray-400 truncate">
                                                            {creator.location || '未知'}
                                                            <span className="mx-1">|</span>
                                                            {creator.job_title || '创作者'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-sm text-gray-400 py-3 border-t border-b border-white/5">
                                                    <div className="text-center flex-1 border-r border-white/5">
                                                        <span className="text-white font-bold block text-lg mb-0.5">{creator.works_count || 0}</span>
                                                        <span className="text-xs">创作</span>
                                                    </div>
                                                    <div className="text-center flex-1">
                                                        <span className="text-white font-bold block text-lg mb-0.5">{creator.followers_count || 0}</span>
                                                        <span className="text-xs">粉丝</span>
                                                    </div>
                                                </div>

                                                <Button 
                                                    className="w-full bg-[#F5B502] hover:bg-[#D9A102] text-black font-medium transition-colors"
                                                    onClick={() => handleFollow(creator.id)}
                                                >
                                                    立即咨询
                                                </Button>
                                            </div>

                                            {/* Right: Works */}
                                            <div className="flex-1 p-5 bg-black/20 min-w-0 flex flex-col justify-center">
                                                <div className="flex items-center justify-between mb-4 px-1">
                                                    <span className="text-sm text-gray-400 font-medium">Ta的作品</span>
                                                    <Link href={`/profile/${creator.id}`} className="text-xs text-blue-400 hover:text-blue-300 flex items-center transition-colors">
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
                                                                <div className="aspect-video rounded-lg overflow-hidden relative bg-gray-800 border border-white/5">
                                                                    {work.thumbnail_url ? (
                                                                        <img 
                                                                            src={work.thumbnail_url} 
                                                                            alt={work.title || 'video'} 
                                                                            className="w-full h-full object-cover group-hover/work:scale-105 transition-transform duration-500" 
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                                                                            <Video className="w-8 h-8" />
                                                                        </div>
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/work:opacity-100 transition-opacity flex items-center justify-center">
                                                                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                                            <Video className="w-5 h-5 text-white fill-white" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <h4 className="text-sm text-gray-300 mt-2 truncate group-hover/work:text-blue-400 transition-colors px-1">
                                                                    {work.title || '无标题'}
                                                                </h4>
                                                            </Link>
                                                        ))
                                                    ) : (
                                                        <div className="w-full h-[112px] flex flex-col items-center justify-center text-gray-500 bg-white/5 rounded-lg border border-dashed border-white/10">
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
                            <div className="text-center py-20 text-gray-500">
                                没有找到符合条件的创作者
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}
