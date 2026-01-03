"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Film, 
  Wallet, 
  Settings, 
  Plus, 
  LogOut,
  ShieldAlert,
  FolderPlus,
  MessageSquare,
  Download,
  BarChart3,
  X,
  Share2
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuthStore } from "@/store/useAuthStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

import { useUIStore } from "@/store/useUIStore"

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, setProfile } = useAuthStore()
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()

  // Close mobile menu when route changes
  useEffect(() => {
    closeMobileMenu()
  }, [pathname])

  // Double check role using RPC to bypass RLS cache issues
  useEffect(() => {
    const checkRole = async () => {
        if (!user) return
        const { data: realRole, error } = await supabase.rpc('get_my_role')
        
        if (realRole && realRole !== profile?.role) {
            console.log("Fixing role mismatch:", realRole)
            // If profile exists, update it. If not, fetch it first? 
            // If profile is null, we can't just set role.
            if (profile) {
                setProfile({ ...profile, role: realRole })
            } else {
                // Profile missing but role exists? Fetch full profile
                const { data: fullProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                if (fullProfile) {
                    setProfile({ ...fullProfile, role: realRole })
                }
            }
        }
    }
    checkRole()
  }, [user, profile?.role]) // Check whenever user or perceived role changes

  const menuItems = [
    { id: 'overview', label: '仪表盘', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'videos', label: '作品管理', icon: Film, href: '/dashboard/videos' },
    { id: 'analytics', label: '数据分析', icon: BarChart3, href: '/dashboard/analytics' },
    { id: 'collections', label: '我的收藏', icon: FolderPlus, href: '/dashboard/collections' },
    { id: 'downloads', label: '我的资产', icon: Download, href: '/dashboard/downloads' },
    { id: 'messages', label: '我的私信', icon: MessageSquare, href: '/dashboard/messages' },
    { id: 'finance', label: '我的钱包', icon: Wallet, href: '/dashboard/wallet' },
    { id: 'invite', label: '邀请有礼', icon: Share2, href: '/dashboard/invite' },
    { id: 'settings', label: '账号设置', icon: Settings, href: '/dashboard/settings' },
  ]

  // Add Admin Panel if user is admin
  if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      menuItems.push({ id: 'admin', label: '后台管理', icon: ShieldAlert, href: '/admin/videos' })
  }

  const handleSignOut = async () => {
    // 1. Clear local state immediately for UI responsiveness
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setProfile(null)
    
    // 2. Redirect immediately
    router.push('/')
    
    // 3. Perform network signout in background
    try {
        await supabase.auth.signOut()
    } catch (e) {
        console.error("Sign out error:", e)
    }
  }

  const handleForceAdmin = async () => {
      if (!user) return
      
      const confirm = window.confirm('⚠️ 确定要强制将当前账户提升为超级管理员吗？')
      if (!confirm) return

      try {
        const { error } = await supabase.from('profiles').update({ role: 'super_admin' }).eq('id', user.id)
        if (error) throw error
        toast.success('已提升为超级管理员，请刷新页面')
        window.location.reload()
      } catch (error: any) {
        toast.error('操作失败: ' + error.message)
      }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-card h-full border-r border-border flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Mobile Header (Close Button) */}
        <div className="md:hidden p-4 flex justify-end items-center border-b border-border/50">
           <span className="text-sm font-semibold mr-auto pl-2">菜单</span>
           <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
             <X className="h-5 w-5" />
           </Button>
        </div>

        {/* Create Button */}
        <div className="p-4 pb-2 pt-6 md:pt-4">
           <Link href="/dashboard/upload" onClick={() => closeMobileMenu()}>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Plus className="mr-2 h-4 w-4" />
                  发布作品
              </Button>
           </Link>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.id} href={item.href} onClick={() => closeMobileMenu()}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                    isActive 
                      ? "text-primary-foreground bg-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  {/* {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full" />
                  )} */}
                  <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="truncate">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* User Profile Mini Section */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                      {profile?.full_name || user?.user_metadata?.full_name || 'Creator'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                  </p>
              </div>
          </div>

          <div className="space-y-1">
               <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 text-xs"
                  onClick={handleSignOut}
              >
                  <LogOut className="mr-2 h-3 w-3" />
                  退出登录
              </Button>
              
              {/* Dev Helper */}
              <Button 
                  variant="ghost" 
                  className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-accent h-6 text-[10px]"
                  onClick={handleForceAdmin}
              >
                  <ShieldAlert className="mr-2 h-3 w-3" />
                  Dev: Force Admin
              </Button>
          </div>
        </div>
      </div>
    </>
  )
}
