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
  MessageSquare
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
    { id: 'collections', label: '我的收藏', icon: FolderPlus, href: '/dashboard/collections' },
    { id: 'messages', label: '我的私信', icon: MessageSquare, href: '/dashboard/messages' },
    { id: 'finance', label: '财务中心', icon: Wallet, href: '/dashboard/wallet' },
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
          const { error } = await supabase
              .from('profiles')
              .update({ role: 'super_admin' }) // Ensure super_admin
              .eq('id', user.id)

          if (error) throw error

          toast.success("提权成功！正在刷新页面...")
          setTimeout(() => {
              window.location.reload()
          }, 1500)
      } catch (e: any) {
          toast.error("提权失败: " + e.message)
          console.error(e)
      }
  }

  const isActive = (href: string) => {
      if (href === '/dashboard' && pathname === '/dashboard') return true
      if (href !== '/dashboard' && pathname.startsWith(href)) return true
      return false
  }

  return (
    <>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-black/50 z-30 md:hidden"
                onClick={closeMobileMenu}
            />
        )}
        
        <div className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-[#050B14] border-r border-white/5 transition-transform duration-300 md:relative md:translate-x-0 flex flex-col",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
            // Adjust top position for mobile to account for navbar if needed, or z-index above it
            "top-16 md:top-0 h-[calc(100vh-4rem)] md:h-full"
        )}>
      {/* User Info */}
      <div className="p-6 flex flex-col items-center border-b border-white/5">
        <Avatar className="h-20 w-20 mb-4 border-2 border-blue-500/20">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-blue-600 text-xl">
            {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-white truncate max-w-full">
          {profile?.full_name || user?.email?.split('@')[0]}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {profile?.role === 'super_admin' ? '👑 超级管理员' : 
           profile?.role === 'admin' ? '🛡️ 管理员' : '✨ 创作者'}
        </p>
      </div>

      {/* Upload Button */}
      <div className="p-4">
        <Link href="/dashboard/upload">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-900/20">
            <Plus className="mr-2 h-4 w-4" />
            上传新作品
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1 py-4">
        {menuItems.map((item) => (
          <Link key={item.id} href={item.href}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start relative overflow-hidden",
                isActive(item.href)
                  ? "bg-white/5 text-blue-400 after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-blue-500" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("mr-3 h-4 w-4", isActive(item.href) ? "text-blue-400" : "text-gray-500")} />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/5 space-y-2">
        {/* Only show Force Admin if NOT admin */}
        {profile?.role !== 'super_admin' && (
            <Button 
                variant="ghost" 
                className="w-full justify-start text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10"
                onClick={handleForceAdmin}
            >
                <ShieldAlert className="mr-3 h-4 w-4" />
                一键提权 (Admin)
            </Button>
        )}

        <Button 
          variant="ghost"  
          className="w-full justify-start text-gray-500 hover:text-red-400 hover:bg-red-500/5"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-4 w-4" />
          退出登录
        </Button>
      </div>
    </div>
    </>
  )
}
