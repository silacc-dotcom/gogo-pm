import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

export function ToastContainer() {
  const { toasts, removeToast } = useAppStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto animate-slide-up',
            toast.type === 'success' && 'bg-[#2C5F3F] text-white',
            toast.type === 'error' && 'bg-[#C0392B] text-white',
            toast.type === 'info' && 'bg-[#1A5276] text-white'
          )}
        >
          {toast.type === 'success' && <CheckCircle size={18} className="shrink-0" />}
          {toast.type === 'error' && <AlertCircle size={18} className="shrink-0" />}
          {toast.type === 'info' && <Info size={18} className="shrink-0" />}
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
