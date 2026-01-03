"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a session (user clicked magic link)
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            toast.error("无效或过期的链接")
            router.push("/auth?tab=login")
        }
    }
    checkSession()
  }, [router])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致")
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      toast.success("密码修改成功，请重新登录")
      await supabase.auth.signOut()
      router.push("/auth?tab=login")
    } catch (error: any) {
      console.error("Update password error:", error)
      toast.error(error.message || "修改失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">设置新密码</h1>
          <p className="text-muted-foreground mt-2">
            请输入您的新密码
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">新密码</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-muted/50 border-input text-foreground"
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">确认新密码</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="bg-muted/50 border-input text-foreground"
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "更新密码"}
          </Button>
        </form>
      </div>
    </div>
  )
}
