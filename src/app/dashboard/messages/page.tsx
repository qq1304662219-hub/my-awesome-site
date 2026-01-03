'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2, MessageSquare, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Conversation {
  userId: string
  user: any
  lastMessage: any
  unreadCount: number
}

export default function MessagesList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch last 200 messages to construct conversation list
    // Ideally this should be a view or RPC
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const convMap = new Map<string, Conversation>()

    messages.forEach((msg: any) => {
      const isMe = msg.sender_id === user.id
      const otherId = isMe ? msg.receiver_id : msg.sender_id
      
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId: otherId,
          user: null, // to be fetched
          lastMessage: msg,
          unreadCount: 0
        })
      }
      
      const conv = convMap.get(otherId)!
      if (!isMe && !msg.is_read) {
        conv.unreadCount++
      }
    })

    const convArray = Array.from(convMap.values())

    // Fetch user profiles
    if (convArray.length > 0) {
      const userIds = convArray.map(c => c.userId)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)
      
      if (profiles) {
        const profileMap = new Map(profiles.map(p => [p.id, p]))
        convArray.forEach(c => {
          c.user = profileMap.get(c.userId)
        })
      }
    }

    setConversations(convArray)
    setLoading(false)
  }

  const filteredConversations = conversations.filter(conv => 
    conv.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage?.content?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen w-full">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-4xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            我的私信
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理您的所有对话和消息
          </p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜索对话..." 
            className="pl-9 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="bg-card border border-border rounded-xl overflow-hidden backdrop-blur-sm min-h-[500px]">
        {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium text-foreground/50 mb-2">暂无消息记录</p>
                <p className="text-sm text-muted-foreground">
                   {searchQuery ? "没有找到匹配的对话" : "当有人给您发消息时，它们会显示在这里"}
                </p>
            </div>
        ) : (
            <div className="divide-y divide-border">
                <AnimatePresence>
                  {filteredConversations.map((conv, index) => (
                      <motion.div
                        key={conv.userId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link 
                            href={`/dashboard/messages/${conv.userId}`}
                            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-all group relative overflow-hidden"
                        >
                            {/* Hover Highlight */}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="relative">
                              <Avatar className="w-12 h-12 border border-border group-hover:border-primary/50 transition-colors">
                                  <AvatarImage src={conv.user?.avatar_url} />
                                  <AvatarFallback className="bg-primary/20 text-primary">
                                    {conv.user?.full_name?.[0] || conv.user?.email?.[0]?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                              </Avatar>
                              {conv.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center border border-background">
                                    {conv.unreadCount}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                        {conv.user?.full_name || conv.user?.email || '未知用户'}
                                    </h3>
                                    <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80">
                                        {new Date(conv.lastMessage.created_at).toLocaleDateString() === new Date().toLocaleDateString() 
                                          ? new Date(conv.lastMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                          : new Date(conv.lastMessage.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className={`text-sm truncate max-w-[85%] ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {conv.lastMessage.sender_id === conv.userId ? '' : <span className="text-primary/70 mr-1">我:</span>}
                                        {conv.lastMessage.content}
                                    </p>
                                </div>
                            </div>
                        </Link>
                      </motion.div>
                  ))}
                </AnimatePresence>
            </div>
        )}
      </div>
    </motion.div>
  )
}
