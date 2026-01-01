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
      } catch (error) {
        console.error('AuthGuard error:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, user, profile, requireAdmin, isAuthLoading])

  if (isAuthLoading || isChecking) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020817]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    )
  }

  return <>{children}</>
}
