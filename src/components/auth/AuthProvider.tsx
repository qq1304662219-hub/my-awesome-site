'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore()
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    
    // Function to fetch or create profile
    const syncUserProfile = async (user: any) => {
        try {
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            
            if (profile) {
              if (mounted.current) setProfile(profile)
            } else {
                // Profile not found, create one
                const newProfile = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url,
                    role: 'user',
                    status: 'active',
                    balance: 0
                }
                
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                
                if (!insertError && mounted.current) {
                    setProfile(newProfile as any)
                }
            }
        } catch (error) {
            console.error('Profile sync error:', error)
            // Fallback: Set minimal profile from user metadata if DB fetch fails
            if (mounted.current && user) {
                const fallbackProfile = {
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    avatar_url: user.user_metadata?.avatar_url,
                    role: 'user', // Default role
                    status: 'active',
                    balance: 0
                }
                setProfile(fallbackProfile as any)
            }
        }
    }

    // Initialize session
    const initAuth = async () => {
      try {
        // Check for placeholder config
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
            console.warn('Supabase URL is missing or placeholder')
            if (mounted.current) setLoading(false)
            return
        }

        // Add timeout to getSession
        const getSessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session check timeout')), 20000)
        )

        const { data: { session }, error } = await Promise.race([
            getSessionPromise,
            timeoutPromise
        ]) as any

        if (error) {
            console.error("Session check error:", error)
            throw error
        }

        if (session?.user) {
            if (mounted.current) setUser(session.user)
            // Don't await profile sync to unblock UI, let it happen in background
            syncUserProfile(session.user)
        } else {
            if (mounted.current) {
                setUser(null)
                setProfile(null)
            }
        }
      } catch (e: any) {
        console.error("Auth init error:", e)
        // If timeout occurred, check if we can verify session via getUser (sometimes faster if cached)
        // But for now, if timeout, we might assume poor connection.
        // We do NOT clear user immediately if it's a timeout error and we might have had a user?
        // Actually, initAuth runs on mount. user is null initially.
        
        if (mounted.current) {
            // Only explicitly set null if we are sure it failed definitively
            // For timeout, we still set null because we can't confirm identity
            setUser(null)
            setProfile(null)
        }
      } finally {
        if (mounted.current) setLoading(false)
      }
    }

    initAuth()

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
            if (mounted.current) setUser(session.user)
            // DO NOT await this to avoid blocking any internal state updates
            syncUserProfile(session.user)
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted.current) {
            setUser(null)
            setProfile(null)
        }
      }
      
      // Ensure loading is false after any auth event processing
      if (mounted.current) setLoading(false)
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading])

  return <>{children}</>
}
