"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { motion } from "framer-motion"

export function SidebarFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            // Single select per group: replace the value
            if (params.get(name) === value) {
                // If clicking the same value, clear it (toggle off)
                params.delete(name)
            } else {
                params.set(name, value)
            }
            return params.toString()
        },
        [searchParams]
    )

    const toggleFilter = (name: string, value: string) => {
        router.push(pathname + '?' + createQueryString(name, value))
    }

    const isChecked = (name: string, value: string) => {
        return searchParams.get(name) === value
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    const FilterGroup = ({ title, icon, items, paramName }: { title: string, icon: string, items: { label: string, value: string }[], paramName: string }) => (
        <div className="mb-8">
            <h3 className="flex items-center gap-2 font-bold text-white text-base mb-4 px-2">
                <span>{icon}</span>
                <span>{title}</span>
            </h3>
            <div className="space-y-1">
                {items.map((item) => {
                    const active = isChecked(paramName, item.value)
                    return (
                        <button
                            key={item.value}
                            onClick={() => toggleFilter(paramName, item.value)}
                            className={`
                                w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200
                                ${active 
                                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border-l-2 border-blue-500' 
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white border-l-2 border-transparent'}
                            `}
                        >
                            <div className="flex justify-between items-center">
                                <span>{item.label}</span>
                                {active && <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )

    return (
        <div className="space-y-2 pr-4 pb-20">
            <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="font-bold text-white text-lg tracking-tight">筛选分类</h2>
                <button 
                    onClick={clearFilters} 
                    className="text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10"
                >
                    重置全部
                </button>
            </div>

            <FilterGroup 
                title="场景用途" 
                icon="📂" 
                paramName="category"
                items={[
                    { label: "直播背景 (Live)", value: "Live" },
                    { label: "电商短视频 (Commerce)", value: "Commerce" },
                    { label: "游戏/CG (Game)", value: "Game" },
                    { label: "动态壁纸 (Wallpaper)", value: "Wallpaper" },
                ]} 
            />

            <FilterGroup 
                title="视觉风格" 
                icon="🎨" 
                paramName="style"
                items={[
                    { label: "赛博/科幻 (Sci-Fi)", value: "Sci-Fi" },
                    { label: "国潮/古风 (Chinese)", value: "Chinese" },
                    { label: "二次元/动漫 (Anime)", value: "Anime" },
                    { label: "超写实 (Realistic)", value: "Realistic" },
                    { label: "粒子/抽象 (Abstract)", value: "Abstract" },
                ]} 
            />

            <FilterGroup 
                title="AI 模型" 
                icon="🤖" 
                paramName="model"
                items={[
                    { label: "Midjourney", value: "Midjourney" },
                    { label: "Runway", value: "Runway" },
                    { label: "Pika", value: "Pika" },
                    { label: "Sora", value: "Sora" },
                    { label: "Stable Diffusion", value: "Stable Diffusion" },
                    { label: "DALL·E 3", value: "DALL·E 3" },
                ]} 
            />

            <FilterGroup 
                title="视频比例" 
                icon="📐" 
                paramName="ratio"
                items={[
                    { label: "横屏 16:9", value: "16:9" },
                    { label: "竖屏 9:16", value: "9:16" },
                ]} 
            />

            <FilterGroup 
                title="分辨率" 
                icon="🖥️" 
                paramName="resolution"
                items={[
                    { label: "4K / Ultra HD", value: "4K" },
                    { label: "1080p / Full HD", value: "1080p" },
                    { label: "720p / HD", value: "720p" },
                ]} 
            />

            <FilterGroup 
                title="时长" 
                icon="⏱️" 
                paramName="duration"
                items={[
                    { label: "短视频 (<15s)", value: "short" },
                    { label: "中长视频 (15s-60s)", value: "medium" },
                    { label: "长视频 (>60s)", value: "long" },
                ]} 
            />
        </div>
    )
}
