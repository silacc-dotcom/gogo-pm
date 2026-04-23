import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, CheckSquare, FileText, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { StatCard } from '@/components/ui/StatCard'
import { TaskItem } from '@/components/tasks/TaskItem'
import { ReminderItem } from '@/components/reminders/ReminderItem'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { SkeletonStat, SkeletonList } from '@/components/ui/SkeletonLoader'
import { formatDate } from '@/lib/utils'
import type { Task, Reminder } from '@/types'

function useGreeting(name: string | undefined) {
  const hour = new Date().getHours()
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const first = name?.split(' ')[0] ?? ''
  return `Good ${time}${first ? `, ${first}` : ''}`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { profile, agency } = useAuthStore()
  const [fabOpen, setFabOpen] = useState(false)
  const greeting = useGreeting(profile?.full_name)
  const today = format(new Date(), 'yyyy-MM-dd')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', profile?.agency_id],
    queryFn: async () => {
      const [props, tasksToday, tasksOverdue, inspections] = await Promise.all([
        supabase.from('properties').select('id, status', { count: 'exact' }).eq('agency_id', profile!.agency_id),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('agency_id', profile!.agency_id).eq('status', 'pending').eq('due_date', today),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('agency_id', profile!.agency_id).eq('status', 'pending').lt('due_date', today),
        supabase.from('tasks').select('id', { count: 'exact' }).eq('agency_id', profile!.agency_id).eq('status', 'pending').eq('category', 'inspection').gte('due_date', today).lte('due_date', format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd'))
      ])
      const vacant = props.data?.filter(p => p.status === 'vacant').length ?? 0
      return {
        totalProperties: props.count ?? 0,
        vacant,
        tasksToday: tasksToday.count ?? 0,
        tasksOverdue: tasksOverdue.count ?? 0,
        inspections: inspections.count ?? 0
      }
    },
    enabled: !!profile?.agency_id
  })

  const { data: urgentTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['urgent-tasks', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, property:properties(address, suburb)')
        .eq('agency_id', profile!.agency_id)
        .eq('status', 'pending')
        .in('priority', ['urgent', 'high'])
        .order('due_date', { ascending: true })
        .limit(4)
      return (data ?? []) as Task[]
    },
    enabled: !!profile?.agency_id
  })

  const { data: upcomingReminders } = useQuery({
    queryKey: ['upcoming-reminders', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reminders')
        .select('*, property:properties(address)')
        .eq('agency_id', profile!.agency_id)
        .eq('dismissed', false)
        .order('due_date', { ascending: true })
        .limit(4)
      return (data ?? []) as Reminder[]
    },
    enabled: !!profile?.agency_id
  })

  const toggleTask = async (id: string) => {
    await supabase.from('tasks').update({ status: 'complete' }).eq('id', id)
  }

  const dismissReminder = async (id: string) => {
    await supabase.from('reminders').update({ dismissed: true }).eq('id', id)
  }

  const snoozeReminder = async (id: string, weeks: number) => {
    const { data } = await supabase.from('reminders').select('due_date').eq('id', id).single()
    if (!data) return
    const newDate = new Date(data.due_date)
    newDate.setDate(newDate.getDate() + weeks * 7)
    await supabase.from('reminders').update({ due_date: newDate.toISOString().split('T')[0] }).eq('id', id)
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A1714]" style={{ fontFamily: 'Playfair Display, serif' }}>
          {greeting}
        </h1>
        <p className="text-sm text-[#6B6560] mt-0.5">{agency?.name} · {formatDate(new Date().toISOString())}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {statsLoading ? (
          [0,1,2,3].map(i => <SkeletonStat key={i} />)
        ) : (
          <>
            <StatCard
              label="Properties"
              value={stats?.totalProperties ?? 0}
              subtitle={stats?.vacant ? `${stats.vacant} vacant` : 'All leased'}
              onClick={() => navigate('/properties')}
            />
            <StatCard
              label="Tasks today"
              value={stats?.tasksToday ?? 0}
              variant={stats?.tasksToday ? 'red' : 'default'}
              onClick={() => navigate('/tasks')}
            />
            <StatCard
              label="Overdue tasks"
              value={stats?.tasksOverdue ?? 0}
              variant={stats?.tasksOverdue ? 'red' : 'default'}
              onClick={() => navigate('/tasks')}
            />
            <StatCard
              label="Inspections this week"
              value={stats?.inspections ?? 0}
              variant={stats?.inspections ? 'amber' : 'default'}
              onClick={() => navigate('/tasks')}
            />
          </>
        )}
      </div>

      {/* Urgent tasks */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1A1714]">Urgent tasks</h2>
          <button onClick={() => navigate('/tasks')} className="text-xs text-[#2C5F3F] font-medium">See all</button>
        </div>
        {tasksLoading ? <SkeletonList count={2} /> : urgentTasks?.length === 0 ? (
          <p className="text-sm text-[#9C968F] py-4 text-center">No urgent tasks — nice work!</p>
        ) : (
          <div className="space-y-2">
            {urgentTasks?.map(task => (
              <TaskItem key={task.id} task={task} onToggleComplete={toggleTask} />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming reminders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-[#1A1714]">Upcoming reminders</h2>
          <button onClick={() => navigate('/tools')} className="text-xs text-[#2C5F3F] font-medium">See all</button>
        </div>
        {upcomingReminders?.length === 0 ? (
          <p className="text-sm text-[#9C968F] py-4 text-center">No upcoming reminders</p>
        ) : (
          <div className="space-y-2">
            {upcomingReminders?.map(r => (
              <ReminderItem key={r.id} reminder={r} onDismiss={dismissReminder} onSnooze={snoozeReminder} />
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      <button
        onClick={() => setFabOpen(true)}
        className="fixed bottom-[calc(var(--bottom-nav-height)+16px)] right-4 w-14 h-14 bg-[#2C5F3F] text-white rounded-full shadow-lg flex items-center justify-center active:scale-95 z-30"
        aria-label="Quick actions"
      >
        <Plus size={26} />
      </button>

      <BottomSheet open={fabOpen} onClose={() => setFabOpen(false)} title="Quick actions">
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: CheckSquare, label: 'New task', to: '/tasks/new' },
            { icon: FileText, label: 'Start form', to: '/forms' },
            { icon: Building2, label: 'Add property', to: '/properties/new' },
          ].map(({ icon: Icon, label, to }) => (
            <button
              key={to}
              onClick={() => { setFabOpen(false); navigate(to) }}
              className="flex items-center gap-4 px-4 py-4 bg-[#F7F5F0] rounded-xl text-sm font-medium text-[#1A1714] active:bg-[#E8F1EC]"
            >
              <Icon size={20} className="text-[#2C5F3F]" />
              {label}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}
