import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthInit } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { AppLayout } from '@/components/layout/AppLayout'
import { ToastContainer } from '@/components/ui/ToastNotification'

// Auth
import { SplashScreen } from '@/pages/auth/SplashScreen'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'

// Main
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { PropertiesPage } from '@/pages/properties/PropertiesPage'
import { PropertyDetailPage } from '@/pages/properties/PropertyDetailPage'
import { PropertyFormPage } from '@/pages/properties/PropertyFormPage'
import { TasksPage } from '@/pages/tasks/TasksPage'
import { TaskFormPage } from '@/pages/tasks/TaskFormPage'
import { FormsPage } from '@/pages/forms/FormsPage'
import { WizardRouter } from '@/pages/forms/WizardRouter'
import { ToolsPage } from '@/pages/tools/ToolsPage'
import { AccountPage } from '@/pages/account/AccountPage'
import { IntegrationsPage } from '@/pages/account/IntegrationsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1
    }
  }
})

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <SplashScreen />
  if (!user) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  useAuthInit()

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />

      {/* Auth */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected app */}
      <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/new" element={<PropertyFormPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
        <Route path="/properties/:id/edit" element={<PropertyFormPage />} />

        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/new" element={<TaskFormPage />} />

        <Route path="/forms" element={<FormsPage />} />

        <Route path="/tools" element={<ToolsPage />} />

        <Route path="/account" element={<AccountPage />} />
        <Route path="/account/integrations" element={<IntegrationsPage />} />
      </Route>

      {/* Wizard — full-screen, outside app shell */}
      <Route path="/forms/wizard/:code" element={<AuthGuard><WizardRouter /></AuthGuard>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer />
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
