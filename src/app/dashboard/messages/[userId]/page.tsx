'use client'

import { useState, useEffect, useRef, use } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, ArrowLeft, Loader2, MoreVertical, Smile } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker, { Theme } from 'emoji-picker-react'

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
  const [showEmoji, setShowEmoji] = useState(false)
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

        // Notification for Message
        await supabase.from("notifications").insert({
            user_id: userId, // receiver
            actor_id: currentUser.id,
            type: "system",
            resource_id: currentUser.id,
            resource_type: "user",
            content: `给你发了一条私信: ${newMessage.trim().substring(0, 20)}${newMessage.trim().length > 20 ? '...' : ''}`,
            is_read: false
        });

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
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-[#0B1120]/80 backdrop-blur-md z-10"
      >
        <div className="flex items-center">
            <Link href="/dashboard/messages" className="mr-3 hover:bg-white/10 p-2 rounded-full transition-colors group">
                <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </Link>
            <Avatar className="w-10 h-10 border border-white/10 mr-3">
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback className="bg-blue-600/20 text-blue-200">
                    {otherUser?.full_name?.[0] || otherUser?.email?.[0]}
                </AvatarFallback>
            </Avatar>
            <div>
                <h2 className="font-semibold text-sm md:text-base">{otherUser?.full_name || otherUser?.email}</h2>
                <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${otherUser?.role === 'admin' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <p className="text-xs text-gray-400">
                        {otherUser?.role === 'admin' ? '管理员' : '在线'}
                    </p>
                </div>
            </div>
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
            <MoreVertical className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 animate-pulse">
                    <Send className="w-6 h-6 text-gray-600" />
                </div>
                <p>暂无消息，打个招呼吧！</p>
            </div>
        ) : (
            messages.map((msg, index) => {
                const isMe = msg.sender_id === currentUser.id
                return (
                    <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                        {!isMe && (
                             <Avatar className="w-8 h-8 border border-white/10 mr-2 mt-1 hidden md:block">
                                <AvatarImage src={otherUser?.avatar_url} />
                                <AvatarFallback className="bg-blue-600/20 text-blue-200 text-xs">
                                    {otherUser?.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <div 
                            className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                                isMe 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-[#1E293B] text-gray-200 rounded-bl-none border border-white/5'
                            }`}
                        >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                            <div className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-blue-200' : 'text-gray-500'} text-right`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </motion.div>
                )
            })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0B1120] border-t border-white/10">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="relative flex-1">
                <AnimatePresence>
                    {showEmoji && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-xl overflow-hidden border border-white/10"
                        >
                            <EmojiPicker 
                                theme={Theme.DARK} 
                                onEmojiClick={(e) => {
                                    setNewMessage(prev => prev + e.emoji)
                                    setShowEmoji(false)
                                }}
                                width={320}
                                height={400}
                                searchDisabled
                                skinTonesDisabled
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 z-10"
                    onClick={() => setShowEmoji(!showEmoji)}
                >
                    <Smile className="w-5 h-5" />
                </Button>
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息..."
                    className="pl-12 pr-4 bg-[#1E293B] border-white/10 focus:border-blue-500/50 min-h-[50px] py-3 rounded-xl"
                    disabled={sending}
                />
            </div>
            <Button 
                onClick={handleSend} 
                disabled={!newMessage.trim() || sending}
                className="h-[50px] w-[50px] rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/20"
            >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
        </div>
      </div>
    </div>
  )
}
