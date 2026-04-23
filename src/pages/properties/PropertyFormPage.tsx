import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { usePlan } from '@/hooks/usePlan'
import { AppHeader } from '@/components/layout/AppHeader'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import type { Property } from '@/types'

const schema = z.object({
  address: z.string().min(1, 'Required'),
  suburb: z.string().min(1, 'Required'),
  state: z.string().default('NSW'),
  postcode: z.string().min(4, 'Required'),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  parking: z.coerce.number().optional(),
  property_type: z.string().optional(),
  status: z.enum(['vacant', 'leased', 'for_lease']).default('vacant'),
  landlord_name: z.string().optional(),
  landlord_email: z.string().email().optional().or(z.literal('')),
  landlord_phone: z.string().optional(),
  landlord_abn: z.string().optional(),
  tenant_name: z.string().optional(),
  tenant_email: z.string().email().optional().or(z.literal('')),
  tenant_phone: z.string().optional(),
  rent_amount: z.coerce.number().optional(),
  rent_frequency: z.enum(['weekly', 'fortnightly', 'monthly']).optional(),
  lease_start: z.string().optional(),
  lease_end: z.string().optional(),
  bond_amount: z.coerce.number().optional(),
  water_efficient: z.boolean().optional(),
  pets_allowed: z.boolean().optional(),
  notes: z.string().optional()
})

type FormData = z.infer<typeof schema>

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1A1714] mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-[#C0392B] mt-1">{error}</p>}
    </div>
  )
}

const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

export function PropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const { maxProperties, isPremium } = usePlan()
  const isEdit = !!id

  const { data: existing } = useQuery({
    queryKey: ['property', id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('*').eq('id', id!).single()
      return data as Property
    },
    enabled: isEdit
  })

  const { data: propertyCount } = useQuery({
    queryKey: ['property-count', profile?.agency_id],
    queryFn: async () => {
      const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true }).eq('agency_id', profile!.agency_id)
      return count ?? 0
    },
    enabled: !!profile?.agency_id && !isEdit
  })

  const atLimit = !isPremium && !isEdit && (propertyCount ?? 0) >= maxProperties

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: existing ? {
      address: existing.address,
      suburb: existing.suburb,
      state: existing.state,
      postcode: existing.postcode,
      status: existing.status,
      bedrooms: existing.bedrooms ?? undefined,
      bathrooms: existing.bathrooms ?? undefined,
      parking: existing.parking ?? undefined,
      property_type: existing.property_type ?? '',
      landlord_name: existing.landlord_name ?? '',
      landlord_email: existing.landlord_email ?? '',
      landlord_phone: existing.landlord_phone ?? '',
      landlord_abn: existing.landlord_abn ?? '',
      tenant_name: existing.tenant_name ?? '',
      tenant_email: existing.tenant_email ?? '',
      tenant_phone: existing.tenant_phone ?? '',
      rent_amount: existing.rent_amount ?? undefined,
      rent_frequency: existing.rent_frequency ?? undefined,
      lease_start: existing.lease_start ?? '',
      lease_end: existing.lease_end ?? '',
      bond_amount: existing.bond_amount ?? undefined,
      water_efficient: existing.water_efficient ?? undefined,
      pets_allowed: existing.pets_allowed ?? undefined,
      notes: existing.notes ?? ''
    } : undefined
  })

  const onSubmit = async (data: FormData) => {
    if (!profile) return
    const payload = {
      ...data,
      agency_id: profile.agency_id,
      user_id: profile.id,
      import_source: isEdit ? (existing?.import_source ?? 'manual') : 'manual',
      landlord_email: data.landlord_email || null,
      tenant_email: data.tenant_email || null
    }

    if (isEdit) {
      await supabase.from('properties').update(payload).eq('id', id!)
      addToast('Property updated')
    } else {
      await supabase.from('properties').insert(payload)
      addToast('Property added')
    }
    navigate(-1)
  }

  return (
    <div>
      <AppHeader title={isEdit ? 'Edit property' : 'Add property'} back />
      {atLimit && (
        <UpgradePrompt
          message="GoGo PM Free supports up to 5 properties. Upgrade to Premium for unlimited portfolios."
          onUpgrade={() => navigate('/account')}
        />
      )}
      {!atLimit && (
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-5 pb-20">
          <section className="space-y-4">
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider">Property address</p>
            <Field label="Street address" error={errors.address?.message}><input {...register('address')} placeholder="1 George Street" className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Suburb" error={errors.suburb?.message}><input {...register('suburb')} placeholder="Sydney" className={inputClass} /></Field>
              <Field label="State"><input {...register('state')} placeholder="NSW" className={inputClass} /></Field>
            </div>
            <Field label="Postcode" error={errors.postcode?.message}><input {...register('postcode')} placeholder="2000" inputMode="numeric" className={inputClass} /></Field>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider">Details</p>
            <Field label="Property type">
              <select {...register('property_type')} className={inputClass}>
                <option value="">Select type</option>
                <option>House</option><option>Unit</option><option>Townhouse</option><option>Apartment</option><option>Other</option>
              </select>
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Beds"><input {...register('bedrooms')} type="number" min="0" className={inputClass} /></Field>
              <Field label="Baths"><input {...register('bathrooms')} type="number" min="0" className={inputClass} /></Field>
              <Field label="Parking"><input {...register('parking')} type="number" min="0" className={inputClass} /></Field>
            </div>
            <Field label="Status">
              <select {...register('status')} className={inputClass}>
                <option value="vacant">Vacant</option>
                <option value="leased">Leased</option>
                <option value="for_lease">For lease</option>
              </select>
            </Field>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider">Landlord</p>
            <Field label="Name"><input {...register('landlord_name')} placeholder="John Smith" className={inputClass} /></Field>
            <Field label="Email"><input {...register('landlord_email')} type="email" placeholder="john@example.com" className={inputClass} /></Field>
            <Field label="Phone"><input {...register('landlord_phone')} type="tel" placeholder="0400 000 000" className={inputClass} /></Field>
            <Field label="ABN"><input {...register('landlord_abn')} placeholder="12 345 678 901" className={inputClass} /></Field>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider">Tenant & lease</p>
            <Field label="Tenant name"><input {...register('tenant_name')} placeholder="Jane Doe" className={inputClass} /></Field>
            <Field label="Tenant email"><input {...register('tenant_email')} type="email" placeholder="jane@example.com" className={inputClass} /></Field>
            <Field label="Tenant phone"><input {...register('tenant_phone')} type="tel" placeholder="0411 000 000" className={inputClass} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Rent ($)"><input {...register('rent_amount')} type="number" inputMode="decimal" placeholder="0.00" className={inputClass} /></Field>
              <Field label="Frequency">
                <select {...register('rent_frequency')} className={inputClass}>
                  <option value="">Select</option>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Lease start"><input {...register('lease_start')} type="date" className={inputClass} /></Field>
              <Field label="Lease end"><input {...register('lease_end')} type="date" className={inputClass} /></Field>
            </div>
            <Field label="Bond ($)"><input {...register('bond_amount')} type="number" inputMode="decimal" placeholder="0.00" className={inputClass} /></Field>
          </section>

          <section className="space-y-4">
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider">Additional</p>
            <Field label="Notes"><textarea {...register('notes')} rows={3} placeholder="Any additional notes…" className={inputClass} /></Field>
          </section>

          <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
            {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add property'}
          </button>
        </form>
      )}
    </div>
  )
}
