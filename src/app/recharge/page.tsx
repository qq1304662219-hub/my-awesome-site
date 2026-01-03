"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, QrCode } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"

function RechargeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnUrl = searchParams.get("returnUrl") || "/dashboard"
  const { user, profile, setProfile } = useAuthStore()
  
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat')
  const [isCustom, setIsCustom] = useState(false)
  const [customAmount, setCustomAmount] = useState('')

  const amounts = [50, 100, 200, 500, 1000, 2000, 5000, 10000]

  const handleRecharge = async () => {
    if (!user) {
        toast.error("请先登录")
        router.push("/auth?tab=login")
        return
    }

    if (selectedAmount <= 0) {
        toast.error("请输入有效的充值金额")
        return
    }

    setLoading(true)
    
    // Submit manual recharge request
    try {
        const response = await fetch('/api/recharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                amount: selectedAmount,
                type: 'manual_qrcode',
                payment_method: paymentMethod,
                description: `用户申请充值 ¥${selectedAmount}`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '提交充值申请失败');
        }

        toast.success(`充值申请已提交！请等待管理员审核`)
        
        // Redirect to wallet to see pending status
        router.push('/dashboard/wallet')
    } catch (error: any) {
        console.error("Recharge error:", error)
        toast.error(error.message || "提交失败，请重试")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-foreground mb-2">账户充值 (人工审核)</h1>
            <p className="text-muted-foreground mb-10">由于当前未开通企业支付，请扫码支付后点击"我已支付"，管理员审核后将为您入账。</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left: Amount Selection */}
                <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">选择充值金额</h3>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {amounts.map((amount) => (
                            <div 
                                key={amount}
                                onClick={() => {
                                    setIsCustom(false)
                                    setSelectedAmount(amount)
                                }}
                                className={`
                                    relative p-4 rounded-xl border text-center cursor-pointer transition-all
                                    ${!isCustom && selectedAmount === amount 
                                        ? 'border-primary bg-primary/10 text-primary' 
                                        : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}
                                `}
                            >
                                <span className="text-lg font-bold">¥{amount}</span>
                            </div>
                        ))}
                        <div 
                            onClick={() => {
                                setIsCustom(true)
                                setSelectedAmount(Number(customAmount) || 0)
                            }}
                            className={`
                                relative p-4 rounded-xl border text-center cursor-pointer transition-all flex items-center justify-center
                                ${isCustom 
                                    ? 'border-primary bg-primary/10 text-primary' 
                                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50'}
                            `}
                        >
                            {isCustom ? (
                                <div className="flex items-center justify-center w-full">
                                    <span className="text-lg font-bold mr-1">¥</span>
                                    <Input 
                                        type="number" 
                                        value={customAmount}
                                        onChange={(e) => {
                                            const val = e.target.value
                                            setCustomAmount(val)
                                            setSelectedAmount(Number(val) || 0)
                                        }}
                                        className="h-8 w-20 px-1 text-center bg-transparent border-none focus-visible:ring-0 text-lg font-bold p-0 shadow-none"
                                        placeholder="0"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <span className="text-lg font-bold">自定义</span>
                            )}
                        </div>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-6 border border-border">
                        <h4 className="font-medium text-foreground mb-2">充值说明</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>充值金额永久有效，无过期时间</li>
                            <li>充值金额不可提现，仅用于平台消费</li>
                            <li>如需开具发票，请在充值完成后联系客服</li>
                        </ul>
                    </div>
                </div>

                {/* Right: Payment Preview */}
                <div className="bg-card border border-border rounded-2xl p-8 text-card-foreground shadow-sm">
                    <div className="text-center mb-6">
                        <p className="text-muted-foreground mb-2">应付金额</p>
                        <div className="text-5xl font-bold text-foreground">
                            ¥{selectedAmount}.00
                        </div>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="flex p-1 bg-muted rounded-lg mb-6">
                        <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'wechat' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setPaymentMethod('wechat')}
                        >
                            微信支付
                        </button>
                        <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'alipay' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setPaymentMethod('alipay')}
                        >
                            支付宝
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-48 h-48 bg-muted/50 border-2 border-border rounded-xl p-2 shadow-inner flex items-center justify-center overflow-hidden">
                             {/* QR Code Image - Always white bg for scanning safety */}
                             <img 
                                src={paymentMethod === 'wechat' ? '/images/wechat-pay.jpg?v=2' : '/images/alipay-pay.jpg?v=2'} 
                                alt={paymentMethod === 'wechat' ? 'WeChat Pay' : 'Alipay'}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerText = '请联系管理员获取收款码';
                                    target.parentElement!.className += ' text-muted-foreground text-sm font-medium text-center';
                                }}
                             />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            className={`w-full h-12 text-lg font-bold rounded-full ${paymentMethod === 'wechat' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'}`}
                            onClick={handleRecharge}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "我已支付，提交审核"}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            支付成功后请务必点击上方按钮提交申请
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default function RechargePage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading...</div>}>
                <RechargeContent />
            </Suspense></div>
    )
}
