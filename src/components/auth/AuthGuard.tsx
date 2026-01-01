'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
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
    }, 8000) // 8 seconds timeout

    return () => clearTimeout(timer)
  }, [isAuthLoading, isChecking])

  useEffect(() => {
    // Wait for global auth loading to finish
    if (isAuthLoading) return

    const checkAuth = async () => {
      try {
        // 1. Check if user is logged in (from store)
        if (!user) {
            router.push('/auth?tab=login')
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
                router.push('/')
                return
            }
        }
        // Auth check passed
        setIsChecking(false)
      } catch (error) {
        console.error('AuthGuard error:', error)
        // If error occurs during admin check, deny access
        if (requireAdmin) {
             router.push('/')
        } else {
             // For normal users, if error (e.g. network), we might still want to show content or error
             // But safest is to allow if user exists (handled above)
             setIsChecking(false)
        }
      }
    }

    checkAuth()
  }, [router, user, profile, requireAdmin, isAuthLoading])

  if (isTimeout) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#020817] gap-4 text-white">
            <div className="text-red-400">验证超时，请检查网络连接</div>
            <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
                刷新页面
            </button>
        </div>
      )
  }

  if (isAuthLoading || isChecking) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020817]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    )
  }

  return <>{children}</>
}
