import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[#E8F1EC] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[#2C5F3F]" />
      </div>
      <h3 className="text-base font-semibold text-[#1A1714] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#6B6560] max-w-xs leading-relaxed">{description}</p>}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-medium active:opacity-80"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
