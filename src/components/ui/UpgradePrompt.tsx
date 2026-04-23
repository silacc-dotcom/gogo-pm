import { Zap } from 'lucide-react'

interface UpgradePromptProps {
  title?: string
  message: string
  onUpgrade?: () => void
}

export function UpgradePrompt({
  title = 'Upgrade to Premium',
  message,
  onUpgrade
}: UpgradePromptProps) {
  return (
    <div className="mx-4 my-4 bg-[#FDF3E3] border border-[#C47D1A]/30 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-[#C47D1A]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Zap size={16} className="text-[#C47D1A]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1A1714] mb-0.5">{title}</p>
          <p className="text-sm text-[#6B6560] leading-relaxed">{message}</p>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="mt-3 px-4 py-2 bg-[#C47D1A] text-white rounded-lg text-sm font-medium active:opacity-80"
            >
              Upgrade now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
