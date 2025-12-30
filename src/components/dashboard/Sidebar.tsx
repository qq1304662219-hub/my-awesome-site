"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Film, 
  Wallet, 
  Settings, 
  Plus, 
  LogOut 
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase"

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile } = useAuthStore()

  const menuItems = [
    { id: 'overview', label: '仪表盘', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'videos', label: '作品管理', icon: Film, href: '/dashboard/videos' },
    { id: 'finance', label: '我的钱包 (FINAL)', icon: Wallet, href: '/dashboard/wallet-final' },
    { id: 'settings', label: '账号设置', icon: Settings, href: '/dashboard/settings' },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => {
      if (href === '/dashboard' && pathname === '/dashboard') return true
      if (href !== '/dashboard' && pathname.startsWith(href)) return true
      return false
  }

  return (
    <div className="flex flex-col h-full w-64 bg-[#050B14] border-r border-white/5">
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
      <div className="p-4 border-t border-white/5">
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
  )
}
