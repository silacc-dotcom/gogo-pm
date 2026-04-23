import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { WizardStepWrapper } from '@/components/forms/WizardStep'
import { LegislationChip } from '@/components/ui/LegislationChip'
import { REIHandoffPanel } from '@/pages/forms/REIHandoffPanel'
import { formatCurrency, addWorkingDays, addDays, formatDate } from '@/lib/utils'
import type { Property } from '@/types'
import { cn } from '@/lib/utils'

// Auto-save interval: 30 seconds
const AUTOSAVE_INTERVAL = 30000

type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 0

interface WizardData {
  // Phase 0 - Property selection
  property_id: string

  // Phase 1 - Parties
  landlord_name: string
  landlord_address: string
  landlord_abn: string
  landlord_phone: string
  landlord_email: string
  managed_by_agent: boolean
  agent_name: string
  agent_agency: string
  agent_licence: string
  agent_address: string
  agent_phone: string
  agent_email: string
  tenant_count: number
  tenants: {
    name: string; dob: string; phone: string; email: string; emergency_contact: string
  }[]

  // Phase 2 - Lease
  lease_type: 'fixed' | 'periodic'
  lease_start: string
  lease_end: string
  weekly_rent: number
  rent_frequency: 'weekly' | 'fortnightly' | 'monthly'
  payment_method: 'bank_transfer' | 'deft' | 'other'
  first_rent_due: string
  rent_review_clause: boolean

  // Phase 3 - Bond
  bond_required: boolean
  bond_amount: number

  // Phase 4 - Water
  wels_3star: boolean
  dual_flush: boolean
  water_meter_reading: string

  // Phase 5 - Inclusions
  inclusions: string[]
  pets: 'yes' | 'no' | 'negotiable'

  // Phase 6 - Special conditions
  special_conditions: string

  // Phase 7 - Disclosures
  material_facts: string
  smoke_alarm_compliant: boolean
  pool_on_property: boolean

  // Meta
  draftId?: string
}

const TOTAL_PHASES = 8
const INCLUSION_OPTIONS = [
  'Dishwasher', 'Washing machine', 'Dryer', 'Fridge', 'Air conditioning',
  'Ceiling fans', 'Garden', 'Parking space', 'Storage cage'
]
const CLAUSE_TEMPLATES = [
  'The tenant must maintain the garden and lawns in a neat and tidy condition.',
  'The tenant must have the premises professionally cleaned on vacate.',
  'No smoking is permitted on the premises or in any common areas.',
  'The tenant must arrange and pay for pest control treatment on vacate.'
]

const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

export function FM00401Wizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const qc = useQueryClient()
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const initialPropertyId = searchParams.get('propertyId') ?? ''
  const [phase, setPhase] = useState<Phase>(initialPropertyId ? 1 : 0)
  const [data, setData] = useState<Partial<WizardData>>({
    property_id: initialPropertyId,
    managed_by_agent: true,
    tenant_count: 1,
    tenants: [{ name: '', dob: '', phone: '', email: '', emergency_contact: '' }],
    lease_type: 'fixed',
    rent_frequency: 'weekly',
    payment_method: 'bank_transfer',
    bond_required: true,
    wels_3star: false,
    dual_flush: false,
    inclusions: [],
    pets: 'no',
    smoke_alarm_compliant: false,
    pool_on_property: false,
    rent_review_clause: false
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

  useEffect(() => {
    if (selectedProperty && phase === 1 && !data.landlord_name) {
      setData(d => ({
        ...d,
        landlord_name: selectedProperty.landlord_name ?? '',
        landlord_phone: selectedProperty.landlord_phone ?? '',
        landlord_email: selectedProperty.landlord_email ?? '',
        landlord_abn: selectedProperty.landlord_abn ?? '',
        agent_name: profile?.full_name ?? '',
        agent_phone: profile?.phone ?? '',
        agent_email: profile?.rei_forms_live_email ?? '',
        agent_licence: '',
        tenants: [{ name: selectedProperty.tenant_name ?? '', dob: '', phone: selectedProperty.tenant_phone ?? '', email: selectedProperty.tenant_email ?? '', emergency_contact: '' }],
        weekly_rent: selectedProperty.rent_amount ?? 0,
        rent_frequency: selectedProperty.rent_frequency ?? 'weekly',
        lease_start: selectedProperty.lease_start ?? '',
        lease_end: selectedProperty.lease_end ?? '',
        bond_amount: selectedProperty.bond_amount ?? 0
      }))
    }
  }, [selectedProperty, phase])

  // Auto-save
  useEffect(() => {
    autosaveRef.current = setInterval(() => saveDraft(), AUTOSAVE_INTERVAL)
    return () => { if (autosaveRef.current) clearInterval(autosaveRef.current) }
  }, [data])

  const saveDraft = async () => {
    if (!profile || !data.property_id) return
    const payload = {
      agency_id: profile.agency_id,
      user_id: profile.id,
      property_id: data.property_id,
      form_code: 'FM00401',
      form_name: 'Residential Tenancy Agreement',
      form_data: data,
      status: 'draft' as const
    }
    if (data.draftId) {
      await supabase.from('form_drafts').update(payload).eq('id', data.draftId)
    } else {
      const { data: saved } = await supabase.from('form_drafts').insert(payload).select().single()
      if (saved) setData(d => ({ ...d, draftId: saved.id }))
    }
  }

  const next = () => setPhase(p => (p < TOTAL_PHASES ? (p + 1) as Phase : p))
  const back = () => setPhase(p => (p > 0 ? (p - 1) as Phase : p))

  const up = (updates: Partial<WizardData>) => setData(d => ({ ...d, ...updates }))

  // Bond calculation
  const maxBond = data.weekly_rent ? (data.weekly_rent <= 900 ? data.weekly_rent * 4 : null) : null

  // Auto-create tasks on completion
  const createTasks = async () => {
    if (!profile || !data.property_id || !data.lease_start) return
    const leaseStart = new Date(data.lease_start)
    const leaseEnd = data.lease_end ? new Date(data.lease_end) : null

    const tasks = [
      { title: 'Lodge bond with NSW Fair Trading', due_date: addWorkingDays(leaseStart, 10).toISOString().split('T')[0], category: 'compliance' as const, priority: 'urgent' as const, form_code: null },
      { title: 'Complete condition report (FM00409d)', due_date: leaseStart.toISOString().split('T')[0], category: 'form' as const, priority: 'high' as const, form_code: 'FM00409d' },
      { title: 'Serve Landlord Information Statement (FTR-LIS)', due_date: leaseStart.toISOString().split('T')[0], category: 'compliance' as const, priority: 'high' as const, form_code: 'FTR-LIS' },
      { title: 'Smoke alarm compliance check (FM01055)', due_date: addDays(leaseStart, -7).toISOString().split('T')[0], category: 'compliance' as const, priority: 'urgent' as const, form_code: 'FM01055' },
      { title: 'First routine inspection (FM00104)', due_date: addDays(leaseStart, 90).toISOString().split('T')[0], category: 'inspection' as const, priority: 'normal' as const, form_code: 'FM00104' },
    ]

    if (leaseEnd) {
      tasks.push(
        { title: 'Lease expiry reminder — 90 days', due_date: addDays(leaseEnd, -90).toISOString().split('T')[0], category: 'compliance' as const, priority: 'normal' as const, form_code: null },
        { title: 'Lease expiry reminder — 60 days', due_date: addDays(leaseEnd, -60).toISOString().split('T')[0], category: 'compliance' as const, priority: 'high' as const, form_code: null },
        { title: 'Lease expiry reminder — 30 days', due_date: addDays(leaseEnd, -30).toISOString().split('T')[0], category: 'compliance' as const, priority: 'urgent' as const, form_code: null }
      )
    }

    await supabase.from('tasks').insert(
      tasks.map(t => ({
        ...t,
        agency_id: profile.agency_id,
        user_id: profile.id,
        property_id: data.property_id,
        status: 'pending',
        description: null,
        linked_reminder_id: null,
        form_code: t.form_code
      }))
    )

    qc.invalidateQueries({ queryKey: ['tasks'] })
    addToast('Tasks created from RTA')
  }

  const handleComplete = async () => {
    await saveDraft()
    if (data.draftId) {
      await supabase.from('form_drafts').update({ status: 'ready' }).eq('id', data.draftId)
    }
    await createTasks()
  }

  // Phase 0 — Property selection
  if (phase === 0) {
    return (
      <WizardStepWrapper title="Select property" step={1} totalSteps={TOTAL_PHASES + 1} onBack={() => navigate(-1)} onNext={() => { if (data.property_id) next() }} nextDisabled={!data.property_id} nextLabel="Continue">
        <div className="space-y-3">
          {properties?.map(p => (
            <button
              key={p.id}
              onClick={() => up({ property_id: p.id })}
              className={cn(
                'w-full p-4 rounded-xl border text-left',
                data.property_id === p.id ? 'border-[#2C5F3F] bg-[#E8F1EC]' : 'border-[#E2DDD5] bg-white'
              )}
            >
              <p className="text-sm font-semibold text-[#1A1714]">{p.address}</p>
              <p className="text-xs text-[#6B6560]">{p.suburb} {p.state} {p.postcode}</p>
              {p.tenant_name && <p className="text-xs text-[#9C968F] mt-0.5">Tenant: {p.tenant_name}</p>}
            </button>
          ))}
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 1 — Parties
  if (phase === 1) {
    return (
      <WizardStepWrapper title="Parties & property" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={next} nextLabel="Next">
        <div className="space-y-4">
          <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider">Landlord</p>
          {[
            { label: 'Full name', key: 'landlord_name' as const, placeholder: 'John Smith' },
            { label: 'Address', key: 'landlord_address' as const, placeholder: '1 George St, Sydney NSW 2000' },
            { label: 'ABN', key: 'landlord_abn' as const, placeholder: '12 345 678 901' },
            { label: 'Phone', key: 'landlord_phone' as const, placeholder: '0400 000 000' },
            { label: 'Email', key: 'landlord_email' as const, placeholder: 'landlord@example.com' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[#1A1714] mb-1.5">{label}</label>
              <input value={(data[key] as string) ?? ''} onChange={e => up({ [key]: e.target.value })} placeholder={placeholder} className={inputClass} />
            </div>
          ))}

          <div className="pt-2">
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Number of tenants</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => {
                  const count = n
                  const tenants = Array.from({ length: count }, (_, i) => data.tenants?.[i] ?? { name: '', dob: '', phone: '', email: '', emergency_contact: '' })
                  up({ tenant_count: count, tenants })
                }} className={cn('w-12 h-12 rounded-xl border text-sm font-semibold', (data.tenant_count ?? 1) === n ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}>{n}</button>
              ))}
            </div>
          </div>

          {(data.tenants ?? [{ name: '', dob: '', phone: '', email: '', emergency_contact: '' }]).slice(0, data.tenant_count ?? 1).map((tenant, i) => (
            <div key={i} className="pt-2 border-t border-[#F0EDE6]">
              <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider mb-3">Tenant {i + 1}</p>
              {['name', 'dob', 'phone', 'email', 'emergency_contact'].map(field => (
                <div key={field} className="mb-3">
                  <label className="block text-sm font-medium text-[#1A1714] mb-1.5 capitalize">{field.replace('_', ' ')}</label>
                  <input
                    type={field === 'email' ? 'email' : field === 'dob' ? 'date' : field === 'phone' ? 'tel' : 'text'}
                    value={(tenant as Record<string, string>)[field] ?? ''}
                    onChange={e => {
                      const updated = [...(data.tenants ?? [])]
                      updated[i] = { ...updated[i], [field]: e.target.value }
                      up({ tenants: updated })
                    }}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 2 — Lease terms
  if (phase === 2) {
    return (
      <WizardStepWrapper title="Lease terms" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={next}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Lease type</label>
            <div className="flex gap-2">
              {[{ v: 'fixed', l: 'Fixed term' }, { v: 'periodic', l: 'Periodic' }].map(({ v, l }) => (
                <button key={v} onClick={() => up({ lease_type: v as 'fixed' | 'periodic' })} className={cn('flex-1 py-3 rounded-xl border text-sm font-medium', data.lease_type === v ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}>{l}</button>
              ))}
            </div>
          </div>

          {data.lease_type === 'fixed' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Start date</label>
                <input type="date" value={data.lease_start ?? ''} onChange={e => up({ lease_start: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1714] mb-1.5">End date</label>
                <input type="date" value={data.lease_end ?? ''} onChange={e => up({ lease_end: e.target.value })} min={data.lease_start} className={inputClass} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Weekly rent ($)</label>
            <input type="number" inputMode="decimal" value={data.weekly_rent ?? ''} onChange={e => up({ weekly_rent: parseFloat(e.target.value) })} className={inputClass} placeholder="0.00" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Payment frequency</label>
            <div className="flex gap-2">
              {[{ v: 'weekly', l: 'Weekly' }, { v: 'fortnightly', l: 'Fortnightly' }, { v: 'monthly', l: 'Monthly' }].map(({ v, l }) => (
                <button key={v} onClick={() => up({ rent_frequency: v as typeof data.rent_frequency })} className={cn('flex-1 py-2.5 rounded-xl border text-xs font-medium', data.rent_frequency === v ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Payment method</label>
            <select value={data.payment_method ?? 'bank_transfer'} onChange={e => up({ payment_method: e.target.value as typeof data.payment_method })} className={inputClass}>
              <option value="bank_transfer">Bank transfer</option>
              <option value="deft">DEFT</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">First rent due date</label>
            <input type="date" value={data.first_rent_due ?? ''} onChange={e => up({ first_rent_due: e.target.value })} className={inputClass} />
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 3 — Bond
  if (phase === 3) {
    return (
      <WizardStepWrapper title="Bond" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={next}>
        <div className="space-y-4">
          <LegislationChip legislationKey="bond_maximum" />
          <LegislationChip legislationKey="bond_lodgement" />

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Is a bond required?</label>
            <div className="flex gap-2">
              {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
                <button key={String(v)} onClick={() => up({ bond_required: v })} className={cn('flex-1 py-3 rounded-xl border text-sm font-medium', data.bond_required === v ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}>{l}</button>
              ))}
            </div>
          </div>

          {data.bond_required && (
            <>
              {data.weekly_rent && (
                <div className="bg-[#E8F1EC] rounded-xl p-4 border border-[#2C5F3F]/20">
                  {data.weekly_rent <= 900 ? (
                    <p className="text-sm text-[#2C5F3F]">
                      Maximum bond: <strong>{formatCurrency(data.weekly_rent * 4)}</strong> (4 weeks rent)
                    </p>
                  ) : (
                    <p className="text-sm text-[#C47D1A]">
                      Rent exceeds $900/wk — no statutory cap applies. Bond must be reasonable.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Bond amount ($)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={data.bond_amount ?? maxBond ?? ''}
                  onChange={e => up({ bond_amount: parseFloat(e.target.value) })}
                  className={inputClass}
                />
                {maxBond && data.bond_amount && data.bond_amount > maxBond && (
                  <p className="text-xs text-[#C0392B] mt-1">Exceeds maximum bond of {formatCurrency(maxBond)}</p>
                )}
              </div>
            </>
          )}
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 4 — Water
  if (phase === 4) {
    const canChargeWater = data.wels_3star && data.dual_flush
    return (
      <WizardStepWrapper title="Water charging" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={next}>
        <div className="space-y-4">
          <LegislationChip legislationKey="water_charging" />

          {[
            { key: 'wels_3star' as const, label: 'Are all taps and showerheads WELS 3-star rated or better?' },
            { key: 'dual_flush' as const, label: 'Are all toilets dual flush?' }
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-[#1A1714] mb-1.5">{label}</label>
              <div className="flex gap-2">
                {[{ v: true, l: 'Yes' }, { v: false, l: 'No' }].map(({ v, l }) => (
                  <button key={String(v)} onClick={() => up({ [key]: v })} className={cn('flex-1 py-3 rounded-xl border text-sm font-medium', data[key] === v ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}>{l}</button>
                ))}
              </div>
            </div>
          ))}

          {canChargeWater ? (
            <div className="bg-[#E8F1EC] rounded-xl p-4 border border-[#2C5F3F]/20">
              <p className="text-sm text-[#2C5F3F] font-medium">✓ Water efficiency compliance met</p>
              <p className="text-xs text-[#6B6560] mt-1">Tenant can be charged for water usage</p>
            </div>
          ) : (
            <div className="bg-[#FDF3E3] rounded-xl p-4 border border-[#C47D1A]/20">
              <p className="text-sm text-[#C47D1A]">Water efficiency not fully met — tenant cannot be charged for water usage</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Water meter reading at lease start</label>
            <input value={data.water_meter_reading ?? ''} onChange={e => up({ water_meter_reading: e.target.value })} placeholder="e.g. 1234.56 kL" className={inputClass} />
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 5 — Inclusions & Pets
  if (phase === 5) {
    return (
      <WizardStepWrapper title="Inclusions & pets" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={next}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-2">Inclusions</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {INCLUSION_OPTIONS.map(item => {
                const selected = data.inclusions?.includes(item)
                return (
                  <button
                    key={item}
                    onClick={() => {
                      const curr = data.inclusions ?? []
                      up({ inclusions: selected ? curr.filter(i => i !== item) : [...curr, item] })
                    }}
                    className={cn('px-3 py-1.5 rounded-full text-sm border', selected ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}
                  >{item}</button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Pets permitted?</label>
            <div className="flex gap-2">
              {[{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }, { v: 'negotiable', l: 'Negotiable' }].map(({ v, l }) => (
                <button key={v} onClick={() => up({ pets: v as typeof data.pets })} className={cn('flex-1 py-2.5 rounded-xl border text-sm font-medium', data.pets === v ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#1A1714]')}>{l}</button>
              ))}
            </div>
            {(data.pets === 'yes' || data.pets === 'negotiable') && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-[#FDF3E3] rounded-xl border border-[#C47D1A]/20">
                <LegislationChip legislationKey="pets" compact />
                <p className="text-xs text-[#6B6560]">Remember to also complete FTR-PET (Apply to Keep a Pet)</p>
              </div>
            )}
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 6 — Special conditions
  if (phase === 6) {
    return (
      <WizardStepWrapper title="Special conditions" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={next}>
        <div className="space-y-4">
          <div className="p-3 bg-[#FDF3E3] rounded-xl border border-[#C47D1A]/20 text-xs text-[#C47D1A]">
            Special conditions cannot override tenant rights under the Residential Tenancies Act 2010.
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-2">Quick-add clause</label>
            <div className="space-y-2 mb-3">
              {CLAUSE_TEMPLATES.map((clause, i) => (
                <button
                  key={i}
                  onClick={() => up({ special_conditions: [(data.special_conditions ?? '').trim(), clause].filter(Boolean).join('\n\n') })}
                  className="w-full text-left px-3 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-xs text-[#1A1714] active:bg-[#F7F5F0]"
                >
                  + {clause}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Additional terms</label>
            <textarea
              value={data.special_conditions ?? ''}
              onChange={e => up({ special_conditions: e.target.value })}
              rows={6}
              placeholder="Enter any additional terms and conditions…"
              className={inputClass}
            />
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 7 — Disclosures
  if (phase === 7) {
    return (
      <WizardStepWrapper title="Disclosures" step={phase} totalSteps={TOTAL_PHASES} onBack={back} onNext={() => { handleComplete(); next() }} nextLabel="Complete & review">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Known material facts</label>
            <textarea
              value={data.material_facts ?? ''}
              onChange={e => up({ material_facts: e.target.value })}
              rows={4}
              placeholder="Asbestos, flood zone, proposed developments, known defects…"
              className={inputClass}
            />
          </div>

          <div className="space-y-3">
            {[
              { key: 'smoke_alarm_compliant' as const, label: 'Smoke alarm compliance confirmed?', form: 'FM01055' },
            ].map(({ key, label, form }) => (
              <div key={key} className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E2DDD5]">
                <p className="text-sm text-[#1A1714]">{label}</p>
                <button onClick={() => up({ [key]: !data[key] })} className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', data[key] ? 'bg-[#2C5F3F] border-[#2C5F3F]' : 'border-[#E2DDD5]')}>
                  {data[key] && <span className="text-white text-xs">✓</span>}
                </button>
              </div>
            ))}

            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#E2DDD5]">
              <p className="text-sm text-[#1A1714]">Swimming pool on property?</p>
              <button onClick={() => up({ pool_on_property: !data.pool_on_property })} className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', data.pool_on_property ? 'bg-[#2C5F3F] border-[#2C5F3F]' : 'border-[#E2DDD5]')}>
                {data.pool_on_property && <span className="text-white text-xs">✓</span>}
              </button>
            </div>
          </div>

          <div className="bg-[#E8F1EC] rounded-xl p-4 border border-[#2C5F3F]/20 space-y-2">
            <p className="text-xs font-semibold text-[#2C5F3F]">Also complete these forms:</p>
            {['SF003 — Material Fact Disclosure', 'FTR-LIS — Landlord Information Statement', 'FM01055 — Smoke Alarm Compliance'].map(f => (
              <p key={f} className="text-xs text-[#6B6560]">• {f}</p>
            ))}
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  // Phase 8 — Handoff
  if (phase === 8) {
    const sections = [
      {
        title: 'Parties',
        fields: [
          { label: 'Landlord name', value: data.landlord_name },
          { label: 'Landlord address', value: data.landlord_address },
          { label: 'Landlord ABN', value: data.landlord_abn },
          { label: 'Landlord phone', value: data.landlord_phone },
          { label: 'Landlord email', value: data.landlord_email },
          { label: 'Property address', value: selectedProperty ? `${selectedProperty.address}, ${selectedProperty.suburb} ${selectedProperty.state} ${selectedProperty.postcode}` : undefined },
          ...(data.tenants?.slice(0, data.tenant_count).flatMap((t, i) => [
            { label: `Tenant ${i + 1} name`, value: t.name },
            { label: `Tenant ${i + 1} email`, value: t.email },
            { label: `Tenant ${i + 1} phone`, value: t.phone },
          ]) ?? [])
        ]
      },
      {
        title: 'Lease terms',
        fields: [
          { label: 'Lease type', value: data.lease_type === 'fixed' ? 'Fixed term' : 'Periodic' },
          { label: 'Lease start', value: formatDate(data.lease_start) },
          { label: 'Lease end', value: formatDate(data.lease_end) },
          { label: 'Weekly rent', value: data.weekly_rent ? `$${data.weekly_rent.toFixed(2)}` : undefined },
          { label: 'Rent frequency', value: data.rent_frequency },
          { label: 'Payment method', value: data.payment_method?.replace('_', ' ') },
          { label: 'First rent due', value: formatDate(data.first_rent_due) }
        ]
      },
      {
        title: 'Bond',
        fields: [
          { label: 'Bond required', value: data.bond_required ? 'Yes' : 'No' },
          { label: 'Bond amount', value: data.bond_amount ? formatCurrency(data.bond_amount) : undefined }
        ]
      },
      {
        title: 'Water & inclusions',
        fields: [
          { label: 'WELS 3-star compliant', value: data.wels_3star ? 'Yes' : 'No' },
          { label: 'Dual flush toilets', value: data.dual_flush ? 'Yes' : 'No' },
          { label: 'Water meter reading', value: data.water_meter_reading },
          { label: 'Inclusions', value: data.inclusions?.join(', ') || 'None' },
          { label: 'Pets', value: data.pets }
        ]
      },
      {
        title: 'Special conditions',
        fields: [
          { label: 'Special conditions', value: data.special_conditions }
        ]
      }
    ]

    return (
      <div className="flex flex-col min-h-dvh bg-[#F7F5F0]">
        <div className="h-1 bg-[#2C5F3F]" />
        <div className="flex items-center px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
          <button onClick={back} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5] mr-3">
            ←
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1A1714]" style={{ fontFamily: 'Playfair Display, serif' }}>Review & handoff</h1>
            <p className="text-xs text-[#6B6560]">FM00401 — Residential Tenancy Agreement</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <REIHandoffPanel
            sections={sections}
            formCode="FM00401"
            draftId={data.draftId}
            onMarkSent={async () => {
              if (data.draftId) {
                await supabase.from('form_drafts').update({ status: 'sent' }).eq('id', data.draftId)
              }
            }}
          />
        </div>
      </div>
    )
  }

  return null
}
