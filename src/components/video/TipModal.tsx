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
    <DialogContent className="sm:max-w-md bg-card border-border">
      <DialogHeader>
        <DialogTitle className="text-center text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 to-orange-500">
          支持作者
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-6 py-4">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
            <Coins className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-muted-foreground">
            如果觉得这个视频很有趣，不妨打赏一下作者吧！
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {PRESET_AMOUNTS.map((amount) => (
            <button
              key={amount}
              onClick={() => {
                setSelectedAmount(amount);
                setCustomAmount("");
              }}
              className={`p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1 ${
                selectedAmount === amount
                  ? "border-yellow-500 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  : "border-border hover:border-yellow-500/50 hover:bg-muted/50 text-foreground"
              }`}
            >
              <span className="text-lg font-bold">¥{amount}</span>
              <span className="text-xs opacity-80">
                {amount * 10} 积分
              </span>
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              或者自定义金额
            </span>
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
            ¥
          </span>
          <Input
            type="number"
            placeholder="输入金额"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setSelectedAmount(0);
            }}
            className="pl-8 h-12 text-lg border-border focus:border-yellow-500/50 bg-background"
          />
        </div>

        <Button 
          onClick={handleTip} 
          disabled={loading || (!selectedAmount && !customAmount)}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold h-12 text-lg shadow-lg shadow-orange-500/20"
        >
          {loading ? "支付中..." : "确认支付"}
        </Button>
      </div>
    </DialogContent>
    </Dialog>
  )
}
