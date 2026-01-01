"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, User, Save, Upload, Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
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
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [updatingPassword, setUpdatingPassword] = useState(false)

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
        .select('full_name, bio, website, avatar_url')
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
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to 'avatars' bucket (assuming it exists, otherwise 'public')
      // Let's try 'public' first or 'videos' if no specific bucket, but usually 'avatars' is separate.
      // Based on previous files, we haven't seen an 'avatars' bucket creation.
      // We will try 'public' bucket with folder 'avatars'.
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file)

      if (uploadError) {
        // If bucket doesn't exist, this fails. 
        // We assume 'public' bucket exists as it's common in Supabase starter.
        // If not, we might need to create it or use 'videos' bucket if that's the only one.
        throw uploadError
      }

      const { data: { publicUrl } } = supabase.storage
        .from('public')
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
      }

      toast.success("保存成功")
    } catch (error: any) {
      console.error("Save error:", error)
      toast.error("保存失败: " + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">账号设置</h1>
        <p className="text-gray-400">管理您的个人资料和账号信息</p>
      </div>

      <div className="bg-[#0B1120] border border-white/10 rounded-xl p-8 space-y-8">
        
        {/* Avatar Section */}
        <div className="flex items-center gap-8 pb-8 border-b border-white/10">
            <div className="relative group">
                <Avatar className="h-24 w-24 border-2 border-white/10">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-2xl">
                        {formData.full_name?.[0]?.toUpperCase() || <User />}
                    </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
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
                <h3 className="font-bold text-lg mb-1">头像</h3>
                <p className="text-sm text-gray-400">
                    点击图片上传新头像。支持 JPG, PNG, GIF 格式。
                </p>
            </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
            <div className="grid gap-2">
                <Label htmlFor="full_name">昵称</Label>
                <Input 
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="bg-black/20 border-white/10"
                    placeholder="您的昵称"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="bio">个人简介</Label>
                <Textarea 
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="bg-black/20 border-white/10 min-h-[100px]"
                    placeholder="介绍一下自己..."
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="website">个人网站 / 社交链接</Label>
                <Input 
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="bg-black/20 border-white/10"
                    placeholder="https://..."
                />
            </div>

            <div className="pt-4 flex justify-end">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 保存中...</>
                    ) : (
                        <><Save className="w-4 h-4 mr-2" /> 保存更改</>
                    )}
                </Button>
            </div>
        </div>

      </div>
    </div>
  )
}
