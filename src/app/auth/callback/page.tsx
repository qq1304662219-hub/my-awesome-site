'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // 处理 OAuth 回调
    const handleAuthCallback = async () => {
      // 检查当前是否已经有 session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session) {
        router.push('/dashboard')
        return
      }

      if (error) {
        console.error('Auth error:', error)
        router.push('/auth?error=auth_failed')
        return
      }

      // 监听状态变化（处理 code exchange）
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/')
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#020817] text-white">
      <div className="text-center">
        <h2 className="text-xl mb-4">正在验证登录...</h2>
        <p className="text-gray-400 text-sm mb-8">请稍候，正在跳转到仪表盘</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  )
}
