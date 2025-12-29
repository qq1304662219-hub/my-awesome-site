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
  FileText
} from "lucide-react"

interface SidebarProps {
  currentView: string
  onChangeView: (view: string) => void
  className?: string
}

export function DashboardSidebar({ currentView, onChangeView, className }: SidebarProps) {
  const menuItems = [
    { id: 'overview', label: '个人中心', icon: LayoutDashboard },
    { id: 'videos', label: '我的作品', icon: Film },
    { id: 'upload', label: '发布作品', icon: PlusCircle },
    { id: 'favorites', label: '我的收藏', icon: Heart },
    { id: 'history', label: '浏览记录', icon: Clock },
    { id: 'messages', label: '消息通知', icon: MessageSquare },
    { id: 'settings', label: '账号设置', icon: Settings },
  ]

  return (
    <div className={cn("pb-12 w-64 border-r border-white/10 bg-[#020817]/50 hidden lg:block", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
            创作者中心
          </h2>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={currentView === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  currentView === item.id 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
                onClick={() => onChangeView(item.id)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className="px-3 py-2">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-white">
                其他
            </h2>
             <div className="space-y-1">
                 <Button variant="ghost" className="w-full justify-start text-gray-400 hover:text-white hover:bg-white/5">
                    <FileText className="mr-2 h-4 w-4" />
                    工单
                 </Button>
             </div>
        </div>
      </div>
    </div>
  )
}
