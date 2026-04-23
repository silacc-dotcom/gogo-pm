import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { WizardStepWrapper } from '@/components/forms/WizardStep'
import { REIHandoffPanel } from '@/pages/forms/REIHandoffPanel'
import { formatDate, addDays } from '@/lib/utils'
import type { Property } from '@/types'
import { cn } from '@/lib/utils'

type Condition = 'good' | 'fair' | 'poor'

interface RoomReport {
  condition: Condition | ''
  notes: string
}

interface InspectionData {
  property_id: string
  inspection_date: string
  inspection_time: string
  overall_notes: string
  maintenance_items: string
  rooms: Record<string, RoomReport>
}

const ROOMS = ['Entry / hallway', 'Living / dining', 'Kitchen', 'Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Bathroom', 'Laundry', 'Exterior / yard', 'Garage']

const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

export function FM00104Wizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const qc = useQueryClient()

  const [phase, setPhase] = useState(searchParams.get('propertyId') ? 1 : 0)
  const [data, setData] = useState<Partial<InspectionData>>({
    property_id: searchParams.get('propertyId') ?? '',
    rooms: Object.fromEntries(ROOMS.map(r => [r, { condition: '', notes: '' }]))
  })

  const { data: properties } = useQuery({
    queryKey: ['properties-select', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*').eq('agency_id', profile!.agency_id).order('address')
      return (data ?? []) as Property[]
    },
    enabled: !!profile?.agency_id
  })

  const selectedProperty = properties?.find(p => p.id === data.property_id)
  const up = (updates: Partial<InspectionData>) => setData(d => ({ ...d, ...updates }))

  const updateRoom = (room: string, updates: Partial<RoomReport>) => {
    setData(d => ({
      ...d,
      rooms: { ...(d.rooms ?? {}), [room]: { ...(d.rooms?.[room] ?? { condition: '', notes: '' }), ...updates } }
    }))
  }

  const createMaintenanceTasks = async () => {
    if (!profile || !data.property_id || !data.maintenance_items?.trim()) return
    const items = data.maintenance_items.split('\n').filter(Boolean)
    await supabase.from('tasks').insert(
      items.map(item => ({
        title: item.trim(),
        agency_id: profile.agency_id,
        user_id: profile.id,
        property_id: data.property_id,
        status: 'pending',
        priority: 'normal',
        category: 'maintenance',
        due_date: addDays(new Date(), 7).toISOString().split('T')[0],
        description: `From routine inspection ${formatDate(data.inspection_date)}`,
        form_code: null,
        linked_reminder_id: null
      }))
    )
    qc.invalidateQueries({ queryKey: ['tasks'] })
    addToast(`${items.length} maintenance task(s) created`)
  }

  if (phase === 0) {
    return (
      <WizardStepWrapper title="Select property" step={1} totalSteps={4} onBack={() => navigate(-1)} onNext={() => { if (data.property_id) setPhase(1) }} nextDisabled={!data.property_id} nextLabel="Continue">
        <div className="space-y-3">
          {properties?.map(p => (
            <button key={p.id} onClick={() => up({ property_id: p.id })} className={cn('w-full p-4 rounded-xl border text-left', data.property_id === p.id ? 'border-[#2C5F3F] bg-[#E8F1EC]' : 'border-[#E2DDD5] bg-white')}>
              <p className="text-sm font-semibold text-[#1A1714]">{p.address}</p>
              <p className="text-xs text-[#6B6560]">{p.suburb} · Tenant: {p.tenant_name ?? 'N/A'}</p>
            </button>
          ))}
        </div>
      </WizardStepWrapper>
    )
  }

  if (phase === 1) {
    return (
      <WizardStepWrapper title="Inspection details" step={2} totalSteps={4} onBack={() => setPhase(0)} onNext={() => setPhase(2)} nextDisabled={!data.inspection_date}>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E2DDD5] p-4">
            <p className="text-xs text-[#9C968F]">Property</p>
            <p className="text-sm font-semibold text-[#1A1714]">{selectedProperty?.address}</p>
            <p className="text-xs text-[#6B6560]">Tenant: {selectedProperty?.tenant_name}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Inspection date</label>
              <input type="date" value={data.inspection_date ?? ''} onChange={e => up({ inspection_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Time</label>
              <input type="time" value={data.inspection_time ?? ''} onChange={e => up({ inspection_time: e.target.value })} className={inputClass} />
            </div>
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  if (phase === 2) {
    return (
      <WizardStepWrapper title="Room-by-room condition" step={3} totalSteps={4} onBack={() => setPhase(1)} onNext={() => setPhase(3)}>
        <div className="space-y-4">
          {ROOMS.map(room => {
            const roomData = data.rooms?.[room] ?? { condition: '', notes: '' }
            return (
              <div key={room} className="bg-white rounded-xl border border-[#E2DDD5] p-4">
                <p className="text-sm font-semibold text-[#1A1714] mb-3">{room}</p>
                <div className="flex gap-2 mb-3">
                  {(['good', 'fair', 'poor'] as Condition[]).map(c => (
                    <button
                      key={c}
                      onClick={() => updateRoom(room, { condition: c })}
                      className={cn(
                        'flex-1 py-2 rounded-lg border text-xs font-semibold capitalize',
                        roomData.condition === c
                          ? c === 'good' ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white'
                            : c === 'fair' ? 'bg-[#C47D1A] border-[#C47D1A] text-white'
                            : 'bg-[#C0392B] border-[#C0392B] text-white'
                          : 'bg-[#F0EDE6] border-[#E2DDD5] text-[#6B6560]'
                      )}
                    >{c}</button>
                  ))}
                </div>
                <textarea
                  value={roomData.notes}
                  onChange={e => updateRoom(room, { notes: e.target.value })}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] resize-none"
                />
              </div>
            )
          })}
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Overall summary notes</label>
            <textarea value={data.overall_notes ?? ''} onChange={e => up({ overall_notes: e.target.value })} rows={3} placeholder="General observations…" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Maintenance items identified (one per line)</label>
            <textarea value={data.maintenance_items ?? ''} onChange={e => up({ maintenance_items: e.target.value })} rows={4} placeholder="e.g. Fix leaking tap in bathroom&#10;Replace blown lightbulb in kitchen" className={inputClass} />
            <p className="text-xs text-[#9C968F] mt-1">Tasks will be auto-created for each item</p>
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  const sections = [
    {
      title: 'Inspection details',
      fields: [
        { label: 'Property', value: selectedProperty ? `${selectedProperty.address}, ${selectedProperty.suburb}` : undefined },
        { label: 'Tenant', value: selectedProperty?.tenant_name },
        { label: 'Inspector', value: profile?.full_name },
        { label: 'Date', value: formatDate(data.inspection_date) },
        { label: 'Time', value: data.inspection_time }
      ]
    },
    {
      title: 'Room conditions',
      fields: ROOMS.map(r => ({
        label: r,
        value: data.rooms?.[r]?.condition ? `${data.rooms[r].condition.toUpperCase()}${data.rooms[r].notes ? ' — ' + data.rooms[r].notes : ''}` : undefined
      }))
    },
    {
      title: 'Summary',
      fields: [
        { label: 'Overall notes', value: data.overall_notes },
        { label: 'Maintenance items', value: data.maintenance_items }
      ]
    }
  ]

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7F5F0]">
      <div className="h-1 bg-[#2C5F3F]" />
      <div className="flex items-center px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button onClick={() => setPhase(2)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5] mr-3">←</button>
        <div>
          <h1 className="text-lg font-bold text-[#1A1714]" style={{ fontFamily: 'Playfair Display, serif' }}>FM00104 — Inspection Report</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <REIHandoffPanel sections={sections} formCode="FM00104" />
        {data.maintenance_items?.trim() && (
          <div className="mt-4">
            <button onClick={createMaintenanceTasks} className="w-full py-3 bg-[#FDF3E3] text-[#C47D1A] border border-[#C47D1A]/30 rounded-xl text-sm font-medium">
              Create maintenance tasks from items
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
