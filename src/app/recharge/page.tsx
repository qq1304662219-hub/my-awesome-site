"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
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

  const amounts = [50, 100, 200, 500, 1000, 2000, 5000, 10000]

  const handleRecharge = async () => {
    if (!user) {
        toast.error("请先登录")
        router.push("/auth?tab=login")
        return
    }

    setLoading(true)
    
    // Simulate API call and Payment process
    try {
        // Create a pending transaction
        const response = await fetch('/api/recharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                amount: selectedAmount,
                type: 'manual_qrcode',
                payment_method: paymentMethod,
                description: `用户使用${paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码充值 ¥${selectedAmount}`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Recharge request failed');
        }

        toast.success(`充值成功！余额已更新`)
        
        // Redirect back or to wallet
        router.push('/dashboard/wallet')
    } catch (error: any) {
        console.error("Recharge error:", error)
        toast.error(error.message || "充值申请失败，请联系客服")
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">账户充值</h1>
            <p className="text-gray-400 mb-10">充值余额可用于购买视频素材、图片素材及增值服务</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left: Amount Selection */}
                <div>
                    <h3 className="text-lg font-medium text-white mb-4">选择充值金额</h3>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {amounts.map((amount) => (
                            <div 
                                key={amount}
                                onClick={() => setSelectedAmount(amount)}
                                className={`
                                    relative p-4 rounded-xl border text-center cursor-pointer transition-all
                                    ${selectedAmount === amount 
                                        ? 'border-blue-500 bg-blue-500/10 text-white' 
                                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'}
                                `}
                            >
                                <span className="text-lg font-bold">¥{amount}</span>
                                {amount >= 1000 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        赠{(amount * 0.1).toFixed(0)}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h4 className="font-medium text-white mb-2">充值说明</h4>
                        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                            <li>充值金额永久有效，无过期时间</li>
                            <li>充值金额不可提现，仅用于平台消费</li>
                            <li>如需开具发票，请在充值完成后联系客服</li>
                        </ul>
                    </div>
                </div>

                {/* Right: Payment Preview */}
                <div className="bg-white rounded-2xl p-8 text-black">
                    <div className="text-center mb-6">
                        <p className="text-gray-500 mb-2">应付金额</p>
                        <div className="text-5xl font-bold text-black">
                            ¥{selectedAmount}.00
                        </div>
                    </div>

                    {/* Payment Method Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
                        <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'wechat' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setPaymentMethod('wechat')}
                        >
                            微信支付
                        </button>
                        <button 
                            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'alipay' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setPaymentMethod('alipay')}
                        >
                            支付宝
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-8">
                        <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl p-2 shadow-inner flex items-center justify-center overflow-hidden">
                             {/* QR Code Image */}
                             <img 
                                src={paymentMethod === 'wechat' ? '/images/wechat-pay.jpg' : '/images/alipay-pay.jpg'} 
                                alt={paymentMethod === 'wechat' ? 'WeChat Pay' : 'Alipay'}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerText = '请联系管理员获取收款码';
                                    target.parentElement!.className += ' text-gray-400 text-sm font-medium';
                                }}
                             />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
                        </p>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            className={`w-full h-12 text-lg font-bold rounded-full text-white ${paymentMethod === 'wechat' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            onClick={handleRecharge}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "我已支付，提交审核"}
                        </Button>
                        <p className="text-center text-xs text-gray-400">
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
        <div className="min-h-screen bg-[#020817] text-white">
            <Navbar />
            <Suspense fallback={<div className="pt-32 text-center">Loading...</div>}>
                <RechargeContent />
            </Suspense>
            <Footer />
        </div>
    )
}
