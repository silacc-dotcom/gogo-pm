import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import { CalculatorsTab } from './CalculatorsTab'
import { RemindersTab } from './RemindersTab'
import { cn } from '@/lib/utils'

type Tab = 'calculators' | 'reminders'

export function ToolsPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'calculators')

  return (
    <div className="flex flex-col">
      <AppHeader title="Tools" />
      <div className="px-4 pt-2 pb-3">
        <div className="flex bg-[#F0EDE6] rounded-xl p-1">
          {(['calculators', 'reminders'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-colors',
                tab === t ? 'bg-white text-[#2C5F3F] shadow-sm' : 'text-[#6B6560]'
              )}
            >{t}</button>
          ))}
        </div>
      </div>
      {tab === 'calculators' ? <CalculatorsTab /> : <RemindersTab />}
    </div>
  )
}
