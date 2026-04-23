import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { AppHeader } from '@/components/layout/AppHeader'
import type { Property } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  category: z.enum(['inspection', 'form', 'compliance', 'maintenance', 'admin']).default('admin'),
  property_id: z.string().optional(),
  form_code: z.string().optional()
})

type FormData = z.infer<typeof schema>

const inputClass = 'w-full px-4 py-3 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]'

export function TaskFormPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { profile } = useAuthStore()
  const { addToast } = useAppStore()
  const defaultPropertyId = params.get('propertyId') ?? ''

  const { data: properties } = useQuery({
    queryKey: ['properties-select', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase.from('properties').select('id, address, suburb').eq('agency_id', profile!.agency_id).order('address')
      return (data ?? []) as Pick<Property, 'id' | 'address' | 'suburb'>[]
    },
    enabled: !!profile?.agency_id
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'normal', category: 'admin', property_id: defaultPropertyId }
  })

  const onSubmit = async (data: FormData) => {
    if (!profile) return
    await supabase.from('tasks').insert({
      ...data,
      agency_id: profile.agency_id,
      user_id: profile.id,
      status: 'pending',
      property_id: data.property_id || null
    })
    addToast('Task created')
    navigate(-1)
  }

  return (
    <div>
      <AppHeader title="New task" back />
      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Task title *</label>
          <input {...register('title')} placeholder="e.g. Lodge bond with Fair Trading" className={inputClass} />
          {errors.title && <p className="text-xs text-[#C0392B] mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Description</label>
          <textarea {...register('description')} rows={3} placeholder="Any additional details…" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Property</label>
          <select {...register('property_id')} className={inputClass}>
            <option value="">No property</option>
            {properties?.map(p => (
              <option key={p.id} value={p.id}>{p.address}, {p.suburb}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Priority</label>
            <select {...register('priority')} className={inputClass}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Category</label>
            <select {...register('category')} className={inputClass}>
              <option value="inspection">Inspection</option>
              <option value="form">Form</option>
              <option value="compliance">Compliance</option>
              <option value="maintenance">Maintenance</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Due date</label>
          <input {...register('due_date')} type="date" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Form code (optional)</label>
          <input {...register('form_code')} placeholder="e.g. FM00401" className={inputClass} />
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
          {isSubmitting ? 'Creating…' : 'Create task'}
        </button>
      </form>
    </div>
  )
}
