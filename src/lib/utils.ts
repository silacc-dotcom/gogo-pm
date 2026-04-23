import { format, parseISO, differenceInDays, addDays, addWeeks, addMonths, isAfter, isBefore } from 'date-fns'
import { toZonedTime, formatInTimeZone } from 'date-fns-tz'

const TZ = 'Australia/Sydney'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(d, TZ, 'dd/MM/yyyy')
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatInTimeZone(d, TZ, 'dd/MM/yyyy h:mm a')
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2
  }).format(amount)
}

export function formatRent(amount: number | null, frequency: string | null): string {
  if (!amount) return '—'
  const freq = frequency === 'weekly' ? 'pw' : frequency === 'fortnightly' ? 'pf' : 'pm'
  return `${formatCurrency(amount)} ${freq}`
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('04') && digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  if (digits.startsWith('02') || digits.startsWith('03') || digits.startsWith('07') || digits.startsWith('08')) {
    if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`
  }
  return phone
}

export function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  const now = toZonedTime(new Date(), TZ)
  const target = toZonedTime(parseISO(dateStr), TZ)
  return differenceInDays(target, now)
}

export function leaseUrgency(leaseEnd: string | null | undefined): 'normal' | 'amber' | 'red' {
  const days = daysUntil(leaseEnd)
  if (days === null) return 'normal'
  if (days <= 30) return 'red'
  if (days <= 60) return 'amber'
  return 'normal'
}

export function todayAEST(): Date {
  return toZonedTime(new Date(), TZ)
}

export function addWorkingDays(date: Date, days: number): Date {
  let result = date
  let added = 0
  while (added < days) {
    result = addDays(result, 1)
    const dow = result.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return result
}

export { addDays, addWeeks, addMonths, isAfter, isBefore, format, parseISO }

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str
}

export function fullAddress(p: { address: string; suburb: string; state: string; postcode: string }): string {
  return `${p.address}, ${p.suburb} ${p.state} ${p.postcode}`
}
