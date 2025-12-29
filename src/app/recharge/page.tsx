"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { Button } from "@/components/ui/button"
import { Loader2, QrCode } from "lucide-react"
import { toast } from "sonner"

function RechargeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const returnUrl = searchParams.get("returnUrl") || "/dashboard"
  
  const [selectedAmount, setSelectedAmount] = useState(100)
  const [loading, setLoading] = useState(false)

  const amounts = [50, 100, 200, 500, 1000, 2000, 5000, 10000]

  const handleRecharge = () => {
    setLoading(true)
    
    // Simulate API call and Payment process
    setTimeout(() => {
        // Update mock balance
        const currentBalance = parseFloat(localStorage.getItem("user_balance") || "0")
        const newBalance = currentBalance + selectedAmount
        localStorage.setItem("user_balance", newBalance.toString())
        
        setLoading(false)
        toast.success(`成功充值 ¥${selectedAmount}`)
        
        // Redirect back
        router.push(decodeURIComponent(returnUrl))
    }, 2000)
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
                    <div className="text-center mb-8">
                        <p className="text-gray-500 mb-2">应付金额</p>
                        <div className="text-5xl font-bold text-black">
                            ¥{selectedAmount}.00
                        </div>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="w-48 h-48 bg-white border-2 border-gray-100 rounded-xl p-2 shadow-inner flex items-center justify-center relative group cursor-pointer" onClick={handleRecharge}>
                             {/* Simulated QR Code */}
                             <QrCode className="w-32 h-32 text-gray-800" />
                             <div className="absolute inset-0 bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-sm font-medium text-blue-600">点击模拟支付成功</span>
                             </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button 
                            className="w-full h-12 text-lg font-bold rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={handleRecharge}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "立即支付"}
                        </Button>
                        <p className="text-center text-xs text-gray-400">
                            支持微信 / 支付宝 / 银联支付
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
