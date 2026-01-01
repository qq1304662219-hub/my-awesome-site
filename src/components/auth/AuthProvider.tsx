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
            setTimeout(() => reject(new Error('Session check timeout')), 10000)
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
      } catch (e) {
        console.error("Auth init error:", e)
        // Even on error, we must stop loading to allow app to function (as guest)
        if (mounted.current) {
            // Only clear user if it was a session error, not just a timeout? 
            // Actually if timeout, we assume no session or offline.
            // But if we are offline, maybe we should keep previous state?
            // For now, fail safe to guest.
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
            await syncUserProfile(session.user)
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
