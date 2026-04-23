import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { WizardStepWrapper } from '@/components/forms/WizardStep'
import { LegislationChip } from '@/components/ui/LegislationChip'
import { REIHandoffPanel } from '@/pages/forms/REIHandoffPanel'
import { formatCurrency, formatDate, addDays } from '@/lib/utils'
import type { Property } from '@/types'
import { cn } from '@/lib/utils'

function addDaysStr(dateStr: string, days: number): string {
  return addDays(new Date(dateStr), days).toISOString().split('T')[0]
}

function isWithin12Months(lastIncrease: string): boolean {
  const last = new Date(lastIncrease)
  const now = new Date()
  const monthsDiff = (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth())
  return monthsDiff < 12
}

export function NORIWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const qc = useQueryClient()

  const [phase, setPhase] = useState(searchParams.get('propertyId') ? 1 : 0)
  const [data, setData] = useState({
    property_id: searchParams.get('propertyId') ?? '',
    new_rent: '',
    last_increase_date: ''
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
  const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

  const today = new Date().toISOString().split('T')[0]
  const noticeDate = today
  const effectiveDate = addDaysStr(today, 60)
  const twelveMonthViolation = data.last_increase_date && isWithin12Months(data.last_increase_date)

  const pctChange = selectedProperty?.rent_amount && data.new_rent
    ? (((parseFloat(data.new_rent) - selectedProperty.rent_amount) / selectedProperty.rent_amount) * 100).toFixed(1)
    : null

  const createReminder = async () => {
    if (!profile || !data.property_id) return
    await supabase.from('reminders').insert({
      agency_id: profile.agency_id,
      user_id: profile.id,
      property_id: data.property_id,
      title: `Rent increase effective — ${formatCurrency(parseFloat(data.new_rent))}`,
      due_date: effectiveDate,
      reminder_type: 'rent_arrears',
      recurrence: 'none',
      push_notified: false,
      dismissed: false
    })
    qc.invalidateQueries({ queryKey: ['reminders'] })
    addToast('Reminder created for rent increase effective date')
  }

  if (phase === 0) {
    return (
      <WizardStepWrapper title="Select property" step={1} totalSteps={3} onBack={() => navigate(-1)} onNext={() => { if (data.property_id) setPhase(1) }} nextDisabled={!data.property_id} nextLabel="Continue">
        <div className="space-y-3">
          {properties?.map(p => (
            <button key={p.id} onClick={() => setData(d => ({ ...d, property_id: p.id }))} className={cn('w-full p-4 rounded-xl border text-left', data.property_id === p.id ? 'border-[#2C5F3F] bg-[#E8F1EC]' : 'border-[#E2DDD5] bg-white')}>
              <p className="text-sm font-semibold text-[#1A1714]">{p.address}</p>
              <p className="text-xs text-[#6B6560]">{p.suburb} · Current rent: {formatCurrency(p.rent_amount)}</p>
            </button>
          ))}
        </div>
      </WizardStepWrapper>
    )
  }

  if (phase === 1) {
    return (
      <WizardStepWrapper title="Notice of Rent Increase" step={2} totalSteps={3} onBack={() => setPhase(0)} onNext={() => setPhase(2)} nextDisabled={!data.new_rent}>
        <div className="space-y-4">
          <LegislationChip legislationKey="rent_increase" />

          <div className="bg-white rounded-xl border border-[#E2DDD5] p-4">
            <p className="text-xs text-[#9C968F]">Current rent</p>
            <p className="text-xl font-bold text-[#1A1714]">{formatCurrency(selectedProperty?.rent_amount ?? null)} pw</p>
            <p className="text-xs text-[#6B6560] mt-1">Tenant: {selectedProperty?.tenant_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">New rent amount ($ per week)</label>
            <input type="number" inputMode="decimal" value={data.new_rent} onChange={e => setData(d => ({ ...d, new_rent: e.target.value }))} placeholder="0.00" className={inputClass} />
            {pctChange && <p className="text-xs text-[#6B6560] mt-1">Change: {parseFloat(pctChange) > 0 ? '+' : ''}{pctChange}%</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Date of last rent increase</label>
            <input type="date" value={data.last_increase_date} onChange={e => setData(d => ({ ...d, last_increase_date: e.target.value }))} className={inputClass} />
          </div>

          {twelveMonthViolation && (
            <div className="p-4 bg-[#FDECEA] rounded-xl border border-[#C0392B]/20">
              <p className="text-sm font-semibold text-[#C0392B]">⚠ 12-month rule not met</p>
              <p className="text-xs text-[#6B6560] mt-1">Rent was increased within the last 12 months. Under RTA 2010 s.41-42, rent may only be increased once per 12-month period (from 19 June 2023).</p>
            </div>
          )}

          {data.new_rent && !twelveMonthViolation && (
            <div className="bg-[#E8F1EC] rounded-xl p-4 border border-[#2C5F3F]/20 space-y-2">
              <p className="text-xs font-semibold text-[#2C5F3F]">Calculated dates</p>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6560]">Notice date</span>
                <span className="font-medium text-[#1A1714]">{formatDate(noticeDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6560]">Earliest effective date</span>
                <span className="font-medium text-[#1A1714]">{formatDate(effectiveDate)}</span>
              </div>
            </div>
          )}
        </div>
      </WizardStepWrapper>
    )
  }

  // Handoff
  const sections = [
    {
      title: 'Rent increase details',
      fields: [
        { label: 'Property address', value: selectedProperty ? `${selectedProperty.address}, ${selectedProperty.suburb}` : undefined },
        { label: 'Tenant name', value: selectedProperty?.tenant_name },
        { label: 'Current rent', value: formatCurrency(selectedProperty?.rent_amount ?? null) },
        { label: 'New rent', value: data.new_rent ? formatCurrency(parseFloat(data.new_rent)) : undefined },
        { label: 'Change', value: pctChange ? `${parseFloat(pctChange) > 0 ? '+' : ''}${pctChange}%` : undefined },
        { label: 'Notice date', value: formatDate(noticeDate) },
        { label: 'Effective date (earliest)', value: formatDate(effectiveDate) }
      ]
    }
  ]

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7F5F0]">
      <div className="h-1 bg-[#2C5F3F]" />
      <div className="flex items-center px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button onClick={() => setPhase(1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5] mr-3">←</button>
        <div>
          <h1 className="text-lg font-bold text-[#1A1714]" style={{ fontFamily: 'Playfair Display, serif' }}>NORI — Rent Increase</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <REIHandoffPanel sections={sections} formCode="NORI" />
        <div className="mt-4">
          <button onClick={createReminder} className="w-full py-3 bg-[#FDF3E3] text-[#C47D1A] border border-[#C47D1A]/30 rounded-xl text-sm font-medium">
            Create reminder for effective date
          </button>
        </div>
      </div>
    </div>
  )
}
