"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { DashboardSidebar } from "@/components/dashboard/Sidebar"
import { Loader2, ArrowUpRight, ArrowDownLeft, Wallet } from "lucide-react"
import { format } from "date-fns"

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  created_at: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) return
    fetchTransactions()
  }, [user])

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen bg-black">
      <DashboardSidebar />
      
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
            <Wallet className="text-blue-500" />
            交易记录
          </h1>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
              <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">暂无交易记录</p>
            </div>
          ) : (
            <div className="bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 text-sm border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-medium">时间</th>
                    <th className="px-6 py-4 font-medium">类型</th>
                    <th className="px-6 py-4 font-medium">描述</th>
                    <th className="px-6 py-4 font-medium text-right">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        {format(new Date(tx.created_at), "yyyy-MM-dd HH:mm:ss")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${
                          tx.amount >= 0 
                            ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                            : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {tx.amount >= 0 ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {tx.type === 'recharge' ? '充值' : 
                           tx.type === 'purchase' ? '消费' : 
                           tx.type === 'refund' ? '退款' : 
                           tx.type === 'income' ? '收入' : tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">
                        {tx.description || '-'}
                      </td>
                      <td className={`px-6 py-4 text-right font-mono font-medium ${
                        tx.amount >= 0 ? 'text-green-500' : 'text-white'
                      }`}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}