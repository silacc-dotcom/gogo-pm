import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Copy, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { usePlan } from '@/hooks/usePlan'
import { AppHeader } from '@/components/layout/AppHeader'
import { UpgradePrompt } from '@/components/ui/UpgradePrompt'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { cn, formatDate } from '@/lib/utils'
import type { WebhookLog } from '@/types'

const CRM_CONFIGS = [
  {
    id: 'propertytree',
    name: 'PropertyTree',
    description: 'Sync tenancies and properties automatically',
    setupSteps: [
      'Log into PropertyTree',
      'Go to Configuration → Integrations → Inspection Applications',
      'Generate API Key',
      'Enter your PropertyTree API key in GoGo PM',
      'Copy your GoGo PM Webhook URL below',
      'Configure the webhook URL in PropertyTree for tenancy.created and tenancy.updated events',
      'Tap Test Connection'
    ],
    note: 'TODO: Verify exact PropertyTree webhook path at uatdeveloper.propertytree.io'
  },
  {
    id: 'propertyme',
    name: 'PropertyMe',
    description: 'Sync your PropertyMe portfolio',
    setupSteps: [
      'Log into PropertyMe',
      'Go to Settings → API & Integrations',
      'Generate a new API key',
      'Enter the key in GoGo PM',
      'Copy your webhook URL and configure in PropertyMe',
      'Test the connection'
    ],
    note: 'TODO: Verify exact PropertyMe API endpoints at developer.propertyme.com.au'
  },
  {
    id: 'console',
    name: 'Console',
    description: 'Connect your Console Cloud portfolio',
    comingSoon: true
  },
  {
    id: 'palace',
    name: 'Palace',
    description: 'Sync from Palace software',
    comingSoon: true
  },
  {
    id: 'csv',
    name: 'CSV Import',
    description: 'Import properties from a spreadsheet',
    free: true
  }
]

function WebhookEventChip({ status }: { status: string }) {
  const config = {
    success: { icon: CheckCircle, color: 'text-[#2C5F3F] bg-[#E8F1EC]' },
    error: { icon: XCircle, color: 'text-[#C0392B] bg-[#FDECEA]' },
    ignored: { icon: Clock, color: 'text-[#9C968F] bg-[#F0EDE6]' }
  }[status] ?? { icon: Clock, color: 'text-[#9C968F] bg-[#F0EDE6]' }
  const Icon = config.icon
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
      <Icon size={10} />
      {status}
    </span>
  )
}

export function IntegrationsPage() {
  const { profile, agency } = useAuthStore()
  const { addToast } = useAppStore()
  const { isPremium } = usePlan()
  const [selectedCRM, setSelectedCRM] = useState<string | null>(null)
  const [csvJson, setCsvJson] = useState('')

  const webhookBaseUrl = `${window.location.origin.replace('localhost', 'your-project.supabase.co')}/functions/v1/crm-webhook`

  const { data: webhookLogs } = useQuery({
    queryKey: ['webhook-logs', profile?.agency_id],
    queryFn: async () => {
      const { data } = await supabase.from('webhook_logs').select('*').eq('agency_id', profile!.agency_id).order('created_at', { ascending: false }).limit(10)
      return (data ?? []) as WebhookLog[]
    },
    enabled: !!profile?.agency_id && isPremium
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    addToast('Copied to clipboard')
  }

  const selectedConfig = CRM_CONFIGS.find(c => c.id === selectedCRM)

  return (
    <div className="flex flex-col">
      <AppHeader title="Integrations" back />

      {!isPremium && (
        <UpgradePrompt
          message="CRM integrations are available on GoGo PM Premium. CSV import is free for all users."
        />
      )}

      <div className="px-4 py-4 space-y-4">
        {/* CSV import — always available */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#1A1714]">CSV Import</p>
            <span className="px-2 py-0.5 rounded-full bg-[#E8F1EC] text-[#2C5F3F] text-xs font-medium">Free</span>
          </div>
          <p className="text-xs text-[#6B6560] mb-3">Import properties from a spreadsheet. Download the template, fill it in, and upload.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const headers = 'address,suburb,state,postcode,bedrooms,bathrooms,parking,property_type,status,landlord_name,landlord_email,landlord_phone,tenant_name,tenant_email,tenant_phone,rent_amount,rent_frequency,lease_start,lease_end,bond_amount'
                const blob = new Blob([headers + '\n'], { type: 'text/csv' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'gogo-pm-import-template.csv'; a.click()
                addToast('Template downloaded')
              }}
              className="flex-1 py-2.5 border border-[#E2DDD5] rounded-xl text-xs font-medium text-[#6B6560]"
            >
              Download template
            </button>
            <button className="flex-1 py-2.5 bg-[#2C5F3F] text-white rounded-xl text-xs font-medium">
              Upload CSV
            </button>
          </div>
        </div>

        {/* CRM integrations */}
        {CRM_CONFIGS.filter(c => c.id !== 'csv').map(crm => (
          <div key={crm.id} className={cn('bg-white rounded-xl border p-4', crm.comingSoon ? 'opacity-60 border-[#E2DDD5]' : 'border-[#E2DDD5]')}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#1A1714]">{crm.name}</p>
              <div className="flex items-center gap-2">
                {crm.comingSoon && <span className="px-2 py-0.5 rounded-full bg-[#F0EDE6] text-[#9C968F] text-xs">Coming soon</span>}
                {!crm.comingSoon && !isPremium && <span className="px-2 py-0.5 rounded-full bg-[#FDF3E3] text-[#C47D1A] text-xs">Premium</span>}
                {!crm.comingSoon && isPremium && <span className="px-2 py-0.5 rounded-full bg-[#F0EDE6] text-[#9C968F] text-xs">Not connected</span>}
              </div>
            </div>
            <p className="text-xs text-[#6B6560] mb-3">{crm.description}</p>

            {!crm.comingSoon && isPremium && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-[#F7F5F0] rounded-lg text-xs text-[#6B6560] truncate font-mono">
                    {webhookBaseUrl}?source={crm.id}
                  </div>
                  <button onClick={() => copyToClipboard(`${webhookBaseUrl}?source=${crm.id}`)} className="p-2 bg-[#F0EDE6] rounded-lg">
                    <Copy size={14} className="text-[#6B6560]" />
                  </button>
                </div>
                <button onClick={() => setSelectedCRM(crm.id)} className="text-xs text-[#2C5F3F] font-medium">
                  View setup guide →
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Webhook event log */}
        {isPremium && webhookLogs && webhookLogs.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#9C968F] uppercase tracking-wider mb-3">Recent webhook events</p>
            <div className="bg-white rounded-xl border border-[#E2DDD5] divide-y divide-[#F0EDE6]">
              {webhookLogs.map(log => (
                <div key={log.id} className="flex items-center gap-3 px-4 py-3">
                  <WebhookEventChip status={log.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1714] truncate">{log.source} · {log.event_type}</p>
                    <p className="text-xs text-[#9C968F]">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Field mapping tester (admin only) */}
        {profile?.role === 'admin' && isPremium && (
          <details className="bg-white rounded-xl border border-[#E2DDD5] p-4">
            <summary className="text-sm font-semibold text-[#1A1714] cursor-pointer">Field mapping tester (admin)</summary>
            <div className="mt-3 space-y-3">
              <p className="text-xs text-[#6B6560]">Paste a raw CRM JSON payload to see how GoGo PM would map it.</p>
              <textarea value={csvJson} onChange={e => setCsvJson(e.target.value)} rows={6} placeholder='{"property": {"streetAddress": "1 George St", ...}}' className="w-full px-3 py-2 bg-[#F7F5F0] border border-[#E2DDD5] rounded-lg text-xs font-mono focus:outline-none" />
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(csvJson)
                    addToast('Paste the output to a developer for verification')
                    console.log('Parsed payload:', parsed)
                  } catch {
                    addToast('Invalid JSON', 'error')
                  }
                }}
                className="px-4 py-2 bg-[#2C5F3F] text-white rounded-lg text-xs font-medium"
              >
                Test mapping
              </button>
            </div>
          </details>
        )}
      </div>

      {/* Setup guide sheet */}
      <BottomSheet open={!!selectedCRM} onClose={() => setSelectedCRM(null)} title={`${selectedConfig?.name} setup guide`}>
        {selectedConfig?.setupSteps && (
          <div className="space-y-4">
            <ol className="space-y-3">
              {selectedConfig.setupSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E8F1EC] text-[#2C5F3F] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-sm text-[#1A1714]">{step}</p>
                </li>
              ))}
            </ol>
            {selectedConfig.note && (
              <p className="text-xs text-[#9C968F] italic border-t border-[#E2DDD5] pt-3">{selectedConfig.note}</p>
            )}
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
