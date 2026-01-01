"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Check, ShoppingCart, ShieldCheck, Zap, Globe, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

interface LicenseSelectorProps {
  videoId: string
  title: string
  thumbnail: string
}

export function LicenseSelector({ videoId, title, thumbnail }: LicenseSelectorProps) {
  const router = useRouter()
  const [license, setLicense] = useState("personal")
  
  const prices = {
    personal: 70,
    enterprise: 280,
    enterprise_plus: 700
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

  const handleAddToCart = () => {
    toast.success("已加入购物车")
  }

  return (
    <div className="bg-[#0f172a] border border-white/10 rounded-xl p-6 sticky top-24">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">选择授权类型</h3>
        <span className="text-xs text-blue-400 cursor-pointer hover:underline">企业授权服务商折上优惠</span>
      </div>

      <RadioGroup value={license} onValueChange={setLicense} className="space-y-4 mb-8">
        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${license === 'personal' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:bg-white/5'}`} onClick={() => setLicense('personal')}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="personal" id="personal" className="border-white/30 text-blue-500" />
            <Label htmlFor="personal" className="text-white cursor-pointer font-medium">个人授权</Label>
          </div>
          <span className="text-xl font-bold text-white">¥{prices.personal}</span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${license === 'enterprise' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:bg-white/5'}`} onClick={() => setLicense('enterprise')}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="enterprise" id="enterprise" className="border-white/30 text-blue-500" />
            <Label htmlFor="enterprise" className="text-white cursor-pointer font-medium">企业授权</Label>
          </div>
          <span className="text-xl font-bold text-white">¥{prices.enterprise}</span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${license === 'enterprise_plus' ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:bg-white/5'}`} onClick={() => setLicense('enterprise_plus')}>
          <div className="flex items-center space-x-3">
            <RadioGroupItem value="enterprise_plus" id="enterprise_plus" className="border-white/30 text-blue-500" />
            <Label htmlFor="enterprise_plus" className="text-white cursor-pointer font-medium">企业PLUS授权</Label>
          </div>
          <span className="text-xl font-bold text-white">¥{prices.enterprise_plus}</span>
        </div>
      </RadioGroup>

      <div className="space-y-3 mb-8">
        <Button className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base rounded-full" onClick={handleBuyNow}>
          立即购买
        </Button>
        <Button variant="outline" className="w-full h-12 border-white/20 text-white hover:bg-white/10 rounded-full" onClick={handleAddToCart} disabled={addingToCart}>
          {addingToCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />} 加入购物车
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">包含权益</span>
          <span className="text-blue-400 text-xs cursor-pointer">授权范围 &gt;</span>
        </div>
        
        <div className="space-y-3 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-blue-400" />
            </div>
            <span>企业/个人 永久商业授权</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-3 w-3 text-blue-400" />
            </div>
            <span>企业只拥有使用权/播放权/排他权</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Globe className="h-3 w-3 text-blue-400" />
            </div>
            <span>赛事/游戏/综艺/影视/专题/新闻插图</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-3 w-3 text-blue-400" />
            </div>
            <span>极速下载原始高清视频源文件</span>
          </div>
        </div>
      </div>
      
      {/* 版权材料预览 - 静态图片占位 */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <h4 className="text-sm font-medium text-gray-400 mb-3">版权材料</h4>
        <div className="grid grid-cols-2 gap-3">
             <div className="aspect-[3/4] bg-white/5 border border-white/10 rounded flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <div className="text-[10px] text-gray-500 text-center p-2">数字版权证书<br/>(示例)</div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                </div>
             </div>
             <div className="aspect-[3/4] bg-white/5 border border-white/10 rounded flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <div className="text-[10px] text-gray-500 text-center p-2">肖像权授权书<br/>(示例)</div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="h-4 w-4 text-white" />
                </div>
             </div>
        </div>
      </div>
    </div>
  )
}
