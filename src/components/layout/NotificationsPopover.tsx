"use client"

import { useState, useEffect } from "react"
import { Bell, Heart, MessageCircle, UserPlus, Info, CheckCheck, Video } from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import { useRouter, usePathname } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Notification {
  id: number
  type: 'like' | 'comment' | 'reply' | 'follow' | 'system' | 'new_video'
  actor_id: string
  resource_id?: string
  resource_type?: string
  content?: string
  is_read: boolean
  created_at: string
  actor?: {
    full_name: string
    avatar_url: string
  }
}

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const fetchUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error && count !== null) {
      setUnreadCount(count)
    }
  }

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id (
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setNotifications(data as any)
      // Also fetch total unread count
      fetchUnreadCount()
    }
  }

  useEffect(() => {
    let channel: any
    let interval: any

    const setupSubscription = async (userId: string) => {
      // Clean up existing channel if any
      if (channel) supabase.removeChannel(channel)

      // Initial fetch
      fetchNotifications()

      // Realtime subscription
      channel = supabase
        .channel('notifications_popover')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          () => {
            fetchNotifications()
            toast.info("收到新通知")
          }
        )
        .subscribe()
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setupSubscription(session.user.id)
      } else {
        setNotifications([])
        setUnreadCount(0)
        if (channel) supabase.removeChannel(channel)
      }
    })

    // Polling fallback (every 60s)
    interval = setInterval(() => {
      fetchUnreadCount()
    }, 60000)

    return () => {
      subscription.unsubscribe()
      if (channel) supabase.removeChannel(channel)
      if (interval) clearInterval(interval)
    }
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if needed
    if (!notification.is_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id)
      
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
    
    setIsOpen(false)

    // Navigate based on resource type
    // This assumes you have routes set up like /video/[id], /profile/[id], etc.
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'reply':
        if (notification.resource_id) {
            router.push(`/video/${notification.resource_id}`)
        }
        break
      case 'new_video':
        if (notification.resource_id) {
            router.push(`/video/${notification.resource_id}`)
        }
        break
      case 'follow':
        if (notification.actor_id) {
            router.push(`/profile/${notification.actor_id}`)
        }
        break
      case 'system':
        // Navigate to notifications page for system messages
        router.push('/notifications')
        break
    }
  }

  const markAllAsRead = async () => {
    if (unreadCount === 0) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success("已全部标记为已读")
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="h-3 w-3 text-red-600 dark:text-red-500 fill-red-600 dark:fill-red-500" />
      case 'comment': return <MessageCircle className="h-3 w-3 text-blue-600 dark:text-blue-500 fill-blue-600 dark:fill-blue-500" />
      case 'reply': return <MessageCircle className="h-3 w-3 text-green-600 dark:text-green-500 fill-green-600 dark:fill-green-500" />
      case 'follow': return <UserPlus className="h-3 w-3 text-green-600 dark:text-green-500" />
      case 'new_video': return <Video className="h-3 w-3 text-purple-600 dark:text-purple-500" />
      case 'system': return <Info className="h-3 w-3 text-yellow-600 dark:text-yellow-500" />
      default: return <Bell className="h-3 w-3 text-muted-foreground" />
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "relative transition-colors",
            pathname === '/notifications' ? "text-foreground bg-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-card border-border" align="end">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h4 className="font-medium text-foreground">通知</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground" onClick={markAllAsRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              全部已读
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Bell className="h-8 w-8 opacity-20" />
              暂无通知
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 cursor-pointer transition-colors relative ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {!notification.is_read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  <div className="flex gap-3 pl-2">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={notification.actor?.avatar_url} />
                        <AvatarFallback>{notification.actor?.full_name?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-card rounded-full p-0.5 border border-border">
                            {getIcon(notification.type)}
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        <span className="font-medium text-foreground">{notification.actor?.full_name || "有人"}</span>
                        {" "}
                        {notification.type === 'like' && "赞了你的作品"}
                        {notification.type === 'comment' && "评论了你的作品"}
                        {notification.type === 'reply' && "回复了你的评论"}
                        {notification.type === 'follow' && "关注了你"}
                        {notification.type === 'new_video' && "发布了新视频"}
                        {notification.type === 'system' && "系统通知"}
                      </p>
                      {notification.content && (
                        <p className="text-xs text-muted-foreground line-clamp-2 bg-muted p-2 rounded border border-border">
                          "{notification.content}"
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border text-center">
            <Button variant="ghost" size="sm" className="w-full text-xs text-primary hover:text-primary/80" onClick={() => { setIsOpen(false); router.push('/notifications'); }}>
                查看所有通知
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
