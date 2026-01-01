'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const router = useRouter()
  const { user, profile } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check if user is logged in
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        router.push('/auth?tab=login')
        return
      }

      // 2. Check admin if required
      if (requireAdmin) {
        // If profile is not yet loaded in store, fetch it
        let currentRole = profile?.role
        if (!currentRole) {
             const { data } = await supabase.from('profiles').select('role').eq('id', currentUser.id).single()
             currentRole = data?.role
        }

        if (currentRole !== 'admin' && currentRole !== 'super_admin') {
            router.push('/')
            return
        }
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, profile, requireAdmin])

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#020817]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
    )
  }

  return <>{children}</>
}
