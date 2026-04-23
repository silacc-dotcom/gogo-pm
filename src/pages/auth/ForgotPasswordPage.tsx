import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, CheckCircle } from 'lucide-react'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email }: FormData) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    setSent(true)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#F7F5F0] px-5" style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)' }}>
      <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-[#6B6560] mb-8">
        <ArrowLeft size={16} />
        Back to sign in
      </Link>

      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-[#1A1714] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Reset password</h1>
        <p className="text-sm text-[#6B6560] mb-8">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle size={48} className="text-[#2C5F3F]" />
            <p className="text-sm text-[#1A1714] font-medium">Check your email</p>
            <p className="text-sm text-[#6B6560]">We've sent a password reset link. Check your inbox.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 bg-white border border-[#E2DDD5] rounded-xl text-sm focus:outline-none focus:border-[#2C5F3F] focus:ring-1 focus:ring-[#2C5F3F]"
              />
              {errors.email && <p className="text-xs text-[#C0392B] mt-1">{errors.email.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
