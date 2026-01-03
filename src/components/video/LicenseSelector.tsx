"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check, ShoppingCart, ShieldCheck, Zap, Globe, Eye, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { useCartStore } from "@/store/useCartStore"

interface LicenseSelectorProps {
  videoId: string
  title: string
  thumbnail: string
  price?: number
  selected?: string
  onChange?: (value: string) => void
  minimal?: boolean
}

export function LicenseSelector({ videoId, title, thumbnail, price = 0, selected, onChange, minimal = false }: LicenseSelectorProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { fetchCartCount } = useCartStore()
  const [internalLicense, setInternalLicense] = useState("personal")
  const [addingToCart, setAddingToCart] = useState(false)
  
  const license = selected || internalLicense
  const setLicense = onChange || setInternalLicense
  
  // Use price from props as base price, default to 70 if 0 or undefined
  const basePrice = price > 0 ? price : 70;

  const prices = {
    personal: basePrice,
    enterprise: basePrice * 3,
    enterprise_plus: basePrice * 10
  }

  const currentPrice = prices[license as keyof typeof prices]

  const handleBuyNow = () => {
    // Navigate to checkout with query params
    const params = new URLSearchParams({
      videoId,
      title,
      thumbnail,
      license,
      price: currentPrice.toString()
    })
    router.push(`/checkout?${params.toString()}`)
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("请先登录")
      router.push("/auth")
      return
    }

    setAddingToCart(true)
    try {
      const { error } = await supabase.from('cart_items').insert({
        user_id: user.id,
        video_id: videoId,
        license_type: license
      })

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.warning("该视频已在购物车中")
        } else {
          throw error
        }
      } else {
        await fetchCartCount()
        toast.success("已加入购物车")
      }
    } catch (error) {
      console.error(error)
      toast.error("加入购物车失败")
    } finally {
      setAddingToCart(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 text-card-foreground">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-foreground">选择授权类型</h3>
        <span className="text-xs text-primary cursor-pointer hover:underline">企业授权服务商折上优惠</span>
      </div>

      <RadioGroup value={license} onValueChange={setLicense} className="space-y-4 mb-8">
        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${license === 'personal' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`} onClick={() => setLicense('personal')}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="personal" id="personal" className="border-primary text-primary" />
            <Label htmlFor="personal" className="text-foreground cursor-pointer font-medium">个人授权</Label>
          </div>
          <span className="text-xl font-bold text-foreground">¥{prices.personal}</span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${license === 'enterprise' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`} onClick={() => setLicense('enterprise')}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="enterprise" id="enterprise" className="border-primary text-primary" />
            <Label htmlFor="enterprise" className="text-foreground cursor-pointer font-medium">企业授权</Label>
          </div>
          <span className="text-xl font-bold text-foreground">¥{prices.enterprise}</span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${license === 'enterprise_plus' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`} onClick={() => setLicense('enterprise_plus')}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="enterprise_plus" id="enterprise_plus" className="border-primary text-primary" />
            <Label htmlFor="enterprise_plus" className="text-foreground cursor-pointer font-medium">企业PLUS授权</Label>
          </div>
          <span className="text-xl font-bold text-foreground">¥{prices.enterprise_plus}</span>
        </div>
      </RadioGroup>

      {!minimal && (
        <>
          <div className="space-y-3 mb-8">
            <Button className="w-full h-12 font-bold text-base rounded-full" onClick={handleBuyNow}>
              立即购买
            </Button>
            <Button variant="outline" className="w-full h-12 border-border text-foreground hover:bg-muted rounded-full" onClick={handleAddToCart} disabled={addingToCart}>
              {addingToCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />} 加入购物车
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">包含权益</span>
              <span className="text-primary text-xs cursor-pointer">授权范围 &gt;</span>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                </div>
                <span>企业/个人 永久商业授权</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-3 w-3 text-primary" />
                </div>
                <span>企业只拥有使用权/播放权/排他权</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-3 w-3 text-primary" />
                </div>
                <span>赛事/游戏/综艺/影视/专题/新闻插图</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-3 w-3 text-primary" />
                </div>
                <span>极速下载原始高清视频源文件</span>
              </div>
            </div>
          </div>
          
          {/* 版权材料预览 - 静态图片占位 */}
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">版权材料</h4>
            <div className="grid grid-cols-2 gap-3">
                 <div className="aspect-[3/4] bg-muted border border-border rounded flex items-center justify-center relative overflow-hidden group cursor-pointer">
                    <div className="text-[10px] text-muted-foreground text-center p-2">数字版权证书<br/>(示例)</div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                    </div>
                 </div>
                 <div className="aspect-[3/4] bg-muted border border-border rounded flex items-center justify-center relative overflow-hidden group cursor-pointer">
                    <div className="text-[10px] text-muted-foreground text-center p-2">肖像权授权书<br/>(示例)</div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-4 w-4 text-white" />
                    </div>
                 </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
