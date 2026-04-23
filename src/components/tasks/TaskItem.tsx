import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Building2, Calendar, FileText, Trash2 } from 'lucide-react'
import type { Task } from '@/types'
import { formatDate, cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const priorityConfig = {
  urgent: { label: 'Urgent', className: 'bg-[#FDECEA] text-[#C0392B]' },
  high: { label: 'High', className: 'bg-[#FDF3E3] text-[#C47D1A]' },
  normal: { label: 'Normal', className: 'bg-[#F0EDE6] text-[#6B6560]' },
  low: { label: 'Low', className: 'bg-[#F0EDE6] text-[#9C968F]' }
}

const categoryConfig = {
  inspection: { label: 'Inspection', className: 'bg-[#EAF2FB] text-[#1A5276]' },
  form: { label: 'Form', className: 'bg-[#E8F1EC] text-[#2C5F3F]' },
  compliance: { label: 'Compliance', className: 'bg-[#FDF3E3] text-[#C47D1A]' },
  maintenance: { label: 'Maintenance', className: 'bg-[#F0EDE6] text-[#6B6560]' },
  admin: { label: 'Admin', className: 'bg-[#F0EDE6] text-[#9C968F]' }
}

interface TaskItemProps {
  task: Task
  onToggleComplete: (id: string) => void
  onDelete?: (id: string) => void
  onStartForm?: (formCode: string) => void
}

export function TaskItem({ task, onToggleComplete, onDelete, onStartForm }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const priority = priorityConfig[task.priority]
  const category = categoryConfig[task.category]
  const isComplete = task.status === 'complete'

  const isOverdue = task.due_date && !isComplete && new Date(task.due_date) < new Date()

  return (
    <div className={cn(
      'bg-white rounded-xl border transition-all',
      isComplete ? 'border-[#E2DDD5] opacity-60' : 'border-[#E2DDD5]',
      isOverdue && !isComplete ? 'border-[#C0392B]/40' : ''
    )}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer active:bg-[#F7F5F0] rounded-xl"
        onClick={() => setExpanded(!expanded)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id) }}
          className="mt-0.5 shrink-0"
          aria-label={isComplete ? 'Mark incomplete' : 'Mark complete'}
        >
          {isComplete
            ? <CheckCircle2 size={22} className="text-[#2C5F3F]" />
            : <Circle size={22} className={isOverdue ? 'text-[#C0392B]' : 'text-[#9C968F]'} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold leading-tight', isComplete && 'line-through text-[#9C968F]')}>
            {task.title}
          </p>
          {task.property && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={11} className="text-[#9C968F]" />
              <span className="text-xs text-[#6B6560] truncate">{task.property.address}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {task.due_date && (
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                isOverdue && !isComplete ? 'bg-[#FDECEA] text-[#C0392B]' : 'bg-[#F0EDE6] text-[#6B6560]'
              )}>
                <Calendar size={10} />
                {formatDate(task.due_date)}
              </span>
            )}
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', priority.className)}>
              {priority.label}
            </span>
            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', category.className)}>
              {category.label}
            </span>
            {task.form_code && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#E8F1EC] text-[#2C5F3F]">
                {task.form_code}
              </span>
            )}
          </div>
        </div>

        {expanded ? <ChevronUp size={16} className="text-[#9C968F] shrink-0 mt-1" /> : <ChevronDown size={16} className="text-[#9C968F] shrink-0 mt-1" />}
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[#E2DDD5] pt-3 space-y-3">
          {task.description && (
            <p className="text-sm text-[#6B6560] leading-relaxed">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {task.form_code && onStartForm && (
              <button
                onClick={() => onStartForm(task.form_code!)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#2C5F3F] text-white rounded-lg text-xs font-medium"
              >
                <FileText size={13} />
                Start {task.form_code}
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FDECEA] text-[#C0392B] rounded-lg text-xs font-medium"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
