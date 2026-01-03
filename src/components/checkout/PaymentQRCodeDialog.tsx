import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2, QrCode, CheckCircle2 } from "lucide-react"
import Image from "next/image"

interface PaymentQRCodeDialogProps {
  amount: number
  userId: string
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function PaymentQRCodeDialog({ amount, userId, onSuccess, trigger }: PaymentQRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [transactionId, setTransactionId] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat')

  const handleSubmit = async () => {
    if (!transactionId) {
        toast.error("请输入支付流水号或备注")
        return
    }

    setSubmitting(true)
    try {
        const response = await fetch('/api/recharge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                amount: amount,
                type: 'manual_qrcode',
                payment_method: paymentMethod,
                description: `订单支付: ¥${amount}`
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '提交支付凭证失败');
        }

        toast.success("支付凭证已提交，等待管理员审核后入账")
        setIsOpen(false)
        onSuccess()
    } catch (error: any) {
        console.error(error)
        toast.error(error.message || "提交失败，请重试")
    } finally {
        setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" className="w-full">扫码支付 (¥{amount})</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle>扫码支付</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            请扫描下方二维码支付 ¥{amount}，并填写流水号以便审核。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
            {/* Payment Method Tabs */}
            <div className="flex p-1 bg-muted rounded-lg w-full mb-2">
                <button 
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'wechat' ? 'bg-green-600 text-white shadow' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                    onClick={() => setPaymentMethod('wechat')}
                >
                    微信支付
                </button>
                <button 
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${paymentMethod === 'alipay' ? 'bg-blue-600 text-white shadow' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                    onClick={() => setPaymentMethod('alipay')}
                >
                    支付宝
                </button>
            </div>

            {/* QR Code */}
            <div className="w-48 h-48 bg-muted/50 p-2 rounded-lg flex items-center justify-center relative overflow-hidden">
                <Image 
                    src={paymentMethod === 'wechat' ? '/images/wechat-pay.jpg?v=2' : '/images/alipay-pay.jpg?v=2'} 
                    alt={paymentMethod === 'wechat' ? 'WeChat Pay' : 'Alipay'}
                    width={200}
                    height={200}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                        // Fallback if image fails
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                    }}
                />
                {/* Fallback text if image missing (handled by onError visually but keeping structure) */}
                <div className="absolute inset-0 -z-10 flex items-center justify-center text-black text-xs font-bold text-center p-4">
                    请联系管理员获取收款码
                </div>
            </div>
            
            <div className="text-sm text-muted-foreground text-center">
                请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付 <span className="text-foreground font-bold">¥{amount}</span>
            </div>
        </div>

        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="transactionId">支付流水号 / 备注</Label>
                <Input 
                    id="transactionId" 
                    placeholder="请输入支付完成后的流水号后4位" 
                    className="bg-muted/50 border-input text-foreground placeholder:text-muted-foreground"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                />
            </div>
        </div>

        <DialogFooter className="sm:justify-between flex-row items-center gap-4 mt-4">
            <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className={`text-white ${paymentMethod === 'wechat' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                我已支付
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
