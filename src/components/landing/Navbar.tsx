"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Video, Upload, Menu, X, LogOut, User as UserIcon, ChevronDown, Search, ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { useI18n } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { NotificationsPopover } from "@/components/layout/NotificationsPopover";
import { UserHoverMenu } from "@/components/landing/UserHoverMenu";
import { SearchInput } from "@/components/shared/SearchInput";

export function Navbar({ simple = false, showMobileMenu = true }: { simple?: boolean; showMobileMenu?: boolean }) {
  const router = useRouter();
  const { user, setUser, profile, setProfile } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const { t, locale, setLocale } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success(t.auth.sign_out_success);
    router.refresh();
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#020817]/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="AI Vision Home">
            <Video className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision
            </span>
          </Link>
          
          {/* Desktop Nav - Only show if not simple mode */}
          {!simple && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
              <Link href="/explore" className="hover:text-white transition-colors font-semibold text-white">{t.nav.explore}</Link>
              
              <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 hover:text-white transition-colors outline-none">
                    {t.nav.categories} <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#1a1f2e] border-white/10 text-gray-300">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">{t.categories.scene}</div>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=Live')}>{t.categories.live_bg}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=E-commerce')}>{t.categories.ecommerce}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=Game')}>{t.categories.game}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?category=Wallpaper')}>{t.categories.wallpaper}</DropdownMenuItem>
                    
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t border-white/10 mt-1 pt-2">{t.categories.style}</div>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Cyberpunk')}>{t.categories.cyberpunk}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Chinese')}>{t.categories.chinese}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Anime')}>{t.categories.anime}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?style=Realistic')}>{t.categories.realistic}</DropdownMenuItem>

                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t border-white/10 mt-1 pt-2">{t.categories.ratio}</div>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?ratio=16:9')}>{t.categories.horizontal}</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-white/10 hover:text-white cursor-pointer" onClick={() => router.push('/explore?ratio=9:16')}>{t.categories.vertical}</DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>

              <Link href="/events" className="hover:text-white transition-colors">{t.nav.events}</Link>
              <Link href="/requests" className="hover:text-white transition-colors">{t.nav.requests}</Link>
              <Link href="/classroom" className="hover:text-white transition-colors">{t.nav.classroom}</Link>
              <Link href="/models" className="hover:text-white transition-colors">{t.nav.models}</Link>
            </div>
          )}
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
            {/* Language Switcher */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
                className="text-gray-400 hover:text-white"
            >
                {locale === 'zh' ? 'EN' : '中'}
            </Button>

            {!simple && (
              <div className="hidden lg:block">
                  <SearchInput className="w-48 focus-within:w-64 transition-all" />
              </div>
            )}

            {user ? (
              <>
                 <div className="flex items-center gap-4">
                    {/* Balance Display */}
                    {!simple && (
                      <Link id="u-balance" href="/dashboard/wallet" className="hidden md:flex flex-col items-end mr-2 cursor-pointer hover:opacity-80 transition-opacity">
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
                          {t.nav.upload}
                          </Button>
                      </Link>
                    )}

                    {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                      <Link href="/admin/videos">
                        <Button size="sm" variant="destructive" className="hidden md:flex">
                          <span className="mr-2">🛡️</span>
                          {t.nav.admin}
                        </Button>
                      </Link>
                    )}
                    
                    <UserHoverMenu user={user} profile={profile} onSignOut={handleSignOut} />
                    
                    <Link href="/cart" className="relative group">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <ShoppingCart className="h-5 w-5" />
                        </Button>
                    </Link>

                    <NotificationsPopover />
                 </div>
              </>
            ) : (
                <div className="flex items-center gap-3">
                    <Link href="/auth?tab=login">
                        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                            {t.nav.login}
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

        {/* Mobile Menu Button & Search */}
        <div className="md:hidden flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} aria-label={t.common.search}>
                <Search className="h-5 w-5 text-gray-300" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle menu">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-[#020817] p-4 border-b border-white/10 animate-in slide-in-from-top-2 duration-200 z-40">
           <SearchInput className="w-full" autoFocus />
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && isMobileMenuOpen && (
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
                    <Link href="/settings" onClick={closeMobileMenu} className="text-gray-300 hover:text-white py-2 px-2 hover:bg-white/5 rounded-md">
                        账号设置
                    </Link>
                    <button onClick={() => { handleSignOut(); closeMobileMenu(); }} className="text-left text-gray-300 hover:text-white py-2 px-2 hover:bg-white/5 rounded-md w-full">
                        <LogOut className="inline w-4 h-4 mr-2" /> 退出登录
                    </button>
                </div>
            ) : (
                <div className="pt-4 flex flex-col gap-3">
                    <Link href="/auth?tab=login" onClick={closeMobileMenu}>
                        <Button variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10 justify-start">
                            登录
                        </Button>
                    </Link>
                    <Link href="/auth?tab=register" onClick={closeMobileMenu}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start">
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
