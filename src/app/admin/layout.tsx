'use client'

import { useAuthStore } from "@/store/useAuthStore"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Users, Video, LogOut } from "lucide-react"
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
      name: "视频审核",
      href: "/admin/videos",
      icon: Video,
      show: true // Everyone (admins) can see
    },
    {
      name: "团队管理",
      href: "/admin/users",
      icon: Users,
      show: profile?.role === 'super_admin' // Only Super Admin
    }
  ]

  return (
    <div className="min-h-screen bg-[#020817] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0B1120] flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-white/10">
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
                    "w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5",
                    isActive && "bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 hover:text-blue-300"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <Link href="/">
            <Button variant="ghost" className="w-full justify-start gap-3 text-gray-400 hover:text-white hover:bg-white/5">
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
