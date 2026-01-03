"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Navbar } from "@/components/landing/Navbar"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    avatar_url: ""
  })

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/")
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, bio, avatar_url')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || ""
        })
      }
    } catch (error) {
      toast.error("加载个人信息失败")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function updateProfile() {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error("No user")

      const updates = {
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('profiles').upsert(updates)

      if (error) throw error
      toast.success("个人信息已更新")
      router.refresh()
    } catch (error) {
      toast.error("更新失败")
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
     return <div className="min-h-screen bg-[#020817] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-20 max-w-2xl">
        <Card className="bg-white/5 border-white/10 text-white">
          <CardHeader>
            <CardTitle>个人设置</CardTitle>
            <CardDescription className="text-gray-400">管理您的个人资料和账户设置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="full_name">昵称</Label>
              <Input 
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">个人简介</Label>
              <Textarea 
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-black/20 border-white/10 min-h-[100px] text-white"
                placeholder="介绍一下你自己..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatar_url">头像链接</Label>
              <Input 
                id="avatar_url"
                value={formData.avatar_url}
                onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                className="bg-black/20 border-white/10 text-white"
                placeholder="https://..."
              />
              <p className="text-xs text-gray-500">支持 JPG, PNG, GIF 格式的图片链接</p>
            </div>

            <Button onClick={updateProfile} disabled={saving} className="w-full">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              保存更改
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
