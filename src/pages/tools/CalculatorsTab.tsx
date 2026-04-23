import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LegislationChip } from '@/components/ui/LegislationChip'
import { formatCurrency, cn } from '@/lib/utils'
import { addDays, format, parseISO, differenceInDays } from 'date-fns'

function CalcSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-xl border border-[#E2DDD5] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-4 text-left">
        <span className="text-sm font-semibold text-[#1A1714]">{title}</span>
        <span className="text-[#9C968F] text-lg">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-5 border-t border-[#F0EDE6] pt-4 space-y-4">{children}</div>}
    </div>
  )
}

const inputClass = 'w-full px-4 py-3 bg-[#F7F5F0] border border-[#E2DDD5] rounded-xl text-sm text-[#1A1714] focus:outline-none focus:border-[#2C5F3F]'

// A — Bond calculator
function BondCalc() {
  const navigate = useNavigate()
  const [rent, setRent] = useState('')
  const weekly = parseFloat(rent)
  const valid = !isNaN(weekly) && weekly > 0

  return (
    <div className="space-y-4">
      <LegislationChip legislationKey="bond_maximum" />
      <div>
        <label className="block text-xs font-medium text-[#6B6560] mb-1">Weekly rent ($)</label>
        <input type="number" inputMode="decimal" value={rent} onChange={e => setRent(e.target.value)} placeholder="0.00" className={inputClass} />
      </div>
      {valid && (
        <div className={cn('rounded-xl p-4 border', weekly <= 900 ? 'bg-[#E8F1EC] border-[#2C5F3F]/20' : 'bg-[#FDF3E3] border-[#C47D1A]/20')}>
          {weekly <= 900 ? (
            <>
              <p className="text-xs text-[#6B6560]">Maximum bond (4 weeks rent)</p>
              <p className="text-2xl font-bold text-[#2C5F3F]">{formatCurrency(weekly * 4)}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-[#C47D1A] font-medium">Rent exceeds $900/wk</p>
              <p className="text-sm text-[#6B6560] mt-1">No statutory cap applies. Bond must be a reasonable amount.</p>
            </>
          )}
        </div>
      )}
      {valid && (
        <button onClick={() => navigate('/tasks/new?category=compliance&title=Lodge bond with NSW Fair Trading')} className="w-full py-3 bg-[#2C5F3F] text-white rounded-xl text-sm font-medium">
          Create bond lodgement task
        </button>
      )}
    </div>
  )
}

// B — Rent increase calculator
function RentIncreaseCalc() {
  const navigate = useNavigate()
  const [currentRent, setCurrentRent] = useState('')
  const [newRent, setNewRent] = useState('')
  const [lastIncrease, setLastIncrease] = useState('')

  const curr = parseFloat(currentRent)
  const next = parseFloat(newRent)
  const valid = !isNaN(curr) && !isNaN(next) && curr > 0 && next > 0

  let twelveMonthMet = true
  let noticeDate = ''
  let effectiveDate = ''
  let pctChange = ''

  if (valid && lastIncrease) {
    const last = parseISO(lastIncrease)
    const today = new Date()
    const monthsDiff = (today.getFullYear() - last.getFullYear()) * 12 + (today.getMonth() - last.getMonth())
    twelveMonthMet = monthsDiff >= 12
    noticeDate = format(today, 'dd/MM/yyyy')
    effectiveDate = format(addDays(today, 60), 'dd/MM/yyyy')
    pctChange = (((next - curr) / curr) * 100).toFixed(1)
  }

  return (
    <div className="space-y-4">
      <LegislationChip legislationKey="rent_increase" />
      {[
        { label: 'Current rent ($/wk)', value: currentRent, set: setCurrentRent },
        { label: 'Proposed rent ($/wk)', value: newRent, set: setNewRent }
      ].map(({ label, value, set }) => (
        <div key={label}>
          <label className="block text-xs font-medium text-[#6B6560] mb-1">{label}</label>
          <input type="number" inputMode="decimal" value={value} onChange={e => set(e.target.value)} placeholder="0.00" className={inputClass} />
        </div>
      ))}
      <div>
        <label className="block text-xs font-medium text-[#6B6560] mb-1">Date of last rent increase</label>
        <input type="date" value={lastIncrease} onChange={e => setLastIncrease(e.target.value)} className={inputClass} />
      </div>
      {valid && lastIncrease && (
        <div className={cn('rounded-xl p-4 border space-y-2', twelveMonthMet ? 'bg-[#E8F1EC] border-[#2C5F3F]/20' : 'bg-[#FDECEA] border-[#C0392B]/20')}>
          {!twelveMonthMet && <p className="text-sm font-semibold text-[#C0392B]">⚠ 12-month rule not met</p>}
          {twelveMonthMet && (
            <>
              <Row label="Change" value={`${parseFloat(pctChange) >= 0 ? '+' : ''}${pctChange}%`} />
              <Row label="Notice date" value={noticeDate} />
              <Row label="Earliest effective date" value={effectiveDate} />
            </>
          )}
        </div>
      )}
      {valid && twelveMonthMet && (
        <button onClick={() => navigate('/forms/wizard/NORI')} className="w-full py-3 bg-[#2C5F3F] text-white rounded-xl text-sm font-medium">
          Start NORI form
        </button>
      )}
    </div>
  )
}

// C — Break lease fee calculator
function BreakLeaseCalc() {
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [vacateDate, setVacateDate] = useState('')
  const [weeklyRent, setWeeklyRent] = useState('')

  const rent = parseFloat(weeklyRent)
  const valid = leaseStart && leaseEnd && vacateDate && !isNaN(rent) && rent > 0
  const preMar2020 = leaseStart && parseISO(leaseStart) < new Date('2020-03-23')

  let pct = 0, weeksRent = 0, breakFee = 0, weeksRemaining = 0

  if (valid) {
    const start = parseISO(leaseStart)
    const end = parseISO(leaseEnd)
    const vacate = parseISO(vacateDate)
    const total = differenceInDays(end, start)
    const elapsed = differenceInDays(vacate, start)
    pct = Math.max(0, Math.min(100, (elapsed / total) * 100))
    weeksRemaining = Math.ceil(differenceInDays(end, vacate) / 7)
    weeksRent = pct < 25 ? 4 : pct < 50 ? 3 : pct < 75 ? 2 : 1
    breakFee = rent * weeksRent
  }

  return (
    <div className="space-y-4">
      <LegislationChip legislationKey="break_lease" />
      {[
        { label: 'Lease start', value: leaseStart, set: setLeaseStart, type: 'date' },
        { label: 'Lease end', value: leaseEnd, set: setLeaseEnd, type: 'date' },
        { label: 'Vacate date', value: vacateDate, set: setVacateDate, type: 'date' },
        { label: 'Weekly rent ($)', value: weeklyRent, set: setWeeklyRent, type: 'number' }
      ].map(({ label, value, set, type }) => (
        <div key={label}>
          <label className="block text-xs font-medium text-[#6B6560] mb-1">{label}</label>
          <input type={type} value={value} onChange={e => set(e.target.value)} inputMode={type === 'number' ? 'decimal' : undefined} placeholder={type === 'number' ? '0.00' : undefined} className={inputClass} />
        </div>
      ))}
      {preMar2020 && (
        <div className="p-3 bg-[#FDF3E3] rounded-xl border border-[#C47D1A]/20 text-xs text-[#C47D1A]">
          ⚠ Lease pre-dates 23 March 2020 — different rules may apply. Seek legal advice.
        </div>
      )}
      {valid && !preMar2020 && (
        <div className="bg-[#E8F1EC] rounded-xl p-4 border border-[#2C5F3F]/20 space-y-2">
          <Row label="% through lease" value={`${pct.toFixed(1)}%`} />
          <Row label="Weeks remaining" value={`${weeksRemaining} weeks`} />
          <Row label="Break fee" value={`${weeksRent} weeks rent`} />
          <div className="border-t border-[#2C5F3F]/20 pt-2 mt-2">
            <p className="text-xs text-[#9C968F]">Break fee amount</p>
            <p className="text-2xl font-bold text-[#2C5F3F]">{formatCurrency(breakFee)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// D — Yield & ROI calculator
function YieldCalc() {
  const [fields, setFields] = useState({ purchasePrice: '', weeklyRent: '', councilRates: '', strataFees: '', insurance: '', mgmtPct: '', maintenance: '' })
  const up = (k: keyof typeof fields, v: string) => setFields(f => ({ ...f, [k]: v }))

  const pp = parseFloat(fields.purchasePrice)
  const wr = parseFloat(fields.weeklyRent)
  const valid = pp > 0 && wr > 0

  let grossYield = 0, netYield = 0, annualCashFlow = 0, monthlyCashFlow = 0

  if (valid) {
    const annualRent = wr * 52
    const expenses = (parseFloat(fields.councilRates) || 0) + (parseFloat(fields.strataFees) || 0) + (parseFloat(fields.insurance) || 0) + (annualRent * ((parseFloat(fields.mgmtPct) || 0) / 100)) + (parseFloat(fields.maintenance) || 0)
    grossYield = (annualRent / pp) * 100
    netYield = ((annualRent - expenses) / pp) * 100
    annualCashFlow = annualRent - expenses
    monthlyCashFlow = annualCashFlow / 12
  }

  const cashPositive = annualCashFlow >= 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Purchase price ($)', key: 'purchasePrice' as const },
          { label: 'Weekly rent ($)', key: 'weeklyRent' as const },
          { label: 'Council rates ($/yr)', key: 'councilRates' as const },
          { label: 'Strata fees ($/yr)', key: 'strataFees' as const },
          { label: 'Insurance ($/yr)', key: 'insurance' as const },
          { label: 'Mgmt fee (%)', key: 'mgmtPct' as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[#6B6560] mb-1">{label}</label>
            <input type="number" inputMode="decimal" value={fields[key]} onChange={e => up(key, e.target.value)} placeholder="0" className={inputClass} />
          </div>
        ))}
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B6560] mb-1">Maintenance budget ($/yr)</label>
        <input type="number" inputMode="decimal" value={fields.maintenance} onChange={e => up('maintenance', e.target.value)} placeholder="0" className={inputClass} />
      </div>
      {valid && (
        <div className={cn('rounded-xl p-4 border space-y-2', cashPositive ? 'bg-[#E8F1EC] border-[#2C5F3F]/20' : 'bg-[#FDECEA] border-[#C0392B]/20')}>
          <Row label="Gross yield" value={`${grossYield.toFixed(2)}%`} />
          <Row label="Net yield" value={`${netYield.toFixed(2)}%`} />
          <div className="border-t border-current/10 pt-2 mt-2">
            <Row label="Annual cash flow" value={formatCurrency(annualCashFlow)} highlight={cashPositive ? 'green' : 'red'} />
            <Row label="Monthly cash flow" value={formatCurrency(monthlyCashFlow)} highlight={cashPositive ? 'green' : 'red'} />
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: 'green' | 'red' }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-[#6B6560]">{label}</span>
      <span className={cn('text-sm font-semibold', highlight === 'green' ? 'text-[#2C5F3F]' : highlight === 'red' ? 'text-[#C0392B]' : 'text-[#1A1714]')}>{value}</span>
    </div>
  )
}

export function CalculatorsTab() {
  return (
    <div className="px-4 pb-6 space-y-3">
      <CalcSection title="A  Bond Calculator"><BondCalc /></CalcSection>
      <CalcSection title="B  Rent Increase Calculator"><RentIncreaseCalc /></CalcSection>
      <CalcSection title="C  Break Lease Fee Calculator"><BreakLeaseCalc /></CalcSection>
      <CalcSection title="D  Rental Yield & ROI Calculator"><YieldCalc /></CalcSection>
    </div>
  )
}
