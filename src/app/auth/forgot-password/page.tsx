"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setSent(true)
      toast.success("重置密码邮件已发送")
    } catch (error: any) {
      console.error("Reset password error:", error)
      toast.error(error.message || "发送失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">重置密码</h1>
          <p className="text-muted-foreground mt-2">
            {sent ? "请查收您的邮箱" : "输入您的注册邮箱，我们将发送重置链接"}
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-primary" />
                </div>
            </div>
            <p className="text-sm text-muted-foreground">
                我们已向 <strong>{email}</strong> 发送了一封包含重置密码链接的邮件。请检查您的收件箱（包括垃圾邮件文件夹）。
            </p>
            <Button asChild className="w-full" variant="outline">
                <Link href="/auth?tab=login">返回登录</Link>
            </Button>
            <Button 
                variant="link" 
                className="text-muted-foreground"
                onClick={() => setSent(false)}
            >
                没收到？重试
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">邮箱地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted/50 border-input text-foreground"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "发送重置链接"}
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link 
            href="/auth?tab=login" 
            className="text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> 返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}
