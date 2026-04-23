import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile, Agency } from '@/types'

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  agency: Agency | null
  loading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setProfile: (profile: Profile | null) => void
  setAgency: (agency: Agency | null) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      agency: null,
      loading: true,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setAgency: (agency) => set({ agency }),
      setLoading: (loading) => set({ loading }),
      reset: () => set({ user: null, session: null, profile: null, agency: null, loading: false })
    }),
    {
      name: 'gogo-auth',
      partialize: (state) => ({ profile: state.profile, agency: state.agency })
    }
  )
)
