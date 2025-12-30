'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || '')
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const handleUpdateProfile = async () => {
    if (!user) return
    setUpdating(true)

    try {
        // 1. Update Auth Metadata
        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        })
        if (authError) throw authError

        // 2. Update Profiles Table
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', user.id)
        
        if (profileError) throw profileError

        toast.success('个人资料已更新')
    } catch (error: any) {
        toast.error('更新失败: ' + error.message)
    } finally {
        setUpdating(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!password) return
    if (password !== confirmPassword) {
        toast.error('两次输入的密码不一致')
        return
    }
    if (password.length < 6) {
        toast.error('密码长度至少为 6 位')
        return
    }

    setUpdating(true)
    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        })
        
        if (error) throw error

        toast.success('密码已更新')
        setPassword('')
        setConfirmPassword('')
    } catch (error: any) {
        toast.error('更新失败: ' + error.message)
    } finally {
        setUpdating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  )

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-white">账号设置</h1>

      {/* Profile Settings */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
            <CardTitle className="text-white">基本资料</CardTitle>
            <CardDescription className="text-gray-400">
                管理您的个人信息和公开资料
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-white/10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-xl">
                        {user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <Button variant="outline" className="border-white/10 text-white hover:bg-white/10">
                        更换头像
                    </Button>
                    <p className="text-xs text-gray-500">支持 JPG, PNG 格式，最大 2MB</p>
                </div>
            </div>

            <div className="grid gap-4 max-w-md">
                <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">邮箱账号</Label>
                    <Input 
                        id="email" 
                        value={user?.email} 
                        disabled 
                        className="bg-black/20 border-white/10 text-gray-500"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="fullname" className="text-gray-300">昵称</Label>
                    <Input 
                        id="fullname" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-black/20 border-white/10 text-white"
                    />
                </div>
                <Button 
                    onClick={handleUpdateProfile} 
                    disabled={updating}
                    className="w-fit bg-blue-600 hover:bg-blue-700"
                >
                    保存资料
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
            <CardTitle className="text-white">安全设置</CardTitle>
            <CardDescription className="text-gray-400">
                修改您的登录密码
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">新密码</Label>
                <Input 
                    id="password" 
                    type="password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirm" className="text-gray-300">确认新密码</Label>
                <Input 
                    id="confirm" 
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-black/20 border-white/10 text-white"
                />
            </div>
            <Button 
                onClick={handleUpdatePassword} 
                disabled={updating || !password}
                className="w-fit bg-white text-black hover:bg-gray-200"
            >
                更新密码
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}
