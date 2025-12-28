'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Video } from 'lucide-react'
import Link from 'next/link'

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
)

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert(error.message)
    } else {
      alert('注册成功！请检查您的邮箱进行验证。')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      alert(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020817] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />

      <div className="w-full max-w-md px-4 relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Video className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              AI Vision
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">欢迎回来</h1>
          <p className="text-gray-400 mt-2">登录您的账户以管理您的创意作品</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10">
            <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">登录</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-gray-400">注册</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">账户登录</CardTitle>
                <CardDescription className="text-gray-400">
                  选择登录方式
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleLogin} 
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                  disabled={loading}
                >
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  使用 Google 登录
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b1221] px-2 text-gray-400">或者使用邮箱</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-login" className="text-gray-300">邮箱</Label>
                    <Input 
                      id="email-login" 
                      type="email" 
                      placeholder="name@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-login" className="text-gray-300">密码</Label>
                    <Input 
                      id="password-login" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                    {loading ? '登录中...' : '立即登录'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="bg-white/5 border-white/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">创建账户</CardTitle>
                <CardDescription className="text-gray-400">
                  选择注册方式
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleLogin} 
                  className="w-full border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                  disabled={loading}
                >
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  使用 Google 注册
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0b1221] px-2 text-gray-400">或者使用邮箱</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-register" className="text-gray-300">邮箱</Label>
                    <Input 
                      id="email-register" 
                      type="email" 
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-register" className="text-gray-300">密码</Label>
                    <Input 
                      id="password-register" 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-black/20 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                    {loading ? '注册中...' : '立即注册'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
