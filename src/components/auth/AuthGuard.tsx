'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const router = useRouter()
  const { user, profile, isLoading: isAuthLoading } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)
  const [isTimeout, setIsTimeout] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
        if (isAuthLoading || isChecking) {
            setIsTimeout(true)
        }
    }, 15000) // 15 seconds timeout

    return () => clearTimeout(timer)
  }, [isAuthLoading, isChecking])

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for global auth loading to finish
    if (isAuthLoading) return

    const checkAuth = async () => {
      try {
        // 1. Check if user is logged in (from store)
        if (!user) {
            // Delay redirect slightly to ensure store is synced or allow toast to show
            // But usually we just redirect.
            const searchParams = new URLSearchParams(window.location.search)
            const returnUrl = encodeURIComponent(window.location.pathname)
            router.push(`/auth?tab=login&returnUrl=${returnUrl}`)
            return
        }

        // 2. Check admin if required
        if (requireAdmin) {
            // If profile is not yet loaded in store (should be loaded by AuthProvider), try to fetch
            let currentRole = profile?.role
            
            if (!currentRole) {
                const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                if (error) throw error
                currentRole = data?.role
            }

            if (currentRole !== 'admin' && currentRole !== 'super_admin') {
                setError('您没有权限访问此页面 (需要管理员权限)')
                return
            }
        }
        // Auth check passed
        setIsChecking(false)
      } catch (error: any) {
        console.error('AuthGuard error:', error)
        setError(error.message || "验证过程发生错误")
      }
    }

    checkAuth()
  }, [router, user, profile, requireAdmin, isAuthLoading])

  if (error) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 text-foreground p-4 text-center">
            <div className="text-red-400 text-xl font-bold">访问被拒绝</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => router.push('/')} variant="outline">
                返回首页
            </Button>
        </div>
    )
  }

  if (isTimeout) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 text-foreground p-4 text-center">
            <div className="text-red-400 text-xl font-bold">验证超时</div>
            <div className="text-muted-foreground text-sm max-w-md">
                <p>系统无法在规定时间内完成身份验证。</p>
                <div className="mt-2 p-2 bg-muted rounded text-xs font-mono text-left">
                    <p>Auth Loading: {isAuthLoading ? 'Yes' : 'No'}</p>
                    <p>Checking: {isChecking ? 'Yes' : 'No'}</p>
                    <p>User: {user ? 'Found' : 'Missing'}</p>
                    <p>Profile: {profile ? 'Found' : 'Missing'}</p>
                </div>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                    刷新页面
                </button>
                <button 
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 transition-colors"
                >
                    返回首页
                </button>
            </div>
        </div>
      )
  }

  if (isAuthLoading || isChecking) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-muted-foreground text-sm animate-pulse">
                {isAuthLoading ? '正在连接认证服务...' : '正在验证用户权限...'}
            </p>
        </div>
    )
  }

  return <>{children}</>
}
