"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"

// Using standard inputs instead of missing shadcn components
const Checkbox = ({ id, ...props }: any) => (
    <input 
        type="checkbox" 
        id={id} 
        className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
        {...props} 
    />
)

const Label = ({ htmlFor, children, className }: any) => (
    <label htmlFor={htmlFor} className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
        {children}
    </label>
)

export function SidebarFilters() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const createQueryString = useCallback(
        (name: string, value: string, checked: boolean) => {
            const params = new URLSearchParams(searchParams.toString())
            const current = params.get(name)?.split(',').filter(Boolean) || []
            let newValues = []
            
            if (checked) {
                if (!current.includes(value)) newValues = [...current, value]
                else newValues = current
            } else {
                newValues = current.filter(v => v !== value)
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

    const handleChange = (name: string, value: string, checked: boolean) => {
        router.push(pathname + '?' + createQueryString(name, value, checked))
    }

    const isChecked = (name: string, value: string) => {
        const current = searchParams.get(name)?.split(',') || []
        return current.includes(value)
    }

    const clearFilters = () => {
        router.push(pathname)
    }

    return (
        <div className="space-y-8 pr-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg">筛选</h3>
                <button onClick={clearFilters} className="text-xs text-blue-400 hover:text-blue-300">重置</button>
            </div>

            {/* Resolution */}
            <div>
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider text-gray-500">分辨率</h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="res-4k" 
                            checked={isChecked('resolution', '4k')}
                            onChange={(e: any) => handleChange('resolution', '4k', e.target.checked)}
                        />
                        <Label htmlFor="res-4k" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">4K Ultra HD</Label>
                    </div>
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="res-1080" 
                            checked={isChecked('resolution', '1080p')}
                            onChange={(e: any) => handleChange('resolution', '1080p', e.target.checked)}
                        />
                        <Label htmlFor="res-1080" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">1080P Full HD</Label>
                    </div>
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="res-720" 
                            checked={isChecked('resolution', '720p')}
                            onChange={(e: any) => handleChange('resolution', '720p', e.target.checked)}
                        />
                        <Label htmlFor="res-720" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">720P HD</Label>
                    </div>
                </div>
            </div>
            
            {/* Duration */}
            <div>
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider text-gray-500">时长</h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="dur-short" 
                            checked={isChecked('duration', 'short')}
                            onChange={(e: any) => handleChange('duration', 'short', e.target.checked)}
                        />
                        <Label htmlFor="dur-short" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">0-10 秒</Label>
                    </div>
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="dur-med" 
                            checked={isChecked('duration', 'medium')}
                            onChange={(e: any) => handleChange('duration', 'medium', e.target.checked)}
                        />
                        <Label htmlFor="dur-med" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">10-30 秒</Label>
                    </div>
                     <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="dur-long" 
                            checked={isChecked('duration', 'long')}
                            onChange={(e: any) => handleChange('duration', 'long', e.target.checked)}
                        />
                        <Label htmlFor="dur-long" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">30 秒以上</Label>
                    </div>
                </div>
            </div>

            {/* Format */}
            <div>
                <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider text-gray-500">格式</h3>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="fmt-mp4" 
                            checked={isChecked('format', 'mp4')}
                            onChange={(e: any) => handleChange('format', 'mp4', e.target.checked)}
                        />
                        <Label htmlFor="fmt-mp4" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">MP4</Label>
                    </div>
                    <div className="flex items-center space-x-2 group">
                        <Checkbox 
                            id="fmt-mov" 
                            checked={isChecked('format', 'mov')}
                            onChange={(e: any) => handleChange('format', 'mov', e.target.checked)}
                        />
                        <Label htmlFor="fmt-mov" className="text-gray-400 group-hover:text-white cursor-pointer transition-colors">MOV</Label>
                    </div>
                </div>
            </div>
        </div>
    )
}