"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, History } from "lucide-react"
import { useRouter } from "next/navigation"

interface SearchInputProps {
  initialQuery?: string;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({ initialQuery = "", className, placeholder = "搜索素材...", autoFocus }: SearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [history, setHistory] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input 
            ref={inputRef}
            type="text" 
            placeholder={placeholder}
            value={query}
            autoFocus={autoFocus}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 w-full transition-all placeholder:text-gray-500"
        />
        {query && (
          <button 
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        
        {isOpen && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1f2e] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <span>搜索历史</span>
                    <button onClick={() => {
                        setHistory([])
                        localStorage.removeItem("search_history")
                    }} className="hover:text-red-400 transition-colors">清空</button>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {history.map((item, index) => (
                      <div 
                          key={index} 
                          className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-gray-300 group/item transition-colors"
                          onClick={() => {
                              setQuery(item)
                              handleSearch(item)
                          }}
                      >
                          <div className="flex items-center gap-2 truncate">
                              <History className="w-3 h-3 text-gray-500 shrink-0" />
                              <span className="truncate">{item}</span>
                          </div>
                          <button 
                              onClick={(e) => removeHistory(e, item)}
                              className="opacity-0 group-hover/item:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                          >
                              <X className="w-3 h-3" />
                          </button>
                      </div>
                  ))}
                </div>
            </div>
        )}
    </div>
  )
}
