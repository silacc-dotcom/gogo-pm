import { NavLink, useLocation } from 'react-router-dom'
import { Home, Building2, CheckSquare, FileText, Wrench, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { isAfter, parseISO, startOfDay } from 'date-fns'

const tabs = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/properties', icon: Building2, label: 'Properties' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/forms', icon: FileText, label: 'Forms' },
  { to: '/tools', icon: Wrench, label: 'Tools' },
  { to: '/account', icon: User, label: 'Account' }
]

function useTaskBadge() {
  const profile = useAuthStore((s) => s.profile)
  const { data } = useQuery({
    queryKey: ['task-badge', profile?.id],
    queryFn: async () => {
      const today = startOfDay(new Date()).toISOString().split('T')[0]
      const { data } = await supabase
        .from('tasks')
        .select('due_date')
        .eq('status', 'pending')
        .lte('due_date', today)
      return data?.length ?? 0
    },
    enabled: !!profile,
    refetchInterval: 60000
  })
  return data ?? 0
}

export function BottomNav() {
  const location = useLocation()
  const taskBadge = useTaskBadge()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2DDD5] flex items-stretch"
      style={{ height: 'var(--bottom-nav-height)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {tabs.map(({ to, icon: Icon, label }) => {
        const isActive = location.pathname.startsWith(to)
        const badge = to === '/tasks' ? taskBadge : 0

        return (
          <NavLink
            key={to}
            to={to}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 min-w-[44px] relative',
              'transition-colors active:bg-[#F7F5F0]',
              isActive ? 'text-[#2C5F3F]' : 'text-[#9C968F]'
            )}
          >
            <div className="relative">
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C0392B] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </div>
            <span className={cn('text-[10px] leading-none', isActive ? 'font-semibold' : 'font-normal')}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}
