'use client'

import { useAuthStore } from "@/store/useAuthStore"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Users, Video, LogOut, FileQuestion, GraduationCap, AlertTriangle, Wallet, CreditCard, LayoutDashboard, Settings, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AuthGuard } from "@/components/auth/AuthGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard requireAdmin>
      <AdminContent>{children}</AdminContent>
    </AuthGuard>
  )
}

function AdminContent({ children }: { children: React.ReactNode }) {
  const { profile } = useAuthStore()
  const pathname = usePathname()

  const navItems = [
    {
      name: "仪表盘",
      href: "/admin",
      icon: LayoutDashboard,
      show: true
    },
    {
      name: "视频审核",
      href: "/admin/videos",
      icon: Video,
      show: true // Everyone (admins) can see
    },
    {
      name: "创作者审核",
      href: "/admin/creators",
      icon: UserCheck,
      show: true
    },
    {
      name: "举报处理",
      href: "/admin/reports",
      icon: AlertTriangle,
      show: true
    },
    {
      name: "悬赏管理",
      href: "/admin/requests",
      icon: FileQuestion,
      show: true
    },
    {
      name: "充值审核",
      href: "/admin/payments",
      icon: Wallet,
      show: true
    },
    {
      name: "提现审核",
      href: "/admin/withdrawals",
      icon: CreditCard,
      show: true
    },
    {
      name: "课程管理",
      href: "/admin/courses",
      icon: GraduationCap,
      show: true
    },
    {
      name: "工单管理",
      href: "/admin/tickets",
      icon: FileQuestion,
      show: true
    },
    {
      name: "消息通知",
      href: "/admin/notifications",
      icon: AlertTriangle,
      show: true
    },
    {
      name: "团队管理",
      href: "/admin/users",
      icon: Users,
      show: true // Everyone (admins) can see
    },
    {
      name: "系统设置",
      href: "/admin/settings",
      icon: Settings,
      show: true
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision Admin
            </span>
          </Link>
          <div className="mt-2 px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded inline-block">
             {profile?.role === 'super_admin' ? '👑 超级管理员' : '🛡️ 管理员'}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-accent",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-accent">
              <LogOut className="h-4 w-4" />
              退出后台
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
