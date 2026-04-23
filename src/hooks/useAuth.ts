import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'

export function useAuthInit() {
  const { setUser, setSession, setProfile, setAgency, setLoading, reset } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'SIGNED_IN' && session?.user) {
        await loadProfile(session.user.id)
      }
      if (event === 'SIGNED_OUT') {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) {
      setProfile(profile)
      const { data: agency } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', profile.agency_id)
        .single()
      if (agency) setAgency(agency)
    }
  }
}
