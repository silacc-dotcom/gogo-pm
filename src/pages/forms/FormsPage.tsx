import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { AppHeader } from '@/components/layout/AppHeader'
import { FormListItem } from '@/components/forms/FormListItem'
import { FORMS_LIBRARY, FORM_CATEGORIES, PRIORITY_WIZARDS } from '@/lib/formsLibrary'
import type { FormDraft } from '@/types'

export function FormsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { profile } = useAuthStore()
  const [search, setSearch] = useState('')

  const { data: recentDrafts } = useQuery({
    queryKey: ['recent-forms', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('form_drafts')
        .select('form_code, form_name')
        .eq('user_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(3)
      return data ?? []
    },
    enabled: !!profile?.id
  })

  const filtered = search
    ? FORMS_LIBRARY.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase())
      )
    : FORMS_LIBRARY

  const propertyId = params.get('propertyId')

  const handleSelect = (code: string) => {
    const url = propertyId
      ? `/forms/wizard/${code}?propertyId=${propertyId}`
      : `/forms/wizard/${code}`
    navigate(url)
  }

  const recentCodes = [...new Set(recentDrafts?.map(d => d.form_code) ?? [])]

  return (
    <div>
      <AppHeader title="Forms" subtitle="REI Forms Library" />

      <div className="px-4 py-3 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C968F]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms by name or code…"
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm focus:outline-none focus:border-[#2C5F3F]"
          />
        </div>

        {/* Recent forms */}
        {!search && recentCodes.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider mb-3">Recent</p>
            <div className="space-y-2">
              {recentCodes.map(code => {
                const form = FORMS_LIBRARY.find(f => f.code === code)
                if (!form) return null
                return <FormListItem key={code} form={form} onClick={() => handleSelect(code)} recent />
              })}
            </div>
          </section>
        )}

        {/* Priority wizards */}
        {!search && (
          <section>
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider mb-3">Priority forms</p>
            <div className="space-y-2">
              {FORMS_LIBRARY.filter(f => PRIORITY_WIZARDS.includes(f.code)).map(form => (
                <FormListItem key={form.code} form={form} onClick={() => handleSelect(form.code)} />
              ))}
            </div>
          </section>
        )}

        {/* By category or search results */}
        {search ? (
          <div className="space-y-2">
            {filtered.map(form => (
              <FormListItem key={form.code} form={form} onClick={() => handleSelect(form.code)} />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-[#9C968F] text-center py-8">No forms match "{search}"</p>
            )}
          </div>
        ) : (
          FORM_CATEGORIES.map(cat => {
            const forms = FORMS_LIBRARY.filter(f => f.category === cat && !PRIORITY_WIZARDS.includes(f.code))
            if (forms.length === 0) return null
            return (
              <section key={cat}>
                <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider mb-3">{cat}</p>
                <div className="space-y-2">
                  {forms.map(form => (
                    <FormListItem key={form.code} form={form} onClick={() => handleSelect(form.code)} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </div>
    </div>
  )
}
