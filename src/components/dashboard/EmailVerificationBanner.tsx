"use client"

import { useAuthStore } from "@/store/useAuthStore"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useState } from "react"

export function EmailVerificationBanner() {
  const { user } = useAuthStore()
  const [sending, setSending] = useState(false)

  // If user is null or email is confirmed, don't show banner
  // Note: user.email_confirmed_at is a string timestamp if confirmed, or null/undefined if not.
  if (!user || user.email_confirmed_at) return null

  const handleResend = async () => {
    if (!user.email) return

    setSending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error

      toast.success("验证邮件已发送，请检查您的邮箱")
    } catch (error: any) {
      // Supabase rate limit error often comes as 429
      if (error.status === 429) {
          toast.error("发送太频繁，请稍后再试")
      } else {
          toast.error("发送失败: " + (error.message || "未知错误"))
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 mx-6 mt-6 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-yellow-500 font-medium text-sm">您的邮箱尚未验证</h3>
          <p className="text-yellow-500/70 text-xs mt-1">为了保障您的账户安全并使用所有功能（如发布视频、提现等），请尽快完成邮箱验证。</p>
        </div>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleResend} 
        disabled={sending}
        className="shrink-0 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
      >
        {sending ? "发送中..." : "重发验证邮件"}
      </Button>
    </div>
  )
}
