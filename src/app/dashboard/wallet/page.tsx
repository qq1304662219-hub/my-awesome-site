'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'recharge' | 'purchase' | 'income' | 'withdrawal' | 'tip_sent' | 'tip_received'
  description: string
  created_at: string
}

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [balance, setBalance] = useState(0)
  
  // Recharge state
  const [isRechargeOpen, setIsRechargeOpen] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [rechargeSubmitting, setRechargeSubmitting] = useState(false)

  // Withdrawal state
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [alipayAccount, setAlipayAccount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch profile for balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setBalance(profile.balance || 0)
      }

      // Fetch transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setTransactions(data as Transaction[])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !alipayAccount) {
      toast.error('请填写完整信息')
      return
    }

    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的金额')
      return
    }

    if (amount > balance) {
      toast.error('余额不足')
      return
    }

    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        // Use RPC to handle withdrawal securely
        const { error } = await supabase.rpc('create_withdrawal', {
            p_amount: amount,
            p_alipay_account: alipayAccount
        })

        if (error) {
            toast.error('申请提交失败: ' + error.message)
        } else {
            toast.success('提现申请已提交，等待审核')
            setIsWithdrawOpen(false)
            setWithdrawAmount('')
            setAlipayAccount('')
            fetchData() // Refresh balance
        }
    }
    setSubmitting(false)
  }

  const handleRecharge = async () => {
    if (!rechargeAmount) {
      toast.error('请输入充值金额')
      return
    }

    const amount = parseFloat(rechargeAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('请输入有效的金额')
      return
    }

    setRechargeSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        // Use RPC to handle recharge atomically
        const { error } = await supabase.rpc('handle_recharge', {
            p_amount: amount
        })

        if (error) {
            toast.error('充值失败: ' + error.message)
            setRechargeSubmitting(false)
            return
        }

        toast.success(`成功充值 ¥${amount}`)
        setIsRechargeOpen(false)
        setRechargeAmount('')
        fetchData()
    }
    setRechargeSubmitting(false)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
        case 'recharge': return { label: '充值', color: 'text-green-400', icon: ArrowDownLeft }
        case 'income': return { label: '收益', color: 'text-green-400', icon: ArrowDownLeft }
        case 'purchase': return { label: '购买', color: 'text-red-400', icon: ArrowUpRight }
        case 'withdrawal': return { label: '提现', color: 'text-gray-400', icon: ArrowUpRight }
        default: return { label: '其他', color: 'text-gray-400', icon: Clock }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">财务中心</h1>
        <div className="flex gap-3">
            <Button onClick={() => setIsRechargeOpen(true)} className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.5)]">
                充值
            </Button>
            <Button onClick={() => setIsWithdrawOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                <Wallet className="h-4 w-4 mr-2" />
                提现
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">账户余额</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">¥ {balance.toFixed(2)}</div>
            </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">总收益</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">
                    ¥ {transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                </div>
            </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">已提现</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">
                    ¥ {transactions.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">交易明细</h2>
        <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-white/5 text-gray-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">时间</th>
                            <th className="px-6 py-4">类型</th>
                            <th className="px-6 py-4">描述</th>
                            <th className="px-6 py-4 text-right">金额</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {transactions.length > 0 ? (
                            transactions.map((t) => {
                                const { label, color, icon: Icon } = getTypeLabel(t.type)
                                const isPositive = t.type === 'recharge' || t.type === 'income'
                                return (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            {new Date(t.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-full bg-white/5 ${color}`}>
                                                    <Icon className="h-3 w-3" />
                                                </div>
                                                <span className={color}>{label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {t.description || '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-medium ${isPositive ? 'text-green-400' : 'text-white'}`}>
                                            {isPositive ? '+' : '-'}{Math.abs(t.amount).toFixed(2)}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    暂无交易记录
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="bg-[#1a202c] border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>提现</DialogTitle>
                <DialogDescription className="text-gray-400">
                    提现金额将转入您指定的支付宝账户，预计 1-3 个工作日到账。
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">提现金额 (元)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400">¥</span>
                        <Input 
                            id="amount" 
                            type="number"
                            min="0.1"
                            max={balance}
                            value={withdrawAmount} 
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="bg-black/20 border-white/10 pl-7"
                            placeholder={`可提现余额: ${balance.toFixed(2)}`}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="alipay">支付宝账号</Label>
                    <Input 
                        id="alipay" 
                        value={alipayAccount} 
                        onChange={(e) => setAlipayAccount(e.target.value)}
                        className="bg-black/20 border-white/10"
                        placeholder="请输入支付宝账号/手机号"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsWithdrawOpen(false)} className="border-white/10 hover:bg-white/10 text-white">取消</Button>
                <Button onClick={handleWithdraw} disabled={submitting} className="bg-red-600 hover:bg-red-700 text-white">
                    {submitting ? '提交中...' : '确认提现'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="bg-[#1a202c] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>账户充值</DialogTitle>
            <DialogDescription className="text-gray-400">
              充值金额将立即到账，可用于购买视频素材或打赏。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recharge-amount">充值金额 (元)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400">¥</span>
                <Input
                  id="recharge-amount"
                  type="number"
                  min="1"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="bg-black/20 border-white/10 pl-7 text-white"
                  placeholder="请输入充值金额"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {[10, 50, 100, 500].map((amt) => (
                    <Button
                        key={amt}
                        variant="outline"
                        onClick={() => setRechargeAmount(amt.toString())}
                        className={`border-white/10 ${rechargeAmount === amt.toString() ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        ¥{amt}
                    </Button>
                ))}
            </div>
          </div>
          <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => setIsRechargeOpen(false)}
                className="border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
            >
                取消
            </Button>
            <Button 
                onClick={handleRecharge} 
                disabled={rechargeSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
              {rechargeSubmitting ? '充值中...' : '确认充值'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
