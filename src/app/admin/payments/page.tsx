"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, profile } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Basic admin check (frontend only, backend should enforce RLS/API check)
    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
        router.push('/')
        return
    }
    fetchPendingTransactions()
  }, [profile, router])

  const fetchPendingTransactions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            profiles:user_id (full_name, email)
        `)
        .eq('type', 'recharge_pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("加载待审核列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, userId: string, amount: number) => {
    try {
        if (!confirm(`确认批准这笔 ¥${amount} 的充值吗？`)) return

        // Call RPC to confirm recharge (update balance and change transaction type)
        // We need a new RPC or update transaction + call balance update.
        // Let's use an API route for atomicity and security.
        
        const response = await fetch('/api/admin/approve-recharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ transactionId: id, userId, amount })
        })

        if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || 'Operation failed')
        }

        toast.success("充值已批准")
        fetchPendingTransactions()
    } catch (error: any) {
        console.error("Approve error:", error)
        toast.error("批准失败: " + error.message)
    }
  }

  const handleReject = async (id: string) => {
      try {
        if (!confirm("确定要拒绝这笔充值吗？")) return

        const { error } = await supabase
            .from('transactions')
            .update({ 
                type: 'recharge_rejected',
                description: `充值已拒绝`
            })
            .eq('id', id)
        
        if (error) throw error
        toast.success("已拒绝")
        fetchPendingTransactions()
      } catch (error: any) {
        console.error("Reject error:", error)
        toast.error("操作失败: " + error.message)
      }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">充值审核</h1>
      
      {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : transactions.length === 0 ? (
          <div className="text-muted-foreground">暂无待审核的充值申请</div>
      ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                          <th className="p-4">用户</th>
                          <th className="p-4">金额</th>
                          <th className="p-4">时间</th>
                          <th className="p-4">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                              <td className="p-4">
                                  <div className="font-medium text-foreground">{tx.profiles?.full_name || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground">{tx.profiles?.email}</div>
                              </td>
                              <td className="p-4 font-bold text-green-600 dark:text-green-500">¥{tx.amount}</td>
                              <td className="p-4 text-muted-foreground">{format(new Date(tx.created_at), "yyyy-MM-dd HH:mm")}</td>
                              <td className="p-4">
                                  <div className="flex gap-2">
                                      <Button 
                                          size="sm" 
                                          className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
                                          onClick={() => handleApprove(tx.id, tx.user_id, tx.amount)}
                                      >
                                          <CheckCircle className="w-4 h-4 mr-1" /> 批准
                                      </Button>
                                      <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => handleReject(tx.id)}
                                      >
                                          <XCircle className="w-4 h-4 mr-1" /> 拒绝
                                      </Button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  )
}
