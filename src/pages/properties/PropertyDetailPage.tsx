import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Plus, FileText, Bell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/layout/AppHeader'
import { SkeletonCard } from '@/components/ui/SkeletonLoader'
import { TaskItem } from '@/components/tasks/TaskItem'
import { ReminderItem } from '@/components/reminders/ReminderItem'
import { CRMSourceChip } from '@/components/ui/CRMSourceChip'
import { formatDate, formatRent, formatPhone, formatCurrency, daysUntil, leaseUrgency, cn } from '@/lib/utils'
import type { Property, Task, Reminder, FormDraft } from '@/types'

function LeaseProgress({ leaseStart, leaseEnd }: { leaseStart: string | null; leaseEnd: string | null }) {
  if (!leaseStart || !leaseEnd) return null
  const total = new Date(leaseEnd).getTime() - new Date(leaseStart).getTime()
  const elapsed = Date.now() - new Date(leaseStart).getTime()
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100))
  const days = daysUntil(leaseEnd)
  const urgency = leaseUrgency(leaseEnd)
  const barColor = urgency === 'red' ? 'bg-[#C0392B]' : urgency === 'amber' ? 'bg-[#C47D1A]' : 'bg-[#2C5F3F]'

  return (
    <div>
      <div className="flex justify-between text-xs text-[#6B6560] mb-1.5">
        <span>Lease start: {formatDate(leaseStart)}</span>
        <span>End: {formatDate(leaseEnd)}</span>
      </div>
      <div className="h-2 bg-[#E2DDD5] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
      </div>
      <p className={cn('text-xs mt-1 font-medium', urgency === 'red' ? 'text-[#C0392B]' : urgency === 'amber' ? 'text-[#C47D1A]' : 'text-[#6B6560]')}>
        {days === null ? '' : days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days to expiry`}
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start py-2 border-b border-[#F0EDE6] last:border-0">
      <span className="text-xs text-[#9C968F] flex-1">{label}</span>
      <span className="text-sm text-[#1A1714] font-medium text-right ml-4 flex-1">{value}</span>
    </div>
  )
}

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*').eq('id', id!).single()
      return data as Property
    },
    enabled: !!id
  })

  const { data: tasks } = useQuery({
    queryKey: ['property-tasks', id],
    queryFn: async () => {
      const { data } = await supabase.from('tasks').select('*, property:properties(address)').eq('property_id', id!).eq('status', 'pending').order('due_date')
      return (data ?? []) as Task[]
    },
    enabled: !!id
  })

  const { data: reminders } = useQuery({
    queryKey: ['property-reminders', id],
    queryFn: async () => {
      const { data } = await supabase.from('reminders').select('*, property:properties(address)').eq('property_id', id!).eq('dismissed', false).order('due_date')
      return (data ?? []) as Reminder[]
    },
    enabled: !!id
  })

  const { data: formDrafts } = useQuery({
    queryKey: ['property-forms', id],
    queryFn: async () => {
      const { data } = await supabase.from('form_drafts').select('*').eq('property_id', id!).order('created_at', { ascending: false })
      return (data ?? []) as FormDraft[]
    },
    enabled: !!id
  })

  if (isLoading) return <div className="px-4 pt-4"><SkeletonCard /></div>
  if (!property) return <div className="px-4 pt-4 text-sm text-[#6B6560]">Property not found</div>

  const toggleTask = async (taskId: string) => {
    await supabase.from('tasks').update({ status: 'complete' }).eq('id', taskId)
  }

  const dismissReminder = async (reminderId: string) => {
    await supabase.from('reminders').update({ dismissed: true }).eq('id', reminderId)
  }

  const snoozeReminder = async (reminderId: string, weeks: number) => {
    const { data } = await supabase.from('reminders').select('due_date').eq('id', reminderId).single()
    if (!data) return
    const newDate = new Date(data.due_date)
    newDate.setDate(newDate.getDate() + weeks * 7)
    await supabase.from('reminders').update({ due_date: newDate.toISOString().split('T')[0] }).eq('id', reminderId)
  }

  const statusConfig = { leased: 'bg-[#E8F1EC] text-[#2C5F3F]', vacant: 'bg-[#FDECEA] text-[#C0392B]', for_lease: 'bg-[#FDF3E3] text-[#C47D1A]' }
  const statusLabel = { leased: 'Leased', vacant: 'Vacant', for_lease: 'For Lease' }

  return (
    <div className="flex flex-col">
      <AppHeader
        title={property.address}
        subtitle={`${property.suburb} ${property.state} ${property.postcode}`}
        back
        right={
          <button onClick={() => navigate(`/properties/${id}/edit`)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5]">
            <Edit size={16} className="text-[#1A1714]" />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-5">
        {/* Status + source */}
        <div className="flex items-center gap-2">
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium', statusConfig[property.status])}>
            {statusLabel[property.status]}
          </span>
          <CRMSourceChip source={property.import_source} />
        </div>

        {/* Lease progress */}
        <div className="bg-white rounded-xl p-4 border border-[#E2DDD5]">
          <p className="text-sm font-semibold text-[#1A1714] mb-3">Lease</p>
          <LeaseProgress leaseStart={property.lease_start} leaseEnd={property.lease_end} />
          <div className="mt-3 space-y-0">
            <InfoRow label="Rent" value={formatRent(property.rent_amount, property.rent_frequency)} />
            <InfoRow label="Bond" value={formatCurrency(property.bond_amount)} />
          </div>
        </div>

        {/* Tenant */}
        {property.tenant_name && (
          <div className="bg-white rounded-xl p-4 border border-[#E2DDD5]">
            <p className="text-sm font-semibold text-[#1A1714] mb-3">Tenant</p>
            <InfoRow label="Name" value={property.tenant_name} />
            <InfoRow label="Email" value={property.tenant_email} />
            <InfoRow label="Phone" value={formatPhone(property.tenant_phone)} />
          </div>
        )}

        {/* Landlord */}
        {property.landlord_name && (
          <div className="bg-white rounded-xl p-4 border border-[#E2DDD5]">
            <p className="text-sm font-semibold text-[#1A1714] mb-3">Landlord</p>
            <InfoRow label="Name" value={property.landlord_name} />
            <InfoRow label="Email" value={property.landlord_email} />
            <InfoRow label="Phone" value={formatPhone(property.landlord_phone)} />
            <InfoRow label="ABN" value={property.landlord_abn} />
          </div>
        )}

        {/* Property details */}
        <div className="bg-white rounded-xl p-4 border border-[#E2DDD5]">
          <p className="text-sm font-semibold text-[#1A1714] mb-3">Property details</p>
          <InfoRow label="Type" value={property.property_type} />
          <InfoRow label="Bedrooms" value={property.bedrooms?.toString()} />
          <InfoRow label="Bathrooms" value={property.bathrooms?.toString()} />
          <InfoRow label="Parking" value={property.parking?.toString()} />
          <InfoRow label="Water efficient" value={property.water_efficient ? 'Yes' : property.water_efficient === false ? 'No' : undefined} />
          <InfoRow label="Pets" value={property.pets_allowed ? 'Allowed' : property.pets_allowed === false ? 'Not allowed' : undefined} />
          {property.notes && <div className="pt-2"><p className="text-xs text-[#9C968F]">Notes</p><p className="text-sm text-[#1A1714] mt-1">{property.notes}</p></div>}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: FileText, label: 'Start form', onClick: () => navigate(`/forms?propertyId=${id}`) },
            { icon: Plus, label: 'Add task', onClick: () => navigate(`/tasks/new?propertyId=${id}`) },
            { icon: Bell, label: 'Add reminder', onClick: () => navigate(`/tools?tab=reminders&propertyId=${id}`) },
          ].map(({ icon: Icon, label, onClick }) => (
            <button key={label} onClick={onClick} className="flex flex-col items-center gap-1.5 py-3 bg-white rounded-xl border border-[#E2DDD5] text-xs font-medium text-[#1A1714] active:bg-[#F7F5F0]">
              <Icon size={18} className="text-[#2C5F3F]" />
              {label}
            </button>
          ))}
        </div>

        {/* Tasks */}
        {tasks && tasks.length > 0 && (
          <section>
            <p className="text-sm font-semibold text-[#1A1714] mb-2">Tasks ({tasks.length})</p>
            <div className="space-y-2">
              {tasks.map(t => <TaskItem key={t.id} task={t} onToggleComplete={toggleTask} />)}
            </div>
          </section>
        )}

        {/* Reminders */}
        {reminders && reminders.length > 0 && (
          <section>
            <p className="text-sm font-semibold text-[#1A1714] mb-2">Reminders ({reminders.length})</p>
            <div className="space-y-2">
              {reminders.map(r => <ReminderItem key={r.id} reminder={r} onDismiss={dismissReminder} onSnooze={snoozeReminder} />)}
            </div>
          </section>
        )}

        {/* Form history */}
        {formDrafts && formDrafts.length > 0 && (
          <section>
            <p className="text-sm font-semibold text-[#1A1714] mb-2">Form history</p>
            <div className="space-y-2">
              {formDrafts.map(f => (
                <div key={f.id} className="bg-white rounded-xl border border-[#E2DDD5] p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#1A1714]">{f.form_name}</p>
                    <p className="text-xs text-[#9C968F]">{formatDate(f.created_at)}</p>
                  </div>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', f.status === 'sent' ? 'bg-[#E8F1EC] text-[#2C5F3F]' : f.status === 'ready' ? 'bg-[#FDF3E3] text-[#C47D1A]' : 'bg-[#F0EDE6] text-[#6B6560]')}>
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
