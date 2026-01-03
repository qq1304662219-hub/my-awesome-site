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
import { useCartStore } from "@/store/useCartStore";
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
import { ModeToggle } from "@/components/shared/ModeToggle";

export function Navbar({ simple = false, showMobileMenu = true }: { simple?: boolean; showMobileMenu?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, profile, setProfile } = useAuthStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const { count: cartCount, fetchCartCount } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user, fetchCartCount]);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    toast.success("已退出登录");
    router.refresh();
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path));
    return cn(
      "transition-colors font-medium text-sm",
      isActive ? "text-foreground font-bold" : "text-muted-foreground hover:text-foreground"
    );
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="AI Vision Home">
            <Video className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent">
              AI Vision
            </span>
          </Link>
          
          {/* Desktop Nav - Only show if not simple mode */}
          {!simple && (
            <div className="hidden md:flex items-center gap-6">
              <Link href="/discover" className={getLinkClass('/discover')}>发现</Link>
              <Link 
                href="/creators" 
                className={cn(
                  "transition-colors font-semibold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent",
                  pathname === '/creators' ? "opacity-100" : "opacity-80 hover:opacity-100"
                )}
              >
                创作者
              </Link>
              <Link href="/explore" className={getLinkClass('/explore')}>素材</Link>
              <Link href="/events" className={getLinkClass('/events')}>活动</Link>
              <Link href="/requests" className={getLinkClass('/requests')}>悬赏任务</Link>
              <Link href="/classroom" className={getLinkClass('/classroom')}>课堂</Link>
              <Link href="/models" className={getLinkClass('/models')}>大模型</Link>
            </div>
          )}
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-4">
            <ModeToggle />

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
                      <Link id="u-balance" href="/dashboard/wallet" className={cn("hidden md:flex flex-col items-end mr-2 cursor-pointer transition-colors", pathname?.startsWith('/dashboard/wallet') ? "opacity-100" : "opacity-70 hover:opacity-100")}>
                        <span className={cn("text-xs", pathname?.startsWith('/dashboard/wallet') ? "text-foreground font-bold" : "text-muted-foreground")}>余额</span>
                        <span className={cn("text-sm font-bold", pathname?.startsWith('/dashboard/wallet') ? "text-foreground" : "text-muted-foreground")}>
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
                        <Button size="sm" variant="outline" className={cn("hidden md:flex gap-2", pathname?.startsWith('/admin') ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>
                          <span>🛡️</span>
                          管理后台
                        </Button>
                      </Link>
                    )}
                    
                    <UserHoverMenu user={user} profile={profile} onSignOut={handleSignOut} />
                    
                    <Link href="/cart" className="relative group">
                        <Button variant="ghost" size="icon" className={cn("transition-colors", pathname === '/cart' ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground")}>
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-background">
                                {cartCount > 99 ? '99+' : cartCount}
                              </span>
                            )}
                        </Button>
                    </Link>

                    <div className={cn("transition-colors", pathname === '/notifications' ? "text-foreground" : "text-muted-foreground")}>
                      <NotificationsPopover />
                    </div>
                 </div>
              </>
            ) : (
                <div className="flex items-center gap-3">
                    <Link href="/auth?tab=login">
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-accent">
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

        {/* Mobile Menu Button & Search */}
        <div className="md:hidden flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} aria-label="搜索">
                <Search className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu} aria-label="Toggle menu">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background p-4 border-b border-border animate-in slide-in-from-top-2 duration-200 z-40">
           <SearchInput className="w-full" autoFocus />
        </div>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background/95 backdrop-blur-sm z-50 overflow-y-auto">
            <div className="flex flex-col p-4 gap-2">
                <Link href="/" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">首页</Link>
                <Link href="/discover" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">发现</Link>
                <Link 
                    href="/creators" 
                    onClick={closeMobileMenu} 
                    className="py-3 px-4 hover:bg-accent rounded-lg transition-colors font-semibold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent"
                >
                    创作者
                </Link>
                <Link href="/explore" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">素材</Link>
                <Link href="/events" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">活动</Link>
                <Link href="/requests" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">悬赏任务</Link>
                <Link href="/classroom" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">课堂</Link>
                <Link href="/models" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg transition-colors font-medium">大模型</Link>
                
                <div className="h-px bg-border my-2" />

                {user ? (
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-4 pb-2">
                            <Avatar className="h-10 w-10 border border-border">
                                <AvatarImage src={user.user_metadata?.avatar_url} />
                                <AvatarFallback>{user.email?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                                <span className="text-foreground font-medium truncate">{user.email}</span>
                                <span className="text-xs text-yellow-500 font-medium">余额: {profile?.balance ? `¥${profile.balance}` : "¥0"}</span>
                            </div>
                        </div>
                        <Link href="/dashboard" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg flex items-center">
                            <Upload className="w-5 h-5 mr-3" /> 上传作品
                        </Link>
                        <Link href="/cart" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-3" /> 购物车
                        </Link>
                        {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                            <Link href="/admin/videos" onClick={closeMobileMenu} className="text-red-500 hover:text-red-600 py-3 px-4 hover:bg-accent rounded-lg flex items-center">
                                <span className="w-5 h-5 mr-3 flex items-center justify-center">🛡️</span> 管理后台
                            </Link>
                        )}
                        <Link href={`/profile/${user.id}`} onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg flex items-center">
                            <UserIcon className="w-5 h-5 mr-3" /> 个人主页
                        </Link>
                        <Link href="/settings" onClick={closeMobileMenu} className="text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg flex items-center">
                            <span className="w-5 h-5 mr-3" /> 账号设置
                        </Link>
                        <button onClick={() => { handleSignOut(); closeMobileMenu(); }} className="text-left text-muted-foreground hover:text-foreground py-3 px-4 hover:bg-accent rounded-lg w-full flex items-center">
                            <LogOut className="w-5 h-5 mr-3" /> 退出登录
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pt-2">
                        <Link href="/auth?tab=login" onClick={closeMobileMenu}>
                            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground hover:bg-accent justify-start h-12 text-base px-4">
                                登录
                            </Button>
                        </Link>
                        <Link href="/auth?tab=register" onClick={closeMobileMenu}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start h-12 text-base px-4">
                                注册
                            </Button>
                        </Link>
                    </div>
                )}
                <div className="h-20" /> {/* Spacer for bottom safe area */}
            </div>
        </div>
      )}
    </nav>
  );
}
