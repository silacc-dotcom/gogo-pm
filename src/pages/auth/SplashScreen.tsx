import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function SplashScreen() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        navigate(user ? '/dashboard' : '/auth/login', { replace: true })
      }, 1800)
    }
  }, [loading, user, navigate])

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-[#2C5F3F] px-8">
      <div className="flex flex-col items-center gap-6">
        {/* GP Monogram */}
        <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
          <span
            className="text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            GP
          </span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>
            GoGo PM
          </h1>
          <p className="text-sm text-white/70 mt-1 tracking-wide">Property management on the go</p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>

      <p className="absolute bottom-8 text-xs text-white/40">
        Made for NSW property managers
      </p>
    </div>
  )
}
