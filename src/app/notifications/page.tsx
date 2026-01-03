"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/landing/Navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Bell, MessageSquare, Heart, Video, CheckCheck, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface Notification {
  id: string
  created_at: string
  type: 'comment' | 'reply' | 'like' | 'follow' | 'system' | 'new_video'
  content: string
  is_read: boolean
  resource_id: string
  resource_type: string
  actor_id: string
  actor: {
    full_name: string
    avatar_url: string
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    checkAuth()

    // Realtime subscription
    const channel = supabase
      .channel('notifications_page')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          if (currentUser && payload.new.user_id === currentUser.id) {
            fetchNotifications(currentUser.id)
            toast.info("收到新通知")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/auth")
      return
    }
    setCurrentUser(user)
    fetchNotifications(user.id)
  }

  const fetchNotifications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id (
            full_name,
            avatar_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("获取通知失败")
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!currentUser) return
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', currentUser.id)
        .eq('is_read', false)

      if (error) throw error
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      toast.success("已全部标记为已读")
    } catch (error) {
      console.error("Error marking all as read:", error)
      toast.error("操作失败")
    }
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success("通知已删除")
    } catch (error) {
      console.error("Error deleting notification:", error)
      toast.error("删除失败")
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
      case 'like':
        return <Heart className="h-5 w-5 text-red-500 dark:text-red-400" />
      case 'follow':
        return <Video className="h-5 w-5 text-purple-500 dark:text-purple-400" /> // Using Video icon for now as UserPlus might not be imported
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />
    }
  }

  const getLink = (notification: Notification) => {
    switch (notification.resource_type) {
      case 'video':
        return `/video/${notification.resource_id}`
      case 'user':
        return `/profile/${notification.resource_id}`
      default:
        return '#'
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 pt-24 pb-16 flex-1 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            通知中心
          </h1>
          
          {notifications.some(n => !n.is_read) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
              className="border-border hover:bg-muted"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              全部已读
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">加载中...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-xl border border-border">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无新通知</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Link 
                href={getLink(notification)} 
                key={notification.id}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className={`
                  group relative flex gap-4 p-4 rounded-xl border transition-all duration-200
                  ${notification.is_read 
                    ? 'bg-card/50 border-border opacity-80 hover:opacity-100' 
                    : 'bg-card border-blue-500/30 shadow-lg shadow-blue-500/5'
                  }
                  hover:border-border
                `}>
                  <div className="flex-shrink-0 mt-1">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={notification.actor?.avatar_url} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 pr-8">
                      <span className="font-semibold text-sm text-blue-500 dark:text-blue-400">
                        {notification.actor?.full_name || "Unknown User"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhCN })}
                      </span>
                    </div>
                    
                    <p className="text-foreground text-sm line-clamp-2">
                      {notification.content}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      {getIcon(notification.type)}
                      <span className="capitalize">
                        {notification.type === 'comment' && '评论了你的视频'}
                        {notification.type === 'reply' && '回复了你的评论'}
                        {notification.type === 'like' && '点赞了你的内容'}
                        {notification.type === 'follow' && '关注了你'}
                        {notification.type === 'new_video' && '发布了新视频'}
                        {notification.type === 'system' && '系统通知'}
                      </span>
                    </div>
                  </div>

                  {/* Delete Action */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-red-500"
                      onClick={(e) => deleteNotification(notification.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {!notification.is_read && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full group-hover:opacity-0 transition-opacity" />
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
