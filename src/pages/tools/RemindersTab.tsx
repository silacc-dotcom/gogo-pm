import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { ReminderItem } from '@/components/reminders/ReminderItem'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { BottomSheet } from '@/components/ui/BottomSheet'
import type { Reminder } from '@/types'
import { addDays, format, parseISO, isAfter, startOfDay, endOfMonth } from 'date-fns'
import { cn } from '@/lib/utils'

function groupReminders(reminders: Reminder[]) {
  const today = startOfDay(new Date())
  const weekEnd = addDays(today, 7)
  const monthEnd = endOfMonth(today)

  return {
    overdue: reminders.filter(r => parseISO(r.due_date) < today),
    thisWeek: reminders.filter(r => {
      const d = parseISO(r.due_date)
      return d >= today && d <= weekEnd
    }),
    thisMonth: reminders.filter(r => {
      const d = parseISO(r.due_date)
      return d > weekEnd && d <= monthEnd
    }),
    future: reminders.filter(r => parseISO(r.due_date) > monthEnd)
  }
}

const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

export function RemindersTab() {
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ title: '', due_date: '', reminder_type: 'compliance', property_id: '' })

  const { data: reminders, isLoading } = useQuery({
    queryKey: ['reminders', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('reminders')
        .select('*, property:properties(address)')
        .eq('agency_id', profile!.agency_id)
        .eq('dismissed', false)
        .order('due_date', { ascending: true })
      return (data ?? []) as Reminder[]
    },
    enabled: !!profile?.agency_id
  })

  const { data: properties } = useQuery({
    queryKey: ['properties-select', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address, suburb').eq('agency_id', profile!.agency_id).order('address')
      return data ?? []
    },
    enabled: !!profile?.agency_id
  })

  const groups = reminders ? groupReminders(reminders) : null

  const dismiss = async (id: string) => {
    await supabase.from('reminders').update({ dismissed: true }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['reminders'] })
    addToast('Reminder dismissed')
  }

  const snooze = async (id: string, weeks: number) => {
    const rem = reminders?.find(r => r.id === id)
    if (!rem) return
    const newDate = addDays(parseISO(rem.due_date), weeks * 7).toISOString().split('T')[0]
    await supabase.from('reminders').update({ due_date: newDate }).eq('id', id)
    qc.invalidateQueries({ queryKey: ['reminders'] })
    addToast(`Snoozed ${weeks} week${weeks > 1 ? 's' : ''}`)
  }

  const addReminder = async () => {
    if (!profile || !form.title || !form.due_date) return
    await supabase.from('reminders').insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      property_id: form.property_id || null,
      title: form.title,
      due_date: form.due_date,
      reminder_type: form.reminder_type,
      recurrence: 'none',
      push_notified: false,
      dismissed: false
    })
    qc.invalidateQueries({ queryKey: ['reminders'] })
    addToast('Reminder created')
    setAddOpen(false)
    setForm({ title: '', due_date: '', reminder_type: 'compliance', property_id: '' })
  }

  return (
    <div className="px-4 pb-6 space-y-5">
      <button onClick={() => setAddOpen(true)} className="w-full py-3 border-2 border-dashed border-[#E2DDD5] rounded-xl text-sm font-medium text-[#6B6560] flex items-center justify-center gap-2">
        <Plus size={16} />
        Add reminder
      </button>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : reminders?.length === 0 ? (
        <EmptyState icon={Bell} title="No reminders" description="System reminders are created automatically when you add lease dates" action={{ label: 'Add reminder', onClick: () => setAddOpen(true) }} />
      ) : (
        <>
          {groups?.overdue && groups.overdue.length > 0 && (
            <Group label="Overdue" urgent>{groups.overdue.map(r => <ReminderItem key={r.id} reminder={r} onDismiss={dismiss} onSnooze={snooze} />)}</Group>
          )}
          {groups?.thisWeek && groups.thisWeek.length > 0 && (
            <Group label="This week">{groups.thisWeek.map(r => <ReminderItem key={r.id} reminder={r} onDismiss={dismiss} onSnooze={snooze} />)}</Group>
          )}
          {groups?.thisMonth && groups.thisMonth.length > 0 && (
            <Group label="This month">{groups.thisMonth.map(r => <ReminderItem key={r.id} reminder={r} onDismiss={dismiss} onSnooze={snooze} />)}</Group>
          )}
          {groups?.future && groups.future.length > 0 && (
            <Group label="Future">{groups.future.map(r => <ReminderItem key={r.id} reminder={r} onDismiss={dismiss} onSnooze={snooze} />)}</Group>
          )}
        </>
      )}

      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title="New reminder">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Title</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Lease expiry reminder" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Due date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Type</label>
            <select value={form.reminder_type} onChange={e => setForm(f => ({ ...f, reminder_type: e.target.value }))} className={inputClass}>
              <option value="lease_expiry">Lease expiry</option>
              <option value="inspection">Inspection</option>
              <option value="compliance">Compliance</option>
              <option value="rent_arrears">Rent arrears</option>
              <option value="task_due">Task due</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Property (optional)</label>
            <select value={form.property_id} onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))} className={inputClass}>
              <option value="">No property</option>
              {properties?.map((p: { id: string; address: string; suburb: string }) => (
                <option key={p.id} value={p.id}>{p.address}, {p.suburb}</option>
              ))}
            </select>
          </div>
          <button onClick={addReminder} disabled={!form.title || !form.due_date} className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            Create reminder
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}

function Group({ label, urgent, children }: { label: string; urgent?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <p className={cn('text-xs font-semibold uppercase tracking-wider mb-2', urgent ? 'text-[#C0392B]' : 'text-[#6B6560]')}>{label}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}
