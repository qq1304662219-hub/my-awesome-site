"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center text-center px-4">
      <div className="space-y-6 max-w-md">
        {/* Glitch Effect Text */}
        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse select-none">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-white">页面迷失在数字宇宙中</h2>
        
        <p className="text-gray-400">
          您寻找的页面可能已被移动、删除，或者从未存在过。
          但别担心，AI 仍然在为您创造新的可能性。
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Home className="w-4 h-4" />
              返回首页
            </Button>
          </Link>
          <Link href="/explore">
            <Button variant="outline" className="border-white/10 hover:bg-white/10 gap-2">
              <Search className="w-4 h-4" />
              探索素材
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  )
}
