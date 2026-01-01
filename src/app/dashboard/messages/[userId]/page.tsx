'use client'

import { useState, useEffect, useRef, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Message {
  id: number
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

export default function ChatPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // 1. Get Current User
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth?tab=login')
        return
      }
      setCurrentUser(user)

      // 2. Get Other User Profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        toast.error('用户不存在')
        router.push('/dashboard')
        return
      }
      setOtherUser(profile)

      // 3. Fetch Messages
      fetchMessages(user.id)

      // 4. Subscribe to Realtime
      const channel = supabase
        .channel('chat_room')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`,
          },
          (payload) => {
             if (payload.new.sender_id === userId) {
                setMessages((prev) => [...prev, payload.new as Message])
                scrollToBottom()
                // Mark as read
                markAsRead(payload.new.id)
             }
          }
        )
        .subscribe()

      setLoading(false)

      return () => {
        supabase.removeChannel(channel)
      }
    }

    init()
  }, [userId, router])

  const fetchMessages = async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
    } else {
      setMessages(data || [])
      scrollToBottom()
      // Mark unread messages from other user as read
      const unreadIds = data
        ?.filter(m => m.sender_id === userId && !m.is_read)
        .map(m => m.id) || []
      
      if (unreadIds.length > 0) {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadIds)
      }
    }
  }

  const markAsRead = async (messageId: number) => {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
  }

  const scrollToBottom = () => {
    setTimeout(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, 100)
  }

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser) return
    setSending(true)

    try {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: userId,
                content: newMessage.trim()
            })
            .select()
            .single()

        if (error) throw error

        setMessages((prev) => [...prev, data])
        setNewMessage('')
        scrollToBottom()
    } catch (error) {
        console.error('Error sending message:', error)
        toast.error('发送失败')
    } finally {
        setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSend()
      }
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#020817]">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#020817] text-white">
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center px-4 bg-[#0B1120]">
        <Link href="/dashboard/messages" className="mr-4 hover:bg-white/10 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <Avatar className="w-10 h-10 border border-white/10 mr-3">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback>{otherUser?.full_name?.[0] || otherUser?.email?.[0]}</AvatarFallback>
        </Avatar>
        <div>
            <h2 className="font-semibold">{otherUser?.full_name || otherUser?.email}</h2>
            <p className="text-xs text-gray-400">
                {otherUser?.role === 'admin' ? '管理员' : '在线'}
            </p>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>暂无消息，打个招呼吧！</p>
            </div>
        ) : (
            messages.map((msg) => {
                const isMe = msg.sender_id === currentUser.id
                return (
                    <div 
                        key={msg.id} 
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${
                                isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-[#1E293B] text-gray-200 rounded-bl-none'
                            }`}
                        >
                            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-blue-200' : 'text-gray-500'} text-right`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                )
            })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0B1120] border-t border-white/10">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="relative flex-1">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    className="bg-black/20 border-white/10 text-white pr-10 min-h-[44px]"
                />
            </div>
            <Button 
                onClick={handleSend} 
                disabled={sending || !newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 h-[44px] w-[44px] p-0 rounded-lg"
            >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
        </div>
      </div>
    </div>
  )
}
