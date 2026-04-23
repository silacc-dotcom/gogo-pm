import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-t-2xl shadow-xl animate-slide-up pb-safe',
          'max-h-[90dvh] overflow-y-auto',
          className
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#E2DDD5]">
            <h2 className="text-lg font-semibold text-[#1A1714] font-[var(--font-heading)]">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F0EDE6] text-[#6B6560]"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
