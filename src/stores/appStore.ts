import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppState {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  bottomSheetOpen: boolean
  setBottomSheetOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3500)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  bottomSheetOpen: false,
  setBottomSheetOpen: (open) => set({ bottomSheetOpen: open })
}))
