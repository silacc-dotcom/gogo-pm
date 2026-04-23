import { useState } from 'react'
import { Bell, Building2, Calendar, ChevronDown, ChevronUp, X, Clock } from 'lucide-react'
import type { Reminder } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { LegislationChip } from '@/components/ui/LegislationChip'

const typeConfig = {
  lease_expiry: { label: 'Lease Expiry', legislation: 'termination_landlord', className: 'bg-[#FDECEA] text-[#C0392B]' },
  inspection: { label: 'Inspection', legislation: 'entry_notice', className: 'bg-[#EAF2FB] text-[#1A5276]' },
  compliance: { label: 'Compliance', legislation: 'smoke_alarms', className: 'bg-[#FDF3E3] text-[#C47D1A]' },
  rent_arrears: { label: 'Rent Arrears', legislation: undefined, className: 'bg-[#FDECEA] text-[#C0392B]' },
  task_due: { label: 'Task Due', legislation: undefined, className: 'bg-[#F0EDE6] text-[#6B6560]' }
}

interface ReminderItemProps {
  reminder: Reminder
  onDismiss: (id: string) => void
  onSnooze: (id: string, weeks: number) => void
}

export function ReminderItem({ reminder, onDismiss, onSnooze }: ReminderItemProps) {
  const [expanded, setExpanded] = useState(false)
  const config = typeConfig[reminder.reminder_type]
  const daysLeft = Math.ceil((new Date(reminder.due_date).getTime() - Date.now()) / 86400000)
  const isOverdue = daysLeft < 0

  return (
    <div className={cn(
      'bg-white rounded-xl border',
      isOverdue ? 'border-[#C0392B]/30' : 'border-[#E2DDD5]'
    )}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer active:bg-[#F7F5F0] rounded-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <Bell size={18} className={cn('shrink-0 mt-0.5', isOverdue ? 'text-[#C0392B]' : 'text-[#C47D1A]')} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1A1714] leading-tight">{reminder.title}</p>
          {reminder.property && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={11} className="text-[#9C968F]" />
              <span className="text-xs text-[#6B6560] truncate">{reminder.property.address}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', isOverdue ? 'bg-[#FDECEA] text-[#C0392B]' : 'bg-[#F0EDE6] text-[#6B6560]')}>
              <Calendar size={10} />
              {formatDate(reminder.due_date)}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
              {config.label}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-[#9C968F] shrink-0 mt-1" /> : <ChevronDown size={16} className="text-[#9C968F] shrink-0 mt-1" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#E2DDD5] pt-3 space-y-3">
          {reminder.description && <p className="text-sm text-[#6B6560]">{reminder.description}</p>}
          {config.legislation && (
            <LegislationChip legislationKey={config.legislation} />
          )}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onDismiss(reminder.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F0EDE6] text-[#6B6560] rounded-lg text-xs font-medium"
            >
              <X size={13} />
              Dismiss
            </button>
            <button
              onClick={() => onSnooze(reminder.id, 1)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F0EDE6] text-[#6B6560] rounded-lg text-xs font-medium"
            >
              <Clock size={13} />
              Snooze 1w
            </button>
            <button
              onClick={() => onSnooze(reminder.id, 2)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F0EDE6] text-[#6B6560] rounded-lg text-xs font-medium"
            >
              Snooze 2w
            </button>
            <button
              onClick={() => onSnooze(reminder.id, 4)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F0EDE6] text-[#6B6560] rounded-lg text-xs font-medium"
            >
              Snooze 1m
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
