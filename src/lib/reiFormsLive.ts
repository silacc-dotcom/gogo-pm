// REI Forms Live integration — 3-stage architecture
// Stage 1: Manual entry summary panel (built, zero dependency)
// Stage 2: Deep-link URL construction (enable via flag below)
// Stage 3: Direct API population (requires partnership)

// TODO: Confirm REI Forms Live URL scheme and supported param names with REI Forms
// Live team before enabling Stage 2. One email to confirm. Enable by updating flag below.
const REI_FORMS_DEEP_LINK_ENABLED = false

const REI_FORMS_BASE_URL = 'https://www.reiformslive.com.au'

export function buildREIFormsUrl(formCode: string, data: Record<string, unknown>): string {
  if (!REI_FORMS_DEEP_LINK_ENABLED) {
    return REI_FORMS_BASE_URL
  }

  // TODO: Replace with confirmed URL scheme from REI Forms Live team
  const params = new URLSearchParams()
  params.set('form', formCode)

  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value))
    }
  }

  return `${REI_FORMS_BASE_URL}/forms/new?${params.toString()}`
}

export function openREIFormsLive(formCode?: string): void {
  const url = formCode
    ? `${REI_FORMS_BASE_URL}` // Stage 1: open homepage
    : REI_FORMS_BASE_URL
  window.open(url, '_blank', 'noopener,noreferrer')
}

// TODO: Stage 3 — Direct API population. Requires REI Forms Live to grant API partner
// access. Implement by replacing the summary panel with a direct POST to their forms API.
// No UI rebuild needed — swap the handoff function only.
export async function submitToREIFormsAPI(
  _formCode: string,
  _data: Record<string, unknown>,
  _token: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  throw new Error('Stage 3 not yet implemented — requires REI Forms Live API partnership')
}

export interface FormSection {
  title: string
  fields: { label: string; value: string | null | undefined }[]
}

export function formatForManualEntry(sections: FormSection[]): FormSection[] {
  return sections.filter(s => s.fields.some(f => f.value))
}
