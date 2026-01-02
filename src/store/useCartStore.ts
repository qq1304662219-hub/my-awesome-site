import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface CartStore {
  count: number
  fetchCartCount: () => Promise<void>
  setCount: (count: number) => void
}

export const useCartStore = create<CartStore>((set) => ({
  count: 0,
  fetchCartCount: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        set({ count: 0 })
        return
      }

      const { count, error } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (error) throw error
      
      set({ count: count || 0 })
    } catch (error) {
      console.error('Error fetching cart count:', error)
      set({ count: 0 })
    }
  },
  setCount: (count) => set({ count }),
}))
