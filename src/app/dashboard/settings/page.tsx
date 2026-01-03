"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, User, Save, Upload, Camera, Shield, Bell, Key } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  const router = useRouter()
  const { profile, setProfile } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    website: "",
    avatar_url: ""
  })
  const [user, setUser] = useState<any>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Password Reset State
  const [passwords, setPasswords] = useState({
      current: "",
      new: "",
      confirm: ""
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUser(user)

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          bio: data.bio || "",
          website: data.website || "",
          avatar_url: data.avatar_url || ""
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("加载个人资料失败")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      const file = e.target.files?.[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      // Use user ID as folder to match RLS policy
      const filePath = `${user.id}/${fileName}`

      // Upload to 'uploads' bucket which is used for videos as well
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath)

      setFormData({ ...formData, avatar_url: publicUrl })
      toast.success("头像上传成功")
    } catch (error: any) {
      console.error("Avatar upload error:", error)
      toast.error("上传头像失败: " + error.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true)
      const updates = {
          full_name: formData.full_name,
          bio: formData.bio,
          website: formData.website,
          avatar_url: formData.avatar_url,
          updated_at: new Date().toISOString()
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      
      // Update local store
      if (profile) {
          setProfile({ ...profile, ...updates })
      } else {
          setProfile({ ...updates, id: user.id } as any)
      }

      // Sync metadata for better compatibility
      await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url
        }
      });

      toast.success("保存成功")
      router.refresh();
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error("保存失败: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async () => {
      if (passwords.new !== passwords.confirm) {
          toast.error("两次输入的密码不一致")
          return
      }
      try {
          const { error } = await supabase.auth.updateUser({ password: passwords.new })
          if (error) throw error
          toast.success("密码修改成功")
          setPasswords({ current: "", new: "", confirm: "" })
      } catch (e: any) {
          toast.error("密码修改失败: " + e.message)
      }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">账号设置</h1>
          <p className="text-muted-foreground mt-1">管理您的个人资料、安全设置和偏好</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-muted border border-border p-1">
                <TabsTrigger value="profile" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">
                    <User className="w-4 h-4 mr-2" /> 个人资料
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">
                    <Shield className="w-4 h-4 mr-2" /> 安全设置
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground">
                    <Bell className="w-4 h-4 mr-2" /> 通知偏好
                </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
                <Card className="bg-card border-border backdrop-blur-sm">
                  <CardHeader>
                      <CardTitle className="text-foreground">基本信息</CardTitle>
                      <CardDescription>其他人将看到这些信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-8 pb-8 border-b border-border">
                        <div className="relative group">
                            <Avatar className="h-24 w-24 border-2 border-border ring-4 ring-muted transition-all group-hover:ring-primary/20">
                                <AvatarImage src={formData.avatar_url} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                                    {formData.full_name?.[0]?.toUpperCase() || <User />}
                                </AvatarFallback>
                            </Avatar>
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all backdrop-blur-sm">
                                {uploadingAvatar ? (
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleAvatarUpload}
                                    disabled={uploadingAvatar}
                                />
                            </label>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 text-foreground">头像</h3>
                            <p className="text-sm text-muted-foreground">
                                点击图片上传新头像。支持 JPG, PNG, GIF 格式。
                            </p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground">邮箱</Label>
                                <Input 
                                    value={user?.email || ""}
                                    disabled
                                    className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="full_name" className="text-muted-foreground">昵称</Label>
                                <Input 
                                    id="full_name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    className="bg-muted/50 border-border focus:border-primary/50"
                                    placeholder="您的昵称"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="website" className="text-muted-foreground">个人网站</Label>
                                <Input 
                                    id="website"
                                    value={formData.website}
                                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                                    className="bg-muted/50 border-border focus:border-primary/50"
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="bio" className="text-muted-foreground">个人简介</Label>
                            <Textarea 
                                id="bio"
                                value={formData.bio}
                                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                className="bg-muted/50 border-border min-h-[100px] focus:border-primary/50"
                                placeholder="介绍一下自己..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 min-w-[120px] shadow-lg shadow-primary/20 text-primary-foreground"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 保存中...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" /> 保存更改</>
                                )}
                            </Button>
                        </div>
                    </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="security">
                <Card className="bg-card border-border backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">密码与安全</CardTitle>
                        <CardDescription>管理您的登录方式</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground">新密码</Label>
                                <Input 
                                    type="password"
                                    value={passwords.new}
                                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-muted-foreground">确认新密码</Label>
                                <Input 
                                    type="password"
                                    value={passwords.confirm}
                                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                    className="bg-muted/50 border-border"
                                />
                            </div>
                            <Button onClick={handleUpdatePassword} variant="outline" className="border-border hover:bg-muted text-foreground">
                                <Key className="w-4 h-4 mr-2" />
                                更新密码
                            </Button>
                        </div>

                        <div className="pt-8 border-t border-border">
                            <h3 className="text-destructive font-bold mb-2">危险区域</h3>
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center justify-between">
                                <div>
                                    <h4 className="text-foreground font-medium">删除账号</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        删除账号后，您的所有数据将被永久清除且无法恢复。
                                    </p>
                                </div>
                                <Button 
                                    variant="destructive" 
                                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                    onClick={() => {
                                        if (confirm("确定要注销账号吗？此操作不可逆。")) {
                                            toast.error("为了保障您的权益，请联系客服人工处理注销申请。")
                                        }
                                    }}
                                >
                                    删除账号
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="notifications">
                 <Card className="bg-card border-border backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-foreground">通知设置</CardTitle>
                        <CardDescription>选择您希望接收的通知类型</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-foreground">新订单通知</Label>
                                <p className="text-sm text-muted-foreground">当有人购买您的作品时通知我</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-foreground">新评论通知</Label>
                                <p className="text-sm text-muted-foreground">当有人评论您的作品时通知我</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-foreground">系统公告</Label>
                                <p className="text-sm text-muted-foreground">接收平台重要更新和公告</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
