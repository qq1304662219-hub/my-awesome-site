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
                    { label: "真实感/摄影 (Realistic)", value: "Realistic" },
                    { label: "抽象/艺术 (Abstract)", value: "Abstract" },
                    { label: "3D渲染 (3D Render)", value: "3D" },
                ]} 
            />

            <FilterGroup 
                title="画面比例" 
                icon="📐" 
                paramName="ratio"
                items={[
                    { label: "横屏 (16:9)", value: "16:9" },
                    { label: "竖屏 (9:16)", value: "9:16" },
                    { label: "方屏 (1:1)", value: "1:1" },
                    { label: "宽屏 (21:9)", value: "21:9" },
                ]} 
            />

            <FilterGroup 
                title="分辨率" 
                icon="�️" 
                paramName="resolution"
                items={[
                    { label: "4K Ultra HD", value: "4k" },
                    { label: "1080P Full HD", value: "1080p" },
                    { label: "720P HD", value: "720p" },
                ]} 
            />

            <FilterGroup 
                title="帧率" 
                icon="⚡" 
                paramName="fps"
                items={[
                    { label: "60 FPS", value: "60" },
                    { label: "30 FPS", value: "30" },
                    { label: "24 FPS", value: "24" },
                ]} 
            />

            <FilterGroup 
                title="时长" 
                icon="⏱️" 
                paramName="duration"
                items={[
                    { label: "0-15秒", value: "short" },
                    { label: "15-60秒", value: "medium" },
                    { label: "60秒以上", value: "long" },
                ]} 
            />

            <FilterGroup 
                title="AI 模型" 
                icon="🤖" 
                paramName="model"
                items={[
                    { label: "Sora", value: "Sora" },
                    { label: "Runway Gen-2", value: "Runway" },
                    { label: "Pika Labs", value: "Pika" },
                    { label: "Midjourney", value: "Midjourney" },
                    { label: "Stable Video", value: "SVD" },
                ]} 
            />
        </div>
    )
}
