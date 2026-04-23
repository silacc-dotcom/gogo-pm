import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { User, Building2, Bell, Shield, Link2, LogOut, ChevronRight, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { usePlan } from '@/hooks/usePlan'
import { AppHeader } from '@/components/layout/AppHeader'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { cn } from '@/lib/utils'

const inputClass = 'w-full px-4 py-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F]'

function MenuRow({ icon: Icon, label, sublabel, onClick, danger }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; sublabel?: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-[#F7F5F0] active:bg-[#F0EDE6] text-left">
      <Icon size={18} className={cn(danger ? 'text-[#C0392B]' : 'text-[#6B6560]')} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', danger ? 'text-[#C0392B]' : 'text-[#1A1714]')}>{label}</p>
        {sublabel && <p className="text-xs text-[#9C968F] mt-0.5">{sublabel}</p>}
      </div>
      {!danger && <ChevronRight size={16} className="text-[#9C968F]" />}
    </button>
  )
}

export function AccountPage() {
  const navigate = useNavigate()
  const { profile, agency, user } = useAuthStore()
  const { addToast } = useAppStore()
  const { isPremium, tier } = usePlan()
  const qc = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState(profile?.full_name ?? '')
  const [editPhone, setEditPhone] = useState(profile?.phone ?? '')
  const [editREIEmail, setEditREIEmail] = useState(profile?.rei_forms_live_email ?? '')

  const saveProfile = async () => {
    if (!profile) return
    await supabase.from('profiles').update({
      full_name: editName,
      phone: editPhone,
      rei_forms_live_email: editREIEmail
    }).eq('id', profile.id)
    qc.invalidateQueries({ queryKey: ['profile'] })
    addToast('Profile updated')
    setEditOpen(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-full">
      <AppHeader title="Account" />

      <div className="px-4 py-4 space-y-5">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#E8F1EC] flex items-center justify-center text-xl font-bold text-[#2C5F3F]">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1714]">{profile?.full_name}</p>
              <p className="text-xs text-[#6B6560]">{user?.email}</p>
              <p className="text-xs text-[#9C968F] mt-0.5 capitalize">{profile?.role} · {agency?.name}</p>
            </div>
            <button onClick={() => { setEditName(profile?.full_name ?? ''); setEditPhone(profile?.phone ?? ''); setEditREIEmail(profile?.rei_forms_live_email ?? ''); setEditOpen(true) }} className="px-3 py-1.5 border border-[#E2DDD5] rounded-lg text-xs font-medium text-[#6B6560]">
              Edit
            </button>
          </div>
        </div>

        {/* Subscription */}
        <div className={cn('rounded-xl border p-4', isPremium ? 'bg-[#E8F1EC] border-[#2C5F3F]/30' : 'bg-[#FDF3E3] border-[#C47D1A]/30')}>
          <div className="flex items-center gap-2 mb-1">
            {isPremium ? <Shield size={16} className="text-[#2C5F3F]" /> : <Zap size={16} className="text-[#C47D1A]" />}
            <p className="text-sm font-semibold" style={{ color: isPremium ? '#2C5F3F' : '#C47D1A' }}>
              {isPremium ? 'GoGo PM Premium' : 'GoGo PM Free'}
            </p>
          </div>
          {!isPremium && (
            <>
              <p className="text-xs text-[#6B6560] mb-3">Up to 5 properties · All forms · All calculators</p>
              <button className="px-4 py-2 bg-[#C47D1A] text-white rounded-lg text-xs font-semibold">
                Upgrade to Premium
              </button>
            </>
          )}
          {isPremium && <p className="text-xs text-[#6B6560]">Unlimited properties · Voice mode · CRM integrations</p>}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden divide-y divide-[#F0EDE6]">
          <MenuRow icon={Building2} label="Agency details" sublabel={agency?.name ?? ''} onClick={() => {}} />
          <MenuRow icon={Bell} label="Notification preferences" onClick={() => {}} />
          <MenuRow icon={Link2} label="Integrations" sublabel="PropertyTree · PropertyMe · CSV" onClick={() => navigate('/account/integrations')} />
          <MenuRow icon={User} label="Team members" sublabel="Invite & manage" onClick={() => {}} />
        </div>

        <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden">
          <MenuRow icon={LogOut} label="Sign out" onClick={signOut} danger />
        </div>

        <div className="text-center space-y-1 pb-4">
          <p className="text-xs text-[#9C968F]">GoGo PM v1.0.0</p>
          <div className="flex items-center justify-center gap-3 text-xs text-[#9C968F]">
            <button className="underline">Privacy policy</button>
            <span>·</span>
            <button className="underline">Terms of service</button>
          </div>
          <p className="text-xs text-[#9C968F]">Made for NSW property managers</p>
        </div>
      </div>

      {/* Edit profile sheet */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Full name</label>
            <input value={editName} onChange={e => setEditName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">Phone</label>
            <input value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1A1714] mb-1.5">REI Forms Live email</label>
            <input value={editREIEmail} onChange={e => setEditREIEmail(e.target.value)} type="email" className={inputClass} />
            <p className="text-xs text-[#9C968F] mt-1">Used to pre-fill forms in REI Forms Live</p>
          </div>
          <button onClick={saveProfile} className="w-full py-3.5 bg-[#2C5F3F] text-white rounded-xl text-sm font-semibold">
            Save changes
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
