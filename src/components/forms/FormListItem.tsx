import { ChevronRight } from 'lucide-react'
import type { FormDefinition } from '@/lib/formsLibrary'
import { cn } from '@/lib/utils'

interface FormListItemProps {
  form: FormDefinition
  onClick: () => void
  recent?: boolean
}

const categoryColors: Record<string, string> = {
  'Management Agreements': 'bg-[#EAF2FB] text-[#1A5276]',
  'Tenancy': 'bg-[#E8F1EC] text-[#2C5F3F]',
  'During Tenancy': 'bg-[#FDF3E3] text-[#C47D1A]',
  'Compliance': 'bg-[#FDECEA] text-[#C0392B]',
  'Ending Tenancy': 'bg-purple-50 text-purple-700',
  'Contractors': 'bg-[#F0EDE6] text-[#6B6560]'
}

export function FormListItem({ form, onClick, recent }: FormListItemProps) {
  const color = categoryColors[form.category] ?? 'bg-[#F0EDE6] text-[#6B6560]'

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-[#E2DDD5] p-4 flex items-center gap-3 cursor-pointer active:bg-[#F7F5F0]',
        recent && 'border-[#2C5F3F]/30'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-[#F0EDE6] shrink-0">
        <span className="text-[9px] font-bold text-[#6B6560] leading-tight text-center">{form.code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1A1714] leading-tight">{form.name}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', color)}>
            {form.category}
          </span>
          {form.priority && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#E8F1EC] text-[#2C5F3F]">
              Priority
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={18} className="text-[#9C968F] shrink-0" />
    </div>
  )
}
