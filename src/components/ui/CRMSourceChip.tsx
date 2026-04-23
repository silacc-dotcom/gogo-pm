import type { ImportSource } from '@/types'
import { cn } from '@/lib/utils'

const LABELS: Record<ImportSource, string> = {
  propertytree: 'PropertyTree',
  propertyme: 'PropertyMe',
  console: 'Console',
  palace: 'Palace',
  csv: 'CSV',
  manual: 'Manual'
}

const COLORS: Record<ImportSource, string> = {
  propertytree: 'bg-[#EAF2FB] text-[#1A5276]',
  propertyme: 'bg-[#E8F1EC] text-[#2C5F3F]',
  console: 'bg-[#FDF3E3] text-[#C47D1A]',
  palace: 'bg-purple-50 text-purple-700',
  csv: 'bg-[#F0EDE6] text-[#6B6560]',
  manual: 'bg-[#F0EDE6] text-[#9C968F]'
}

interface CRMSourceChipProps {
  source: ImportSource
  className?: string
}

export function CRMSourceChip({ source, className }: CRMSourceChipProps) {
  if (source === 'manual') return null
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', COLORS[source], className)}>
      {LABELS[source]}
    </span>
  )
}
