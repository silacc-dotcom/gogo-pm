import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import type { Property } from '@/types'
import { formatDate, formatRent, daysUntil, leaseUrgency, cn } from '@/lib/utils'
import { CRMSourceChip } from '@/components/ui/CRMSourceChip'

interface PropertyCardProps {
  property: Property
}

const statusConfig = {
  leased: { label: 'Leased', className: 'bg-[#E8F1EC] text-[#2C5F3F]' },
  vacant: { label: 'Vacant', className: 'bg-[#FDECEA] text-[#C0392B]' },
  for_lease: { label: 'For Lease', className: 'bg-[#FDF3E3] text-[#C47D1A]' }
}

export function PropertyCard({ property }: PropertyCardProps) {
  const navigate = useNavigate()
  const days = daysUntil(property.lease_end)
  const urgency = leaseUrgency(property.lease_end)
  const status = statusConfig[property.status]

  const leaseChipColor = urgency === 'red'
    ? 'bg-[#FDECEA] text-[#C0392B]'
    : urgency === 'amber'
    ? 'bg-[#FDF3E3] text-[#C47D1A]'
    : 'bg-[#F0EDE6] text-[#6B6560]'

  return (
    <div
      className="bg-white rounded-xl border border-[#E2DDD5] p-4 active:bg-[#F7F5F0] cursor-pointer"
      onClick={() => navigate(`/properties/${property.id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#1A1714] text-sm leading-tight truncate">{property.address}</p>
          <p className="text-xs text-[#6B6560] truncate mt-0.5">{property.suburb} {property.state} {property.postcode}</p>
        </div>
        <ChevronRight size={18} className="text-[#9C968F] shrink-0 mt-0.5" />
      </div>

      {property.tenant_name && (
        <p className="text-xs text-[#6B6560] mt-2 truncate">
          Tenant: <span className="text-[#1A1714] font-medium">{property.tenant_name}</span>
        </p>
      )}

      {property.rent_amount && (
        <p className="text-xs text-[#6B6560] mt-0.5">
          Rent: <span className="text-[#1A1714] font-medium">{formatRent(property.rent_amount, property.rent_frequency)}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mt-3">
        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', status.className)}>
          {status.label}
        </span>

        {days !== null && property.lease_end && (
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', leaseChipColor)}>
            <Clock size={10} />
            {days < 0 ? `Expired ${Math.abs(days)}d ago` : days === 0 ? 'Expires today' : `${days}d to expiry`}
          </span>
        )}

        <CRMSourceChip source={property.import_source} />
      </div>
    </div>
  )
}
