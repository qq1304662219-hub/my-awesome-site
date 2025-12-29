"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Upload, Menu, X, LogOut, User as UserIcon, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("已退出登录");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Video className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/" className="hover:text-white transition-colors font-semibold text-white">首页</Link>
            
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white transition-colors outline-none">
                    视频素材 <ChevronDown className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#0f172a] border-white/10 text-gray-300">
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">自然风光</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">城市建筑</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">科技未来</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">人物生活</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">抽象艺术</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">动物世界</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">情感表达</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer">商业职场</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/events" className="hover:text-white transition-colors">活动</Link>
            <Link href="/classroom" className="hover:text-white transition-colors">课堂</Link>
            <Link href="/models" className="hover:text-white transition-colors">大模型</Link>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
            <div className="relative group hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="搜索素材..." 
                    className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 w-48 transition-all focus:w-64"
                />
            </div>

            {user ? (
              <>
                 <Link href="/dashboard">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                      <Upload className="mr-2 h-4 w-4" />
                      上传作品
                    </Button>
                 </Link>
                 
                 <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                        <Avatar className="h-8 w-8 cursor-pointer border border-white/10 hover:border-white/30 transition-colors">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0f172a] border-white/10 text-gray-300 w-48">
                        <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push(`/profile/${user.id}`)}>
                            个人主页
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/dashboard')}>
                            作品管理
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/favorites')}>
                            我的收藏
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-red-500/20 hover:text-red-400 cursor-pointer text-red-400" onClick={handleSignOut}>
                            退出登录
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                 </DropdownMenu>
              </>
            ) : (
              <Link href="/auth">
                <Button size="sm" className="bg-white text-black hover:bg-gray-200 rounded-full font-semibold">
                  登录 / 注册
                </Button>
              </Link>
            )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#020817] border-b border-white/10 p-4 flex flex-col gap-4 shadow-xl">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-2">首页</Link>
            <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-2">帮助中心</Link>
            
            {user ? (
                <>
                    <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-2">我的作品</Link>
                    <Link href={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white py-2">个人主页</Link>
                    <Button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} variant="destructive" className="w-full mt-2">
                        退出登录
                    </Button>
                </>
            ) : (
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-white text-black hover:bg-gray-200">
                        登录 / 注册
                    </Button>
                </Link>
            )}
        </div>
      )}
    </nav>
  );
}
