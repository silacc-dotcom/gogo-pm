import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#F7F5F0] px-5" style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)' }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2C5F3F] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>GP</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1714]" style={{ fontFamily: 'Playfair Display, serif' }}>Welcome back</h1>
          <p className="text-sm text-[#6B6560] mt-1">Sign in to GoGo PM</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FDECEA] rounded-xl text-sm text-[#C0392B]">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] placeholder-[#9C968F] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]"
            />
            {errors.email && <p className="text-xs text-[#C0392B] mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] placeholder-[#9C968F] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F] pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C968F]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#C0392B] mt-1">{errors.password.message}</p>}
          </div>

          <div className="text-right">
            <Link to="/auth/forgot-password" className="text-xs text-[#2C5F3F] font-medium">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold active:opacity-80 disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B6560] mt-8">
          Don't have an account?{' '}
          <Link to="/auth/signup" className="text-[#2C5F3F] font-semibold">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
