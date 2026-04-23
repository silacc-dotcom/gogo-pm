import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'red' | 'amber' | 'green'
  onClick?: () => void
}

const variants = {
  default: 'bg-white border-[#E2DDD5]',
  red: 'bg-[#FDECEA] border-[#C0392B]/20',
  amber: 'bg-[#FDF3E3] border-[#C47D1A]/20',
  green: 'bg-[#E8F1EC] border-[#2C5F3F]/20'
}

const valueColors = {
  default: 'text-[#1A1714]',
  red: 'text-[#C0392B]',
  amber: 'text-[#C47D1A]',
  green: 'text-[#2C5F3F]'
}

export function StatCard({ label, value, subtitle, icon: Icon, variant = 'default', onClick }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-1',
        variants[variant],
        onClick && 'active:scale-[0.98] cursor-pointer'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#6B6560] leading-tight">{label}</p>
        {Icon && <Icon size={16} className={cn('opacity-60', valueColors[variant])} />}
      </div>
      <p className={cn('text-2xl font-bold', valueColors[variant])}>{value}</p>
      {subtitle && <p className="text-xs text-[#9C968F]">{subtitle}</p>}
    </div>
  )
}
