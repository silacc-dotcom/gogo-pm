import { useAuthStore } from '@/stores/authStore'

export function usePlan() {
  const agency = useAuthStore((s) => s.agency)
  const tier = agency?.subscription_tier ?? 'free'
  const isPremium = tier === 'premium'
  const maxProperties = agency?.max_properties ?? 5

  return { tier, isPremium, maxProperties }
}
