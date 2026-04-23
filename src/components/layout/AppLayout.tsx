import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '@/components/ui/ToastNotification'

export function AppLayout() {
  return (
    <div className="flex flex-col min-h-dvh bg-[#F7F5F0]">
      <ToastContainer />
      <main className="main-content flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
