import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { BottomSheet } from './BottomSheet'
import { LEGISLATION } from '@/lib/nswLegislation'

interface LegislationChipProps {
  legislationKey: string
  compact?: boolean
}

export function LegislationChip({ legislationKey, compact }: LegislationChipProps) {
  const [open, setOpen] = useState(false)
  const entry = LEGISLATION[legislationKey]
  if (!entry) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FDF3E3] text-[#C47D1A] text-xs font-medium border border-[#C47D1A]/20 active:opacity-70"
      >
        <BookOpen size={11} />
        {compact ? entry.section : entry.summary}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} title={entry.section}>
        <p className="text-sm text-[#6B6560] mb-1 font-medium">{entry.summary}</p>
        <p className="text-sm text-[#1A1714] leading-relaxed">{entry.detail}</p>
        <p className="mt-4 text-xs text-[#9C968F] italic">
          Legislative references current as of 2024. Verify against current legislation before relying on them.
        </p>
      </BottomSheet>
    </>
  )
}
