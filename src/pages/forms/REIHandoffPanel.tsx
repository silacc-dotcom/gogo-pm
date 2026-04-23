import { useState } from 'react'
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react'
import { openREIFormsLive, type FormSection } from '@/lib/reiFormsLive'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

interface REIHandoffPanelProps {
  sections: FormSection[]
  formCode: string
  draftId?: string
  onMarkSent?: () => void
}

export function REIHandoffPanel({ sections, formCode, draftId, onMarkSent }: REIHandoffPanelProps) {
  const { addToast } = useAppStore()
  const [marked, setMarked] = useState(false)

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value).then(() => addToast('Copied to clipboard'))
  }

  const handleMarkSent = () => {
    setMarked(true)
    onMarkSent?.()
    addToast('Marked as completed in REI Forms Live')
  }

  return (
    <div className="space-y-5">
      <div className="bg-[#E8F1EC] rounded-xl p-4 border border-[#2C5F3F]/20">
        <p className="text-sm font-semibold text-[#2C5F3F] mb-1">Ready for REI Forms Live</p>
        <p className="text-xs text-[#6B6560]">
          All collected data is shown below. Use the copy buttons for fast manual entry, then open REI Forms Live.
        </p>
      </div>

      {sections.map((section, si) => (
        section.fields.some(f => f.value) && (
          <div key={si}>
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider mb-3">{section.title}</p>
            <div className="bg-white rounded-xl border border-[#E2DDD5] divide-y divide-[#F0EDE6]">
              {section.fields.filter(f => f.value).map((field, fi) => (
                <div key={fi} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#9C968F]">{field.label}</p>
                    <p className="text-sm font-medium text-[#1A1714] mt-0.5">{field.value}</p>
                  </div>
                  <button
                    onClick={() => copyValue(field.value!)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F0EDE6] text-[#6B6560] active:bg-[#E2DDD5] shrink-0"
                    aria-label="Copy"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      <div className="space-y-3 pt-2">
        <button
          onClick={() => openREIFormsLive(formCode)}
          className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:opacity-80"
        >
          <ExternalLink size={16} />
          Open REI Forms Live
        </button>

        {!marked ? (
          <button
            onClick={handleMarkSent}
            className="w-full py-3 border border-[#2C5F3F] text-[#2C5F3F] rounded-xl text-sm font-semibold active:bg-[#E8F1EC]"
          >
            Mark as completed in REI Forms Live
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 text-[#2C5F3F]">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">Marked as completed</span>
          </div>
        )}
      </div>
    </div>
  )
}
