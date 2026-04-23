import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { usePlan } from '@/hooks/usePlan'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { AppHeader } from '@/components/layout/AppHeader'
import { SkeletonList } from '@/components/ui/SkeletonLoader'
import { EmptyState } from '@/components/ui/EmptyState'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Building2 } from 'lucide-react'
import type { Property, PropertyStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { label: string; value: PropertyStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Leased', value: 'leased' },
  { label: 'Vacant', value: 'vacant' },
  { label: 'For lease', value: 'for_lease' }
]

export function PropertiesPage() {
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { maxProperties, isPremium } = usePlan()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all')
  const [filterOpen, setFilterOpen] = useState(false)

  const { data: properties, isLoading } = useQuery({
    queryKey: ['properties', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('agency_id', profile!.agency_id)
        .order('created_at', { ascending: false })
      return (data ?? []) as Property[]
    },
    enabled: !!profile?.agency_id
  })

  const filtered = properties?.filter(p => {
    const matchSearch = !search || p.address.toLowerCase().includes(search.toLowerCase()) || p.suburb.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })

  const atLimit = !isPremium && (properties?.length ?? 0) >= maxProperties

  return (
    <div className="flex flex-col min-h-full">
      <AppHeader
        title="Properties"
        subtitle={properties ? `${properties.length} properties` : undefined}
        right={
          <button
            onClick={() => navigate('/properties/new')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2C5F3F] text-white"
          >
            <Plus size={20} />
          </button>
        }
      />

      <div className="px-4 py-3 space-y-3">
        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C968F]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search address or suburb…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm focus:outline-none focus:border-[#2C5F3F]"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-xl border',
              statusFilter !== 'all' ? 'bg-[#2C5F3F] border-[#2C5F3F] text-white' : 'bg-white border-[#E2DDD5] text-[#6B6560]'
            )}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>

        {/* Upgrade prompt at limit */}
        {atLimit && (
          <UpgradePrompt
            message="GoGo PM Free supports up to 5 properties. Upgrade to Premium for unlimited portfolios."
            onUpgrade={() => navigate('/account')}
          />
        )}

        {/* Properties list */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : filtered?.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No properties yet"
            description="Add your first property or import from your CRM"
            action={{ label: 'Add property', onClick: () => navigate('/properties/new') }}
          />
        ) : (
          <div className="space-y-3">
            {filtered?.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>

      {/* Filter sheet */}
      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filter properties">
        <div className="space-y-3">
          <p className="text-xs font-medium text-[#6B6560] uppercase tracking-wider">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setStatusFilter(opt.value); setFilterOpen(false) }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border',
                  statusFilter === opt.value
                    ? 'bg-[#2C5F3F] text-white border-[#2C5F3F]'
                    : 'bg-white text-[#6B6560] border-[#E2DDD5]'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}
