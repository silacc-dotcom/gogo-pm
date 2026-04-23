import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { WizardStepWrapper } from '@/components/forms/WizardStep'
import { REIHandoffPanel } from '@/pages/forms/REIHandoffPanel'
import { formatDate, formatRent, formatPhone } from '@/lib/utils'
import type { Property } from '@/types'
import { cn } from '@/lib/utils'

interface GenericWizardProps {
  formCode: string
  formName: string
}

export function GenericWizard({ formCode, formName }: GenericWizardProps) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()

  const [phase, setPhase] = useState(searchParams.get('propertyId') ? 1 : 0)
  const [propertyId, setPropertyId] = useState(searchParams.get('propertyId') ?? '')
  const [notes, setNotes] = useState('')
  const [draftId, setDraftId] = useState<string | undefined>()

  const { data: properties } = useQuery({
    queryKey: ['properties-select', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*').eq('agency_id', profile!.agency_id).order('address')
      return (data ?? []) as Property[]
    },
    enabled: !!profile?.agency_id
  })

  const selectedProperty = properties?.find(p => p.id === propertyId)
  const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

  const saveDraft = async () => {
    if (!profile) return
    const payload = {
      agency_id: profile.agency_id,
      user_id: profile.id,
      property_id: propertyId || null,
      form_code: formCode,
      form_name: formName,
      form_data: { notes, property_id: propertyId },
      status: 'ready' as const
    }
    if (draftId) {
      await supabase.from('form_drafts').update(payload).eq('id', draftId)
    } else {
      const { data } = await supabase.from('form_drafts').insert(payload).select().single()
      if (data) setDraftId(data.id)
    }
    addToast('Form saved')
  }

  if (phase === 0) {
    return (
      <WizardStepWrapper title="Select property" step={1} totalSteps={2} onBack={() => navigate(-1)} onNext={() => setPhase(1)} nextDisabled={!propertyId} nextLabel="Continue">
        <div className="space-y-3">
          {properties?.map(p => (
            <button key={p.id} onClick={() => setPropertyId(p.id)} className={cn('w-full p-4 rounded-xl border text-left', propertyId === p.id ? 'border-[#2C5F3F] bg-[#E8F1EC]' : 'border-[#E2DDD5] bg-white')}>
              <p className="text-sm font-semibold text-[#1A1714]">{p.address}</p>
              <p className="text-xs text-[#6B6560]">{p.suburb} · {p.tenant_name ?? 'No tenant'}</p>
            </button>
          ))}
        </div>
      </WizardStepWrapper>
    )
  }

  if (phase === 1) {
    return (
      <WizardStepWrapper title={formName} step={2} totalSteps={2} onBack={() => setPhase(0)} onNext={() => { saveDraft(); setPhase(2) }} nextLabel="Review & handoff">
        <div className="space-y-4">
          {selectedProperty && (
            <div className="bg-white rounded-xl border border-[#E2DDD5] p-4 space-y-1">
              <p className="text-xs text-[#9C968F]">Pre-filled from property record</p>
              <p className="text-sm font-semibold text-[#1A1714]">{selectedProperty.address}, {selectedProperty.suburb}</p>
              {selectedProperty.tenant_name && <p className="text-xs text-[#6B6560]">Tenant: {selectedProperty.tenant_name}</p>}
              {selectedProperty.landlord_name && <p className="text-xs text-[#6B6560]">Landlord: {selectedProperty.landlord_name}</p>}
              {selectedProperty.rent_amount && <p className="text-xs text-[#6B6560]">Rent: {formatRent(selectedProperty.rent_amount, selectedProperty.rent_frequency)}</p>}
              <p className="text-xs text-[#6B6560]">Lease end: {formatDate(selectedProperty.lease_end)}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Additional notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={5} placeholder="Enter any additional information needed for this form…" className={inputClass} />
          </div>
        </div>
      </WizardStepWrapper>
    )
  }

  const sections = [
    {
      title: 'Property details',
      fields: [
        { label: 'Property address', value: selectedProperty ? `${selectedProperty.address}, ${selectedProperty.suburb} ${selectedProperty.state} ${selectedProperty.postcode}` : undefined },
        { label: 'Landlord', value: selectedProperty?.landlord_name },
        { label: 'Landlord email', value: selectedProperty?.landlord_email },
        { label: 'Landlord phone', value: formatPhone(selectedProperty?.landlord_phone) },
        { label: 'Tenant', value: selectedProperty?.tenant_name },
        { label: 'Tenant email', value: selectedProperty?.tenant_email },
        { label: 'Tenant phone', value: formatPhone(selectedProperty?.tenant_phone) },
        { label: 'Rent', value: formatRent(selectedProperty?.rent_amount ?? null, selectedProperty?.rent_frequency ?? null) },
        { label: 'Lease start', value: formatDate(selectedProperty?.lease_start) },
        { label: 'Lease end', value: formatDate(selectedProperty?.lease_end) },
        { label: 'Bond', value: selectedProperty?.bond_amount ? `$${selectedProperty.bond_amount}` : undefined }
      ]
    },
    {
      title: 'Additional notes',
      fields: [{ label: 'Notes', value: notes }]
    }
  ]

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7F5F0]">
      <div className="h-1 bg-[#2C5F3F]" />
      <div className="flex items-center px-4 py-3" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <button onClick={() => setPhase(1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5] mr-3">←</button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-[#1A1714] truncate" style={{ fontFamily: 'Playfair Display, serif' }}>{formCode} — {formName}</h1>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <REIHandoffPanel sections={sections} formCode={formCode} draftId={draftId} />
      </div>
    </div>
  )
}
