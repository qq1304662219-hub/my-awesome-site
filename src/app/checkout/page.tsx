"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ShieldCheck, Ticket, Wallet } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { PaymentQRCodeDialog } from "@/components/checkout/PaymentQRCodeDialog"

function CheckoutContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile, setProfile } = useAuthStore()
  
  const videoId = searchParams.get("videoId")
  const title = searchParams.get("title")
  const thumbnail = searchParams.get("thumbnail")
  const license = searchParams.get("license")
  const price = parseFloat(searchParams.get("price") || "0")
  
  const [loading, setLoading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const balance = profile?.balance || 0

  const licenseLabels: Record<string, string> = {
    personal: "个人授权",
    enterprise: "企业授权",
    enterprise_plus: "企业PLUS授权"
  }

  const handleRecharge = () => {
    // Pass current checkout info to recharge page so we can redirect back
    const returnUrl = encodeURIComponent(`/checkout?${searchParams.toString()}`)
    router.push(`/recharge?returnUrl=${returnUrl}`)
  }

  const handlePay = async () => {
    if (!user) {
        toast.error("请先登录")
        router.push("/auth?tab=login")
        return
    }

    if (!agreed) {
        toast.error("请先阅读并同意授权协议")
        return
    }

    if (balance < price) {
        toast.error("余额不足，请充值")
        return
    }

    setLoading(true)
    try {
        // Use server-side API for purchase
        const { data: { session } } = await supabase.auth.getSession()
        
        const response = await fetch('/api/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`
            },
            body: JSON.stringify({
                videoId,
                price,
                license
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Purchase failed');
        }

        // Refresh profile balance locally
        if (profile) {
             setProfile({ ...profile, balance: balance - price })
        }

        toast.success("支付成功！")
        // Redirect to success page or dashboard
        router.push("/dashboard")
    } catch (error: any) {
        console.error("Payment error:", error)
        toast.error(error.message || "支付失败，请重试")
    } finally {
        setLoading(false)
    }
  }

  if (!videoId) return <div>Invalid Order</div>

  const isVideoUrl = thumbnail?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="container mx-auto px-4 py-24">
      <h1 className="text-2xl font-bold text-foreground mb-8">确认订单</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Item */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">授权商品: 1 件</h3>
                
                <div className="flex gap-6">
                    <div className="w-48 aspect-video bg-muted rounded-lg overflow-hidden relative border border-border">
                         {isVideoUrl ? (
                            <video src={thumbnail || ""} className="w-full h-full object-cover" />
                         ) : (
                            <Image src={thumbnail || ""} alt={title || ""} fill className="object-cover" />
                         )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <div>
                            <h4 className="text-xl font-medium text-foreground mb-2">{title}</h4>
                            <p className="text-muted-foreground text-sm">视频素材 | ID: {videoId}</p>
                        </div>
                        <div className="flex justify-between items-end">
                             <div className="text-muted-foreground bg-muted px-3 py-1 rounded text-sm">
                                {licenseLabels[license || "personal"]}
                             </div>
                             <div className="text-xl font-bold text-foreground">¥{price}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 text-sm text-muted-foreground">
                <p>购买不代表获得独家使用权。为保证您的权益，请及时获取授权 <span className="text-primary cursor-pointer">获取授权</span></p>
            </div>
        </div>

        {/* Settlement Panel */}
        <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 text-card-foreground shadow-xl sticky top-24">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">结算信息</h3>
                    <div className="flex gap-2">
                        <span className="bg-foreground text-background text-xs px-2 py-1 rounded">正版授权</span>
                        <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">安心售后</span>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-muted-foreground">
                        <span>合计</span>
                        <span className="font-medium">¥{price}</span>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2 text-sm text-foreground">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span>成为大客户，本单最高减 ¥{Math.floor(price * 0.1)}元</span>
                    </div>

                    <Button variant="outline" className="w-full border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-accent">
                        <Ticket className="w-4 h-4 mr-2" /> 获取代金券
                    </Button>
                </div>

                <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between items-baseline mb-2">
                        <span className="text-muted-foreground">实付</span>
                        <span className="text-3xl font-bold text-destructive">¥{price}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> 充值余额: ¥{balance}</span>
                        {balance < price && (
                             <span className="text-destructive text-xs">余额不足</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                    <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
                    <label
                        htmlFor="terms"
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                    >
                        已确认订单并认可 <span className="text-primary cursor-pointer">《授权协议》</span> <span className="text-primary cursor-pointer">《退款规则》</span>
                    </label>
                </div>

                {balance >= price ? (
                    <Button 
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-lg"
                        onClick={handlePay}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "余额支付"}
                    </Button>
                ) : (
                    <div className="space-y-3">
                        <Button 
                            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-lg"
                            onClick={handleRecharge}
                        >
                            去充值
                        </Button>
                        <PaymentQRCodeDialog 
                            amount={price} 
                            userId={user?.id || ''} 
                            onSuccess={() => {
                                toast.success("充值申请已提交，请前往钱包查看状态")
                                router.push('/dashboard/wallet')
                            }}
                            trigger={
                                <Button variant="outline" className="w-full h-12 rounded-full border-border hover:bg-accent text-foreground">
                                    扫码支付
                                </Button>
                            }
                        />
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <Suspense fallback={<div className="pt-32 text-center text-muted-foreground">Loading...</div>}>
                <CheckoutContent />
            </Suspense>
        </div>
    )
}
