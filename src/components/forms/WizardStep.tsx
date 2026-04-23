import { ArrowLeft, ArrowRight, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePlan } from '@/hooks/usePlan'

interface WizardStepProps {
  title: string
  step: number
  totalSteps: number
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  backLabel?: string
  nextDisabled?: boolean
  voiceMode?: boolean
  onVoiceToggle?: () => void
  children: React.ReactNode
}

export function WizardStepWrapper({
  title,
  step,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Next',
  backLabel = 'Back',
  nextDisabled,
  voiceMode,
  onVoiceToggle,
  children
}: WizardStepProps) {
  const { isPremium } = usePlan()
  const progress = ((step) / totalSteps) * 100

  return (
    <div className="flex flex-col min-h-dvh bg-[#F7F5F0]">
      {/* Progress bar */}
      <div className="h-1 bg-[#E2DDD5]">
        <div
          className="h-full bg-[#2C5F3F] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F7F5F0]" style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)' }}>
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-[#E2DDD5]">
              <ArrowLeft size={18} className="text-[#1A1714]" />
            </button>
          )}
          <span className="text-xs text-[#9C968F]">Step {step} of {totalSteps}</span>
        </div>
        {onVoiceToggle && (
          <button
            onClick={onVoiceToggle}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
              voiceMode
                ? 'bg-[#2C5F3F] text-white'
                : isPremium
                ? 'bg-white border border-[#E2DDD5] text-[#6B6560]'
                : 'bg-[#FDF3E3] text-[#C47D1A]'
            )}
          >
            <Mic size={13} />
            {isPremium ? (voiceMode ? 'Voice on' : 'Voice') : 'Premium'}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-[#1A1714] mb-5" style={{ fontFamily: 'Playfair Display, serif' }}>
          {title}
        </h2>
        {children}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 bg-white border-t border-[#E2DDD5]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
      >
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className={cn(
            'w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2',
            nextDisabled
              ? 'bg-[#E2DDD5] text-[#9C968F]'
              : 'bg-[#2C5F3F] text-white active:opacity-80'
          )}
        >
          {nextLabel}
          {!nextDisabled && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
