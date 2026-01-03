'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CreditCard, PieChart } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

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
  
  // Recharge state - Moved to /recharge page
  // const [isRechargeOpen, setIsRechargeOpen] = useState(false)
  // const [rechargeAmount, setRechargeAmount] = useState('')
  // const [rechargeSubmitting, setRechargeSubmitting] = useState(false)

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

  // const handleRecharge = async () => {
  //   if (!rechargeAmount) {
  //     toast.error('请输入充值金额')
  //     return
  //   }
  //
  //   const amount = parseFloat(rechargeAmount)
  //   if (isNaN(amount) || amount <= 0) {
  //     toast.error('请输入有效的金额')
  //     return
  //   }
  //
  //   setRechargeSubmitting(true)
  //   const { data: { user } } = await supabase.auth.getUser()
  //   
  //   if (user) {
  //       // Use RPC to handle recharge atomically
  //       const { error } = await supabase.rpc('handle_recharge', {
  //           p_amount: amount
  //       })
  //
  //       if (error) {
  //           toast.error('充值失败: ' + error.message)
  //           setRechargeSubmitting(false)
  //           return
  //       }
  //
  //       toast.success(`成功充值 ¥${amount}`)
  //       setIsRechargeOpen(false)
  //       setRechargeAmount('')
  //       fetchData()
  //   }
  //   setRechargeSubmitting(false)
  // }

  const getTypeLabel = (type: string) => {
    switch (type) {
        case 'recharge': return { label: '充值', color: 'text-emerald-600 dark:text-emerald-500', icon: ArrowDownLeft }
        case 'income': return { label: '收益', color: 'text-emerald-600 dark:text-emerald-500', icon: ArrowDownLeft }
        case 'purchase': return { label: '购买', color: 'text-destructive', icon: ArrowUpRight }
        case 'withdrawal': return { label: '提现', color: 'text-orange-600 dark:text-orange-500', icon: ArrowUpRight }
        case 'tip_sent': return { label: '打赏', color: 'text-destructive', icon: ArrowUpRight }
        case 'tip_received': return { label: '获赏', color: 'text-emerald-600 dark:text-emerald-500', icon: ArrowDownLeft }
        default: return { label: '其他', color: 'text-muted-foreground', icon: Clock }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 space-y-8 min-h-screen bg-background text-foreground"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">我的钱包</h1>
          <p className="text-muted-foreground mt-1">管理您的收益、充值与提现记录</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <Link href="/recharge" className="flex-1 md:flex-none">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    充值
                </Button>
            </Link>
            <Button 
                onClick={() => setIsWithdrawOpen(true)} 
                variant="outline"
                className="flex-1 md:flex-none border-border hover:bg-secondary text-foreground transition-all hover:scale-105"
            >
                <Wallet className="h-4 w-4 mr-2" />
                提现
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    账户余额
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-4xl font-bold text-foreground">¥ {balance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">当前可用资金</p>
            </CardContent>
        </Card>
        
        <Card className="bg-card border-border backdrop-blur-sm overflow-hidden relative group hover:border-green-500/30 transition-colors">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-green-600 dark:text-green-500" />
                    总收益
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-foreground">
                    ¥ {transactions.filter(t => t.type === 'income' || t.type === 'tip_received').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">含创作收益与打赏</p>
            </CardContent>
        </Card>

        <Card className="bg-card border-border backdrop-blur-sm overflow-hidden relative group hover:border-orange-500/30 transition-colors">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                    已提现
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-foreground">
                    ¥ {transactions.filter(t => t.type === 'withdrawal').reduce((acc, t) => acc + Number(t.amount), 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">累计提现金额</p>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            交易明细
        </h2>
        <Card className="bg-card border-border backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-secondary/50 text-foreground uppercase font-medium border-b border-border">
                        <tr>
                            <th className="px-6 py-4">时间</th>
                            <th className="px-6 py-4">类型</th>
                            <th className="px-6 py-4">描述</th>
                            <th className="px-6 py-4 text-right">金额</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {transactions.length > 0 ? (
                            transactions.map((t, index) => {
                                const { label, color, icon: Icon } = getTypeLabel(t.type)
                                const isPositive = t.type === 'recharge' || t.type === 'income' || t.type === 'tip_received'
                                return (
                                    <motion.tr 
                                        key={t.id} 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-secondary/20 transition-colors"
                                    >
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                            {new Date(t.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded-full bg-secondary ${color.replace('text-', 'text-')} border border-border`}>
                                                    <Icon className="h-3 w-3" />
                                                </div>
                                                <span className={`${color} font-medium`}>{label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            {t.description || '-'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold font-mono ${isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-foreground'}`}>
                                            {isPositive ? '+' : '-'}{Math.abs(t.amount).toFixed(2)}
                                        </td>
                                    </motion.tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mb-4">
                                            <Clock className="h-6 w-6" />
                                        </div>
                                        <p>暂无交易记录</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="bg-background border-border text-foreground">
            <DialogHeader>
                <DialogTitle>提现</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                    提现金额将转入您指定的支付宝账户，预计 1-3 个工作日到账。
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="amount">提现金额 (元)</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">¥</span>
                        <Input 
                            id="amount" 
                            type="number"
                            min="0.1"
                            max={balance}
                            value={withdrawAmount} 
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className="bg-secondary/50 border-border pl-7"
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
                        className="bg-secondary/50 border-border"
                        placeholder="请输入支付宝账号/手机号"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsWithdrawOpen(false)} className="border-border hover:bg-secondary text-foreground">取消</Button>
                <Button onClick={handleWithdraw} disabled={submitting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                    {submitting ? '提交中...' : '确认提现'}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
