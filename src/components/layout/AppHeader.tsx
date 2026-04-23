import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  title: string
  subtitle?: string
  back?: boolean
  right?: React.ReactNode
  className?: string
  transparent?: boolean
}

export function AppHeader({ title, subtitle, back, right, className, transparent }: AppHeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        'flex items-center gap-3 px-4 py-3 sticky top-0 z-30',
        transparent ? 'bg-transparent' : 'bg-[#F7F5F0] border-b border-[#E2DDD5]',
        className
      )}
      style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}
    >
      {back && (
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5] shrink-0"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-[#1A1714]" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-[#1A1714] leading-tight truncate" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h1>
        {subtitle && <p className="text-xs text-[#6B6560] truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  )
}
