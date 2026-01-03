"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
        router.push('/')
        return
    }
    fetchWithdrawals()
  }, [profile, router])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
            *,
            profiles:user_id (full_name, email, username)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWithdrawals(data || [])
    } catch (error) {
      console.error("Error fetching withdrawals:", error)
      toast.error("加载提现列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, amount: number) => {
    try {
        if (!confirm(`确认批准这笔 ¥${amount} 的提现吗？\n请确保已线下打款到用户的支付宝。`)) return

        const { error } = await supabase
            .from('withdrawals')
            .update({ status: 'approved' })
            .eq('id', id)

        if (error) throw error

        toast.success("提现已标记为批准")
        fetchWithdrawals()
    } catch (error: any) {
        console.error("Approve error:", error)
        toast.error("批准失败: " + error.message)
    }
  }

  const handleReject = async (id: string) => {
      try {
        const reason = prompt("请输入拒绝原因:")
        if (reason === null) return // Cancelled

        const { error } = await supabase.rpc('reject_withdrawal', {
            p_withdrawal_id: id,
            p_reason: reason || "管理员拒绝"
        })
        
        if (error) throw error

        // Notification
        const tx = withdrawals.find(t => t.id === id)
        if (tx) {
            await supabase.from('notifications').insert({
                user_id: tx.user_id,
                type: 'system',
                content: `您的 ¥${tx.amount} 提现申请被拒绝: ${reason || "管理员拒绝"}`,
                is_read: false
            })
        }

        toast.success("已拒绝并退款")
        fetchWithdrawals()
      } catch (error: any) {
        console.error("Reject error:", error)
        toast.error("操作失败: " + error.message)
      }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">提现审核</h1>
      
      {loading ? (
          <div className="flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : withdrawals.length === 0 ? (
          <div className="text-muted-foreground">暂无提现申请</div>
      ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                      <tr>
                          <th className="p-4">用户</th>
                          <th className="p-4">支付宝账号</th>
                          <th className="p-4">金额</th>
                          <th className="p-4">状态</th>
                          <th className="p-4">时间</th>
                          <th className="p-4">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                      {withdrawals.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                              <td className="p-4">
                                  <div className="font-medium text-foreground">{tx.profiles?.full_name || tx.profiles?.username || 'Unknown'}</div>
                                  <div className="text-xs text-muted-foreground">{tx.profiles?.email}</div>
                              </td>
                              <td className="p-4 font-mono text-primary">
                                {tx.alipay_account}
                              </td>
                              <td className="p-4 text-orange-500 font-bold">¥{tx.amount}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs ${
                                    tx.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                                    tx.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                    {tx.status === 'approved' ? '已打款' :
                                     tx.status === 'rejected' ? '已拒绝' : '待审核'}
                                </span>
                              </td>
                              <td className="p-4 text-muted-foreground">
                                  {new Date(tx.created_at).toLocaleString('zh-CN')}
                              </td>
                              <td className="p-4">
                                  {tx.status === 'pending' && (
                                      <div className="flex gap-2">
                                          <Button 
                                              size="sm" 
                                              className="bg-green-600 hover:bg-green-700 h-8 px-2 text-white"
                                              onClick={() => handleApprove(tx.id, tx.amount)}
                                              title="确认已打款"
                                          >
                                              <CheckCircle className="w-4 h-4 mr-1" /> 打款
                                          </Button>
                                          <Button 
                                              size="sm" 
                                              variant="destructive"
                                              className="h-8 px-2"
                                              onClick={() => handleReject(tx.id)}
                                              title="拒绝并退款"
                                          >
                                              <XCircle className="w-4 h-4 mr-1" /> 拒绝
                                          </Button>
                                      </div>
                                  )}
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
