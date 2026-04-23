import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { FM00401Wizard } from './wizards/FM00401Wizard'
import { NORIWizard } from './wizards/NORIWizard'
import { FM00104Wizard } from './wizards/FM00104Wizard'
import { GenericWizard } from './wizards/GenericWizard'
import { getFormByCode } from '@/lib/formsLibrary'

export function WizardRouter() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  if (!code) { navigate('/forms'); return null }

  const form = getFormByCode(code)
  if (!form) return <div className="px-4 pt-8 text-sm text-[#6B6560]">Form not found: {code}</div>

  switch (code) {
    case 'FM00401': return <FM00401Wizard />
    case 'NORI': return <NORIWizard />
    case 'FM00104': return <FM00104Wizard />
    default: return <GenericWizard formCode={code} formName={form.name} />
  }
}
