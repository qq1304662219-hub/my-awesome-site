"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowRight, UserPlus, BadgeCheck } from "lucide-react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface Creator {
    id: string
    full_name: string
    avatar_url: string
    bio: string
    is_verified: boolean
    verified_title?: string
    video_count: number
    follower_count: number
    views_count: number
    is_online?: boolean
}

export function FeaturedCreators() {
    const [creators, setCreators] = useState<Creator[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCreators = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, bio, is_verified')
                .eq('is_verified', true)
                .limit(4)
            
            if (data) {
                const creatorsWithStats = await Promise.all(data.map(async (c) => {
                    const { data: videos } = await supabase
                        .from('videos')
                        .select('views')
                        .eq('user_id', c.id)
                    
                    const videoCount = videos?.length || 0
                    const totalViews = videos?.reduce((sum, v) => sum + (v.views || 0), 0) || 0
                    
                    const { count: followerCount } = await supabase
                        .from('follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('following_id', c.id)

                    return {
                        ...c,
                        video_count: videoCount,
                        follower_count: followerCount || 0,
                        views_count: totalViews,
                        is_online: Math.random() > 0.7 // Mock online status
                    }
                }))
                setCreators(creatorsWithStats)
            }
            setLoading(false)
        }
        
        fetchCreators()
    }, [])

    if (loading) {
        return (
            <section className="container mx-auto px-4 py-20 border-t border-border">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">推荐创作者</h2>
                        <p className="text-muted-foreground text-sm">关注顶尖 AI 艺术家，获取最新灵感</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-card rounded-xl p-6 border border-border shadow-sm">
                            <div className="flex flex-col items-center">
                                <Skeleton className="h-20 w-20 rounded-full mb-4" />
                                <Skeleton className="h-4 w-24 mb-2" />
                                <Skeleton className="h-3 w-40 mb-4" />
                                <div className="flex gap-4 mb-6">
                                    <Skeleton className="h-8 w-12" />
                                    <Skeleton className="h-8 w-12" />
                                    <Skeleton className="h-8 w-12" />
                                </div>
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )
    }

    if (creators.length === 0) return null;

    return (
        <section className="container mx-auto px-4 py-20 border-t border-border">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">推荐创作者</h2>
                    <p className="text-muted-foreground text-sm">关注顶尖 AI 艺术家，获取最新灵感</p>
                </div>
                <Link href="/creators">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent gap-2">
                        全部创作者 <ArrowRight className="w-4 h-4" />
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {creators.map((creator, index) => (
                    <motion.div 
                        key={creator.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-card rounded-xl p-6 border border-border hover:border-border transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                        <div className="flex flex-col items-center text-center">
                            <Link href={`/profile/${creator.id}`} className="relative mb-4">
                                <Avatar className="h-20 w-20 border-2 border-border group-hover:border-blue-500/50 transition-colors">
                                    <AvatarImage src={creator.avatar_url} />
                                    <AvatarFallback>{creator.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                {creator.is_online && (
                                    <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card animate-pulse" title="在线"></div>
                                )}
                            </Link>

                            {creator.is_verified && (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] mb-3 font-medium">
                                    <BadgeCheck className="w-3 h-3" />
                                    <span>{creator.verified_title || "认证创作者"}</span>
                                </div>
                            )}
                            
                            <Link href={`/profile/${creator.id}`}>
                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-blue-400 transition-colors truncate px-2">
                                    {creator.full_name || "Unknown"}
                                </h3>
                            </Link>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                                {creator.bio || "这位创作者很神秘，还没有写简介。"}
                            </p>

                            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground mb-6 w-full">
                                <div className="text-center">
                                    <span className="block text-foreground font-bold text-sm mb-0.5">{(creator.views_count / 1000).toFixed(1)}k</span>
                                    人气
                                </div>
                                <div className="w-px h-8 bg-border"></div>
                                <div className="text-center">
                                    <span className="block text-foreground font-bold text-sm mb-0.5">{creator.video_count}</span>
                                    作品
                                </div>
                                <div className="w-px h-8 bg-border"></div>
                                <div className="text-center">
                                    <span className="block text-foreground font-bold text-sm mb-0.5">{creator.follower_count}</span>
                                    粉丝
                                </div>
                            </div>

                            <Link href={`/profile/${creator.id}`} className="w-full">
                                <Button variant="secondary" className="w-full bg-secondary/50 hover:bg-primary hover:text-primary-foreground border border-border hover:border-primary/20 transition-all duration-300">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    访问主页
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}
