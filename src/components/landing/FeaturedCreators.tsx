"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ArrowRight, UserPlus, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

interface Creator {
    id: string
    full_name: string
    avatar_url: string
    bio: string
    is_verified: boolean
    video_count: number
    follower_count: number
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
                    const { count: videoCount } = await supabase
                        .from('videos')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', c.id)
                    
                    const { count: followerCount } = await supabase
                        .from('follows')
                        .select('*', { count: 'exact', head: true })
                        .eq('following_id', c.id)

                    return {
                        ...c,
                        video_count: videoCount || 0,
                        follower_count: followerCount || 0
                    }
                }))
                setCreators(creatorsWithStats)
            }
            setLoading(false)
        }
        
        fetchCreators()
    }, [])

    if (loading) return null;
    if (creators.length === 0) return null;

    return (
        <section className="container mx-auto px-4 py-12 border-t border-border">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">推荐创作者</h2>
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
                        className="group relative bg-card rounded-xl p-6 border border-border hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center text-center">
                            <Link href={`/profile/${creator.id}`} className="relative mb-4">
                                <Avatar className="h-20 w-20 border-2 border-border group-hover:border-blue-500/50 transition-colors">
                                    <AvatarImage src={creator.avatar_url} />
                                    <AvatarFallback>{creator.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                {creator.is_verified && (
                                    <div className="absolute bottom-0 right-0 bg-card rounded-full p-1">
                                        <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />
                                    </div>
                                )}
                            </Link>
                            
                            <Link href={`/profile/${creator.id}`}>
                                <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-blue-400 transition-colors">
                                    {creator.full_name || "Unknown"}
                                </h3>
                            </Link>
                            
                            <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">
                                {creator.bio || "这位创作者很神秘，还没有写简介。"}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                                <div>
                                    <span className="block text-white font-bold text-sm">{creator.video_count}</span>
                                    作品
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div>
                                    <span className="block text-white font-bold text-sm">{creator.follower_count}</span>
                                    粉丝
                                </div>
                            </div>

                            <Link href={`/profile/${creator.id}`} className="w-full">
                                <Button variant="secondary" className="w-full bg-white/5 hover:bg-blue-600 hover:text-white border border-white/10 transition-all duration-300">
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
