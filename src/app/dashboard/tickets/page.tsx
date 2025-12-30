"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Loader2, MessageCircle, Clock, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

interface Ticket {
  id: string
  subject: string
  message: string
  status: string
  reply: string
  created_at: string
  updated_at: string
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    fetchTickets()
  }, [user])

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error("Error fetching tickets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">待处理</Badge>
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">处理中</Badge>
      case 'closed':
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">已结单</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="flex h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <MessageCircle className="text-blue-500" />
            工单记录
          </h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">暂无工单记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="bg-[#0f172a] border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{ticket.subject}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>ID: {ticket.id.slice(0, 8)}</span>
                        <span>{format(new Date(ticket.created_at), "yyyy-MM-dd HH:mm")}</span>
                      </div>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 mb-4 text-gray-300 text-sm whitespace-pre-wrap">
                    {ticket.message}
                  </div>

                  {ticket.reply && (
                    <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mb-2">
                        <MessageCircle className="w-4 h-4" />
                        客服回复
                      </div>
                      <div className="text-gray-300 text-sm whitespace-pre-wrap">
                        {ticket.reply}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}