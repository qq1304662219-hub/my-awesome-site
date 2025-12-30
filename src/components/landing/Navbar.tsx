"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Upload, Menu, X, LogOut, User as UserIcon, ChevronDown, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { UserHoverMenu } from "@/components/landing/UserHoverMenu";

export function Navbar({ simple = false }: { simple?: boolean }) {
  const router = useRouter();
  const { user, setUser, profile, setProfile } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
        setProfile(data);
    }
  };

  useEffect(() => {
    // Check initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      if (event === 'SIGNED_OUT') {
        router.refresh()
      }
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
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Video className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision
            </span>
          </Link>
          
          {/* Desktop Nav - Only show if not simple mode */}
          {!simple && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
              <Link href="/explore" className="hover:text-white transition-colors font-semibold text-white">发现</Link>
              
              <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white transition-colors outline-none">
                    视频分类 <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#1a1f2e] border-white/10 text-gray-300">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">场景用途</div>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=Live')}>直播背景</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=E-commerce')}>电商短视频</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=Game')}>游戏/CG</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=Wallpaper')}>动态壁纸</DropdownMenuItem>
                    
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t border-white/10 mt-1 pt-2">视觉风格</div>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Cyberpunk')}>赛博/科幻</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Chinese')}>国潮/古风</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Anime')}>二次元/动漫</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Realistic')}>超写实</DropdownMenuItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t border-white/10 mt-1 pt-2">视频比例</div>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?ratio=16:9')}>横屏 16:9</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?ratio=9:16')}>竖屏 9:16</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/events" className="hover:text-white transition-colors">活动</Link>
              <Link href="/requests" className="hover:text-white transition-colors">悬赏任务</Link>
              <Link href="/classroom" className="hover:text-white transition-colors">课堂</Link>
              <Link href="/models" className="hover:text-white transition-colors">大模型</Link>
            </div>
          )}
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
            {!simple && (
              <div className="relative group hidden lg:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                      type="text" 
                      placeholder="搜索素材..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearch}
                      className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 w-48 transition-all focus:w-64"
                  />
              </div>
            )}

            {user ? (
              <>
                 <div className="flex items-center gap-4">
                    {/* Balance Display */}
                    {!simple && (
                      <Link id="u-balance" href="/dashboard/wallet-final" className="hidden md:flex flex-col items-end mr-2 cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-xs text-gray-400">余额</span>
                <span className="text-sm font-bold text-yellow-400">
                  {profile?.balance ? `¥${profile.balance}` : "¥0"}
                </span>
              </Link>
                    )}

                    {!simple && (
                      <Link href="/dashboard">
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full">
                          <Upload className="mr-2 h-4 w-4" />
                          上传作品
                          </Button>
                      </Link>
                    )}

                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                      <Link href="/admin/videos">
                        <Button size="sm" variant="destructive" className="hidden md:flex">
                          <span className="mr-2">🛡️</span>
                          管理后台
                        </Button>
                      </Link>
                    )}
                    
                    <UserHoverMenu user={user} profile={profile} onSignOut={handleSignOut} />
                 </div>
              </>
            ) : (
                <div className="flex items-center gap-3">
                    <Link href="/auth?tab=login">
                        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                            登录
                        </Button>
                    </Link>
                    <Link href="/auth?tab=register">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
                            注册
                        </Button>
                    </Link>
                </div>
            )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#020817] border-b border-white/10 p-4 flex flex-col gap-2 shadow-xl animate-in slide-in-from-top-5 duration-200">
            <Link href="/" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-md transition-colors">首页</Link>
            <Link href="/explore?category=All" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-md transition-colors">视频素材</Link>
            <Link href="/requests" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-md transition-colors">悬赏任务</Link>
            <Link href="/events" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-md transition-colors">活动</Link>
            <Link href="/classroom" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-md transition-colors">课堂</Link>
            <Link href="/models" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-3 px-2 border-b border-white/5 hover:bg-white/5 rounded-md transition-colors">大模型</Link>
            
            {user ? (
                <div className="pt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-2 pb-2">
                        <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-white font-medium truncate max-w-[200px]">{user.email}</span>
                            <span className="text-xs text-yellow-400">余额: {profile?.balance ? `¥${profile.balance}` : "¥0"}</span>
                        </div>
                    </div>
                    <Link href="/dashboard" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-2 px-2 hover:bg-white/5 rounded-md">
                        <Upload className="inline w-4 h-4 mr-2" /> 上传作品
                    </Link>
                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                        <Link href="/admin/videos" onClick={closeMobileMenu} className="text-red-400 hover:text-red-300 py-2 px-2 hover:bg-white/5 rounded-md">
                            <span className="inline-block w-4 h-4 mr-2 text-center">🛡️</span> 管理后台
                        </Link>
                    )}
                    <Link href={`/profile/${user.id}`} onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-2 px-2 hover:bg-white/5 rounded-md">
                        <UserIcon className="inline w-4 h-4 mr-2" /> 个人主页
                    </Link>
                    <Button onClick={() => { handleSignOut(); closeMobileMenu(); }} variant="destructive" className="w-full mt-2">
                        退出登录
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                    <Link href="/auth?tab=login" onClick={closeMobileMenu}>
                        <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/10">
                            登录
                        </Button>
                    </Link>
                    <Link href="/auth?tab=register" onClick={closeMobileMenu}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            注册
                        </Button>
                    </Link>
                </div>
            )}
        </div>
      )}
    </nav>
  );
}
