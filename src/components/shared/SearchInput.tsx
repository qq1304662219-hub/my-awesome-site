"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Search, X, History, Video } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface SearchInputProps {
  initialQuery?: string;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  autoFocus?: boolean;
  showIcon?: boolean;
}

export interface SearchInputHandle {
  search: () => void;
}

export const SearchInput = forwardRef<SearchInputHandle, SearchInputProps>(({ 
  initialQuery = "", 
  className, 
  inputClassName,
  placeholder = "搜索素材...", 
  autoFocus,
  showIcon = true 
}, ref) => {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [history, setHistory] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    search: () => handleSearch(query)
  }))

  useEffect(() => {
    const saved = localStorage.getItem("search_history")
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to parse search history", e)
      }
    }
  }, [])

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([])
        return
      }

      const { data } = await supabase
        .from('videos')
        .select('id, title')
        .ilike('title', `%${query}%`)
        .limit(5)
      
      if (data) {
        setSuggestions(data)
      }
    }

    const timer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (text: string) => {
    if (!text.trim()) return
    
    // Update history
    const newHistory = [text, ...history.filter(h => h !== text)].slice(0, 5)
    setHistory(newHistory)
    localStorage.setItem("search_history", JSON.stringify(newHistory))
    
    setIsOpen(false)
    router.push(`/explore?q=${encodeURIComponent(text)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(query)
    }
  }

  const removeHistory = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    const newHistory = history.filter(h => h !== item)
    setHistory(newHistory)
    localStorage.setItem("search_history", JSON.stringify(newHistory))
  }

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
        {showIcon && <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />}
        <input 
            ref={inputRef}
            type="text" 
            placeholder={placeholder}
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className={`bg-secondary/50 hover:bg-secondary border border-border rounded-full py-1.5 ${showIcon ? 'pl-9' : 'pl-4'} pr-4 text-sm focus:outline-none focus:border-primary w-full transition-all placeholder:text-muted-foreground ${inputClassName}`}
        />
        {query && (
          <button 
            onClick={() => {
              setQuery("")
              setSuggestions([])
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        
        {isOpen && (history.length > 0 || suggestions.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                {suggestions.length > 0 && (
                  <div className="border-b border-border pb-2">
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                      相关视频
                    </div>
                    {suggestions.map((video) => (
                      <div 
                        key={video.id}
                        className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer flex items-center gap-2 transition-colors"
                        onClick={() => {
                          setIsOpen(false)
                          router.push(`/video/${video.id}`)
                        }}
                      >
                        <Video className="w-3 h-3 text-primary" />
                        <span className="truncate">{video.title}</span>
                      </div>
                    ))}
                  </div>
                )}

                {history.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border flex justify-between items-center bg-muted/30">
                        <span>搜索历史</span>
                        <button onClick={() => {
                            setHistory([])
                            localStorage.removeItem("search_history")
                        }} className="hover:text-destructive transition-colors">
                            清空
                        </button>
                    </div>
                    {history.map((item, index) => (
                        <div 
                            key={index}
                            className="px-3 py-2 text-sm text-foreground hover:bg-accent cursor-pointer flex justify-between items-center group/item transition-colors"
                            onClick={() => handleSearch(item)}
                        >
                            <div className="flex items-center gap-2">
                                <History className="w-3 h-3 text-muted-foreground" />
                                <span>{item}</span>
                            </div>
                            <button 
                                onClick={(e) => removeHistory(e, item)}
                                className="opacity-0 group-hover/item:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-all"
                                title="删除此记录"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                  </div>
                )}
            </div>
        )}
    </div>
  )
})

SearchInput.displayName = "SearchInput"
