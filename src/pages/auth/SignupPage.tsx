import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  agency_name: z.string().min(2, 'Enter your agency name'),
  abn: z.string().optional(),
  licence_number: z.string().optional(),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

type FormData = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.full_name } }
    })
    if (signUpError) { setError(signUpError.message); return }

    if (authData.user) {
      const { error: fnError } = await supabase.rpc('create_agency_and_profile', {
        p_user_id: authData.user.id,
        p_full_name: data.full_name,
        p_agency_name: data.agency_name,
        p_abn: data.abn || null,
        p_licence_number: data.licence_number || null
      })
      if (fnError) { setError(fnError.message); return }
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#F7F5F0] px-5" style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)', paddingBottom: 'max(env(safe-area-inset-bottom), 40px)' }}>
      <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#2C5F3F] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>GP</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1714]" style={{ fontFamily: 'Playfair Display, serif' }}>Create account</h1>
          <p className="text-sm text-[#6B6560] mt-1">Get started with GoGo PM</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FDECEA] rounded-xl text-sm text-[#C0392B]">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {[
            { name: 'full_name' as const, label: 'Full name', placeholder: 'Jane Smith', type: 'text' },
            { name: 'agency_name' as const, label: 'Agency name', placeholder: 'Smith Property Group', type: 'text' },
            { name: 'abn' as const, label: 'ABN (optional)', placeholder: '12 345 678 901', type: 'text' },
            { name: 'licence_number' as const, label: 'Licence number (optional)', placeholder: '10012345', type: 'text' },
            { name: 'email' as const, label: 'Email', placeholder: 'you@example.com', type: 'email' },
          ].map(({ name, label, placeholder, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-[#1A1714] mb-1.5">{label}</label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full px-4 py-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] placeholder-[#9C968F] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]"
              />
              {errors[name] && <p className="text-xs text-[#C0392B] mt-1">{errors[name]?.message}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Password</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="w-full px-4 py-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] placeholder-[#9C968F] focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F] pr-12"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C968F]">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#C0392B] mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold active:opacity-80 disabled:opacity-60 mt-2"
          >
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B6560] mt-6">
          Already have an account?{' '}
          <Link to="/auth/login" className="text-[#2C5F3F] font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
