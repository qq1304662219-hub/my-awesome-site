"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard, 
  Film, 
  Heart, 
  Settings, 
  PlusCircle, 
  Clock, 
  MessageSquare,
  FileText,
  Package,
  Wallet
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

interface SidebarProps {
  currentView?: string
  onChangeView?: (view: string) => void
  className?: string
}

export function DashboardSidebar({ currentView, onChangeView, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { id: 'overview', label: '个人中心', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'videos', label: '我的作品', icon: Film, href: '/dashboard?view=videos' },
    { id: 'upload', label: '发布作品', icon: PlusCircle, href: '/dashboard?view=upload' },
    { id: 'favorites', label: '我的收藏', icon: Heart, href: '/dashboard?view=favorites' },
    { id: 'history', label: '浏览记录', icon: Clock, href: '/dashboard?view=history' },
    { id: 'messages', label: '消息通知', icon: MessageSquare, href: '/dashboard?view=messages' },
  ]

  const financeItems = [
    { id: 'orders', label: '我的订单', icon: Package, href: '/dashboard/orders' },
    { id: 'transactions', label: '交易记录', icon: Wallet, href: '/dashboard/transactions' },
    { id: 'tickets', label: '工单系统', icon: FileText, href: '/dashboard/tickets' },
  ]

  const handleNavigation = (item: any) => {
    // If we are on the dashboard page and have onChangeView (SPA mode)
    if (pathname === '/dashboard' && onChangeView && !item.href.startsWith('/dashboard/')) {
        // Parse view from href or use id
        const view = item.href.split('=')[1] || item.id
        if (view === 'dashboard') onChangeView('overview')
        else onChangeView(view)
    } else {
        // Direct navigation
        router.push(item.href)
    }
  }

  // Determine active state
  const isActive = (item: any) => {
    if (currentView) return currentView === item.id
    if (pathname === item.href) return true
    if (pathname === '/dashboard' && item.id === 'overview') return true
    return false
  }

  return (
    <div className={cn("pb-12 w-64 border-r border-white/10 bg-[#020817]/50 hidden lg:block h-full", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
            创作者中心
          </h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={isActive(item) ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive(item)
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                onClick={() => handleNavigation(item)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
                财务与服务
            </h2>
             <div className="space-y-1">
                {financeItems.map((item) => (
                  <Button
                    key={item.id}
                    variant={isActive(item) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive(item)
                        ? "bg-white/10 text-white hover:bg-white/20" 
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
                
                <Button 
                   variant="ghost" 
                   className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5"
                   onClick={() => router.push('/dashboard?view=settings')}
                >
                    <Settings className="mr-2 h-4 w-4" />
                    账号设置
                </Button>
             </div>
        </div>
      </div>
    </div>
  )
}
