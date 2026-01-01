'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader2 } from 'lucide-react'

interface Conversation {
  userId: string
  user: any
  lastMessage: any
  unreadCount: number
}

export default function MessagesList() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
        <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">我的私信</h1>
      
      <div className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden">
        {conversations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
                <p>暂无消息记录</p>
            </div>
        ) : (
            <div className="divide-y divide-white/5">
                {conversations.map((conv) => (
                    <Link 
                        key={conv.userId} 
                        href={`/dashboard/messages/${conv.userId}`}
                        className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                    >
                        <Avatar className="w-12 h-12 border border-white/10">
                            <AvatarImage src={conv.user?.avatar_url} />
                            <AvatarFallback>{conv.user?.full_name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors truncate">
                                    {conv.user?.full_name || conv.user?.email || '未知用户'}
                                </h3>
                                <span className="text-xs text-gray-500">
                                    {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-400 truncate max-w-[80%]">
                                    {conv.lastMessage.sender_id === conv.userId ? '' : '我: '}
                                    {conv.lastMessage.content}
                                </p>
                                {conv.unreadCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {conv.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}
