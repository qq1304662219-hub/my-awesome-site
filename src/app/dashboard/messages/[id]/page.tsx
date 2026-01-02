"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Send, ArrowLeft, MoreVertical, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  email: string
}

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const otherUserId = params.id as string

  useEffect(() => {
    if (!user) return
    
    // Check if chatting with self
    if (user.id === otherUserId) {
        toast.error("不能给自己发消息")
        router.push("/dashboard/messages")
        return
    }

    fetchUserProfile()
    fetchMessages()
    subscribeToMessages()
    markAsRead()

    return () => {
      supabase.removeAllChannels()
    }
  }, [user, otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .eq('id', otherUserId)
      .single()

    if (error) {
      console.error("Error fetching user:", error)
      toast.error("用户不存在")
      router.push("/dashboard/messages")
      return
    }
    setOtherUser(data)
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error("Error fetching messages:", error)
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  const subscribeToMessages = () => {
    supabase
      .channel(`chat:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}` // Listen for messages sent TO me
        },
        (payload) => {
          if (payload.new.sender_id === otherUserId) {
            setMessages(prev => [...prev, payload.new as Message])
            // Mark as read immediately if looking at this chat
            markAsRead() 
          }
        }
      )
      .subscribe()
  }

  const markAsRead = async () => {
    if (!user) return
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', user.id)
      .eq('is_read', false)
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    setSending(true)
    const content = newMessage.trim()
    setNewMessage("") // Optimistic clear

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: otherUserId,
          content: content
        })
        .select()
        .single()

      if (error) throw error

      setMessages(prev => [...prev, data])
      
      // Send notification if not already handled by trigger
      // (Optional, depending on DB triggers)
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("发送失败")
      setNewMessage(content) // Restore on error
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-black">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0B1120]">
        <div className="flex items-center gap-3">
            <Link href="/dashboard/messages">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src={otherUser?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                        {otherUser?.full_name?.[0] || otherUser?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="font-semibold text-sm md:text-base">
                        {otherUser?.full_name || otherUser?.email}
                    </h2>
                    {otherUser?.email && (
                        <p className="text-xs text-gray-500 hidden md:block">{otherUser.email}</p>
                    )}
                </div>
            </div>
        </div>
        <Button variant="ghost" size="icon" className="text-gray-400">
            <MoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
        {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <Send className="h-8 w-8 text-gray-400" />
                </div>
                <p>开始对话</p>
            </div>
        ) : (
            messages.map((msg, index) => {
                const isMe = msg.sender_id === user?.id
                const showTime = index === 0 || 
                    new Date(msg.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000

                return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        {showTime && (
                            <div className="w-full text-center my-4">
                                <span className="text-xs text-gray-600 bg-white/5 px-2 py-1 rounded-full">
                                    {new Date(msg.created_at).toLocaleString([], {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}
                        <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            <Avatar className="h-8 w-8 mt-1 border border-white/10 flex-shrink-0">
                                <AvatarImage src={isMe ? user?.user_metadata?.avatar_url : otherUser?.avatar_url} />
                                <AvatarFallback className={`${isMe ? 'bg-blue-600' : 'bg-gray-700'} text-xs`}>
                                    {isMe ? '我' : otherUser?.full_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            
                            <div className={`group relative px-4 py-2 rounded-2xl text-sm break-words ${
                                isMe 
                                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                                    : 'bg-[#1e293b] text-gray-200 rounded-tl-sm border border-white/5'
                            }`}>
                                {msg.content}
                                <div className={`text-[10px] mt-1 opacity-50 flex items-center gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {isMe && (
                                        <span>{msg.is_read ? '已读' : '未读'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/10 bg-[#0B1120]">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto">
            <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50"
                disabled={sending}
            />
            <Button 
                type="submit" 
                size="icon" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newMessage.trim() || sending}
            >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
        </form>
      </div>
    </div>
  )
}
