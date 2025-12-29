"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"

export function SidebarFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())
            const current = params.get(name)?.split(',').filter(Boolean) || []
            let newValues = []
            
            // Toggle logic
            if (current.includes(value)) {
                newValues = current.filter(v => v !== value)
            } else {
                newValues = [...current, value]
            }
            
            if (newValues.length > 0) {
                params.set(name, newValues.join(','))
            } else {
                params.delete(name)
            }
            
            return params.toString()
        },
        [searchParams]
    )

    const toggleFilter = (name: string, value: string) => {
        router.push(pathname + '?' + createQueryString(name, value))
    }

    const isChecked = (name: string, value: string) => {
        const current = searchParams.get(name)?.split(',') || []
        return current.includes(value)
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    const FilterTag = ({ name, value, label }: { name: string, value: string, label: string }) => {
        const active = isChecked(name, value)
        return (
            <button
                onClick={() => toggleFilter(name, value)}
                className={`
                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${active 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'}
                `}
            >
                {label}
            </button>
        )
    }

    return (
        <div className="space-y-8 pr-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">筛选</h3>
                <button onClick={clearFilters} className="text-xs text-blue-400 hover:text-blue-300">重置</button>
            </div>

            {/* Resolution */}
            <div>
                <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider text-gray-500">分辨率</h3>
                <div className="flex flex-wrap gap-2">
                    <FilterTag name="resolution" value="4k" label="4K 超高清" />
                    <FilterTag name="resolution" value="1080p" label="1080P 全高清" />
                    <FilterTag name="resolution" value="720p" label="720P 高清" />
                </div>
            </div>
            
            {/* Duration */}
            <div>
                <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider text-gray-500">时长</h3>
                <div className="flex flex-wrap gap-2">
                    <FilterTag name="duration" value="short" label="0-10 秒" />
                    <FilterTag name="duration" value="medium" label="10-30 秒" />
                    <FilterTag name="duration" value="long" label="30 秒以上" />
                </div>
            </div>

            {/* Format */}
            <div>
                <h3 className="font-semibold text-white mb-3 text-sm uppercase tracking-wider text-gray-500">格式</h3>
                <div className="flex flex-wrap gap-2">
                    <FilterTag name="format" value="mp4" label="MP4" />
                    <FilterTag name="format" value="mov" label="MOV" />
                </div>
            </div>
        </div>
    )
}
