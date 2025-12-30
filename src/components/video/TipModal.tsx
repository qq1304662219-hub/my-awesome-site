"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Coffee, Coins } from "lucide-react"
import confetti from "canvas-confetti"

interface TipModalProps {
  videoId: string
  authorName: string
  isOpen: boolean
  onClose: () => void
}

const PRESET_AMOUNTS = [5, 10, 50]

export function TipModal({ videoId, authorName, isOpen, onClose }: TipModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
  const [customAmount, setCustomAmount] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount)
    setCustomAmount("")
  }

  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value)
    setSelectedAmount(null)
  }

  const handleTip = async () => {
    const amount = selectedAmount || parseFloat(customAmount)
    
    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error("请输入有效的打赏金额")
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.rpc('tip_author', {
        p_video_id: videoId,
        p_amount: amount
      })

      if (error) {
        throw error
      }

      // Success!
      onClose()
      triggerConfetti()
      toast.success(`成功打赏 ${authorName} ${amount} A币！`)
    } catch (error: any) {
      console.error("Tip error:", error)
      if (error.message?.includes('Insufficient balance')) {
        toast.error("余额不足，请先充值")
      } else if (error.message?.includes('Cannot tip yourself')) {
        toast.error("不能给自己打赏哦")
      } else {
        toast.error("打赏失败，请稍后重试")
      }
    } finally {
      setLoading(false)
    }
  }

  const triggerConfetti = () => {
    const duration = 3 * 1000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const random = (min: number, max: number) => Math.random() * (max - min) + min

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      confetti({ ...defaults, particleCount, origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 } })
      confetti({ ...defaults, particleCount, origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 } })
    }, 250)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0f172a] border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Coffee className="h-6 w-6 text-yellow-500" />
            请 {authorName} 喝咖啡
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            您的支持是作者创作的最大动力
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-3 gap-4">
            {PRESET_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className={`h-20 flex flex-col items-center justify-center gap-2 border-white/10 hover:bg-white/5 hover:text-yellow-400 transition-colors ${
                  selectedAmount === amount ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "text-gray-300"
                }`}
                onClick={() => handlePresetSelect(amount)}
              >
                <Coins className="h-6 w-6" />
                <span className="text-lg font-bold">{amount} 币</span>
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount" className="text-gray-300">自定义金额</Label>
            <div className="relative">
              <Input
                id="custom-amount"
                type="number"
                placeholder="输入金额"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="bg-white/5 border-white/10 text-white pl-10 focus:border-yellow-500/50"
              />
              <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="hover:bg-white/10 text-gray-300">
                取消
            </Button>
            <Button 
                onClick={handleTip} 
                disabled={loading || (!selectedAmount && !customAmount)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold"
            >
                {loading ? "支付中..." : "确认支付"}
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
