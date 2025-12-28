"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Upload } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/" className="hover:text-white transition-colors">首页</Link>
            <Link href="#videos" className="hover:text-white transition-colors">浏览素材</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">我的作品</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0">
                <Upload className="mr-2 h-4 w-4" />
                上传素材
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
                登录
              </Button>
            </Link>
          </div>
      </div>
    </nav>
  );
}
