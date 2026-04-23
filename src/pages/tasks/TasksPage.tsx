import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { AppHeader } from '@/components/layout/AppHeader'
import { TaskItem } from '@/components/tasks/TaskItem'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { CheckSquare } from 'lucide-react'
import type { Task } from '@/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

function groupTasks(tasks: Task[]) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const weekEnd = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')

  return {
    overdue: tasks.filter(t => t.due_date && t.due_date < today && t.status === 'pending'),
    today: tasks.filter(t => t.due_date === today && t.status === 'pending'),
    thisWeek: tasks.filter(t => t.due_date && t.due_date > today && t.due_date <= weekEnd && t.status === 'pending'),
    upcoming: tasks.filter(t => t.due_date && t.due_date > weekEnd && t.status === 'pending'),
    noDue: tasks.filter(t => !t.due_date && t.status === 'pending'),
    done: tasks.filter(t => t.status === 'complete')
  }
}

export function TasksPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const qc = useQueryClient()

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*, property:properties(address, suburb)')
        .eq('agency_id', profile!.agency_id)
        .order('due_date', { ascending: true, nullsFirst: false })
      return (data ?? []) as Task[]
    },
    enabled: !!profile?.agency_id
  })

  const groups = tasks ? groupTasks(tasks) : null

  const toggleTask = async (id: string) => {
    const task = tasks?.find(t => t.id === id)
    const newStatus = task?.status === 'complete' ? 'pending' : 'complete'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['tasks'] })
    addToast(newStatus === 'complete' ? 'Task completed' : 'Task reopened')
  }

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['tasks'] })
    addToast('Task deleted')
  }

  const startForm = (formCode: string) => navigate(`/forms/wizard/${formCode}`)

  return (
    <div>
      <AppHeader
        title="Tasks"
        right={
          <button onClick={() => navigate('/tasks/new')} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2C5F3F] text-white">
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-4 py-3 space-y-5">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : tasks?.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="No tasks yet"
            description="Create your first task to stay on top of your portfolio"
            action={{ label: 'Add task', onClick: () => navigate('/tasks/new') }}
          />
        ) : (
          <>
            {groups?.overdue && groups.overdue.length > 0 && (
              <Group label="Overdue" count={groups.overdue.length} urgent>
                {groups.overdue.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} onDelete={deleteTask} onStartForm={startForm} />)}
              </Group>
            )}
            {groups?.today && groups.today.length > 0 && (
              <Group label="Due today" count={groups.today.length} urgent>
                {groups.today.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} onDelete={deleteTask} onStartForm={startForm} />)}
              </Group>
            )}
            {groups?.thisWeek && groups.thisWeek.length > 0 && (
              <Group label="This week" count={groups.thisWeek.length}>
                {groups.thisWeek.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} onDelete={deleteTask} onStartForm={startForm} />)}
              </Group>
            )}
            {groups?.upcoming && groups.upcoming.length > 0 && (
              <Group label="Upcoming" count={groups.upcoming.length}>
                {groups.upcoming.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} onDelete={deleteTask} onStartForm={startForm} />)}
              </Group>
            )}
            {groups?.noDue && groups.noDue.length > 0 && (
              <Group label="No due date" count={groups.noDue.length}>
                {groups.noDue.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} onDelete={deleteTask} onStartForm={startForm} />)}
              </Group>
            )}
            {groups?.done && groups.done.length > 0 && (
              <Group label="Done" count={groups.done.length}>
                {groups.done.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} onDelete={deleteTask} />)}
              </Group>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Group({ label, count, urgent, children }: { label: string; count: number; urgent?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 mb-2 w-full">
        <span className={cn('text-xs font-semibold uppercase tracking-wider', urgent ? 'text-[#C0392B]' : 'text-[#6B6560]')}>{label}</span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-bold', urgent ? 'bg-[#FDECEA] text-[#C0392B]' : 'bg-[#F0EDE6] text-[#6B6560]')}>{count}</span>
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}
