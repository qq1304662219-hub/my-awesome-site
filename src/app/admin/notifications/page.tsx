"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import { Loader2, Send, Users, User, AlertTriangle } from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"

export default function AdminNotificationsPage() {
  const { user: currentUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [targetType, setTargetType] = useState<'all' | 'specific'>('specific')
  const [targetEmail, setTargetEmail] = useState("")
  const [message, setMessage] = useState("")
  const [previewUser, setPreviewUser] = useState<any>(null)
  const [searching, setSearching] = useState(false)

  const handleSearchUser = async () => {
    if (!targetEmail) return
    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('email', targetEmail)
        .single()

      if (error) throw error
      setPreviewUser(data)
      toast.success("找到用户: " + data.full_name)
    } catch (error) {
      console.error(error)
      setPreviewUser(null)
      toast.error("未找到该邮箱对应的用户")
    } finally {
      setSearching(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("请输入通知内容")
      return
    }

    if (targetType === 'specific' && !previewUser) {
      toast.error("请先搜索并确认目标用户")
      return
    }

    setLoading(true)
    try {
      if (targetType === 'specific') {
        // Send to single user
        const { error } = await supabase.from('notifications').insert({
          user_id: previewUser.id,
          actor_id: currentUser?.id,
          type: 'system',
          content: message,
          is_read: false,
          resource_type: 'system',
          resource_id: '0'
        })
        if (error) throw error
        toast.success(`已发送给 ${previewUser.full_name}`)
      } else {
        // Send to all users (Client-side batch - Caution: Only for small user base)
        // 1. Fetch all user IDs
        const { data: users, error: fetchError } = await supabase
          .from('profiles')
          .select('id')
        
        if (fetchError) throw fetchError

        if (!users || users.length === 0) {
            toast.error("没有用户")
            return
        }

        // 2. Batch insert
        const notifications = users.map(u => ({
          user_id: u.id,
          actor_id: currentUser?.id,
          type: 'system',
          content: message,
          is_read: false,
          resource_type: 'system',
          resource_id: '0'
        }))

        const { error: insertError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (insertError) throw insertError
        toast.success(`已向 ${users.length} 位用户发送广播通知`)
      }

      // Reset form
      setMessage("")
      if (targetType === 'specific') {
        setTargetEmail("")
        setPreviewUser(null)
      }

    } catch (error: any) {
      console.error("Error sending notification:", error)
      toast.error(error.message || "发送失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">消息通知</h1>
        <p className="text-muted-foreground">向用户发送系统通知或全站广播</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>发送新通知</CardTitle>
            <CardDescription>
              发送的消息将直接显示在用户的通知中心
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>发送对象</Label>
              <RadioGroup 
                defaultValue="specific" 
                value={targetType}
                onValueChange={(v: any) => setTargetType(v)}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="specific" id="specific" />
                  <Label htmlFor="specific" className="font-normal cursor-pointer flex items-center gap-2">
                    <User className="w-4 h-4" /> 指定用户
                  </Label>
                </div>
                <div className="flex items-center space-x-3 space-y-0">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="font-normal cursor-pointer flex items-center gap-2">
                    <Users className="w-4 h-4" /> 全体用户 (广播)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {targetType === 'specific' && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border border-border">
                <Label>搜索用户 (邮箱)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="user@example.com" 
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                  />
                  <Button variant="secondary" onClick={handleSearchUser} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "搜索"}
                  </Button>
                </div>
                {previewUser && (
                  <div className="flex items-center gap-3 mt-2 text-sm bg-background p-2 rounded border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {previewUser.full_name?.[0] || 'U'}
                    </div>
                    <div>
                        <div className="font-medium">{previewUser.full_name}</div>
                        <div className="text-muted-foreground text-xs">{previewUser.email}</div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                )}
              </div>
            )}

            {targetType === 'all' && (
               <div className="flex items-center gap-2 p-4 bg-yellow-500/10 text-yellow-600 rounded-lg border border-yellow-500/20">
                 <AlertTriangle className="w-5 h-5" />
                 <p className="text-sm">注意：此操作将向平台所有注册用户发送通知，请谨慎使用。</p>
               </div>
            )}

            <div className="space-y-3">
              <Label>通知内容</Label>
              <Textarea 
                placeholder="请输入通知详情..." 
                className="min-h-[150px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button onClick={handleSend} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 发送中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> 确认发送
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CheckCircle({ className }: { className?: string }) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  }
