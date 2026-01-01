'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading } = useAuthStore()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
            setUser(session.user)
            // Fetch profile
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (profile) {
              setProfile(profile)
            } else if (!profile && !error) {
                // Profile not found (and no network error), try to create one manually
                // This is a fallback in case the database trigger didn't fire or exist
                const newProfile = {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    avatar_url: session.user.user_metadata?.avatar_url,
                    role: 'user',
                    status: 'active',
                    balance: 0
                }
                
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                
                if (!insertError) {
                    setProfile(newProfile as any)
                } else {
                    console.error('Failed to auto-create profile:', insertError)
                }
            }
          } else {
            setUser(null)
            setProfile(null)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
            setUser(session.user)
            // Fetch profile on auth change too
            const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
            if (profile) {
                setProfile(profile)
            } else if (!profile && !error) {
                // Profile not found fallback
                const newProfile = {
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
                    avatar_url: session.user.user_metadata?.avatar_url,
                    role: 'user',
                    status: 'active',
                    balance: 0
                }
                
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert(newProfile)
                
                if (!insertError) {
                    setProfile(newProfile as any)
                }
            }
        } else {
            setUser(null)
            setProfile(null)
        }
      } catch (error) {
        console.error("Auth state change error:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setProfile, setLoading])

  return <>{children}</>
}
