export interface FormDefinition {
  code: string
  name: string
  category: string
  description?: string
  priority?: boolean
}

export const FORMS_LIBRARY: FormDefinition[] = [
  // Management Agreements
  { code: 'FM00015', name: 'Holiday Premises Management Agency Agreement', category: 'Management Agreements' },
  { code: 'FM00100', name: 'Exclusive Management Agency Agreement (long)', category: 'Management Agreements' },
  { code: 'FM00150', name: 'Exclusive Management Agency Agreement (short)', category: 'Management Agreements' },
  { code: 'FM00200', name: 'Exclusive Leasing Agency Agreement', category: 'Management Agreements' },
  { code: 'FM00250', name: 'Leasing Agency Agreement', category: 'Management Agreements' },
  // Tenancy
  { code: 'FM00401', name: 'Residential Tenancy Agreement', category: 'Tenancy', priority: true },
  { code: 'FM00401c', name: 'Surrender of Tenancy Agreement', category: 'Tenancy' },
  { code: 'FM00403', name: 'Request to Sign RTA Without Physical Inspection', category: 'Tenancy' },
  { code: 'FM00700', name: 'Application for Tenancy', category: 'Tenancy' },
  // During Tenancy
  { code: 'FM00104', name: 'Routine Inspection Report', category: 'During Tenancy', priority: true },
  { code: 'FM00104d', name: 'Routine Inspection Report (Inspect Live)', category: 'During Tenancy' },
  { code: 'FM00409a', name: 'Condition Report Additional Sheet', category: 'During Tenancy' },
  { code: 'FM00409d', name: 'Condition Report (Dynamic)', category: 'During Tenancy', priority: true },
  { code: 'FM01010', name: 'Notice of Access / Inspection / Entry', category: 'During Tenancy' },
  { code: 'FM01005', name: 'Notice of Intention to Sell', category: 'During Tenancy' },
  { code: 'NORI', name: 'Notice of Rent Increase', category: 'During Tenancy', priority: true },
  { code: 'FM00402', name: 'Notice to Remedy Breach', category: 'During Tenancy' },
  { code: 'FM01075', name: 'Notice by Landlord of Change to Material Fact', category: 'During Tenancy' },
  { code: 'FM01078', name: 'Notice to Tenant of Change to Material Fact', category: 'During Tenancy' },
  { code: 'FTR-PET', name: 'Apply to Keep a Pet', category: 'During Tenancy' },
  { code: 'FM01025', name: 'Tenant Consent to Photographs', category: 'During Tenancy' },
  { code: 'FM01020', name: 'Email Service of Notices Consent', category: 'During Tenancy' },
  // Compliance
  { code: 'FM01055', name: 'Smoke Alarm Compliance Form', category: 'Compliance' },
  { code: 'FM01060', name: 'Landlord Smoke Alarm Checklist', category: 'Compliance' },
  { code: 'SF003', name: 'Material Fact and Other Disclosure Statement', category: 'Compliance' },
  { code: 'FM01030', name: 'Landlord Acknowledgements', category: 'Compliance' },
  { code: 'FTR-LIS', name: 'Landlord Information Statement', category: 'Compliance' },
  // Ending Tenancy
  { code: 'FM00404', name: 'Termination Notice', category: 'Ending Tenancy', priority: true },
  { code: 'FM00405', name: 'Notice to Give Vacant Possession', category: 'Ending Tenancy' },
  { code: 'FM01065', name: 'Notice of New Owner (Attornment)', category: 'Ending Tenancy' },
  { code: 'FM01080', name: 'Notice of Intention to Dispose of Uncollected Goods', category: 'Ending Tenancy' },
  // Contractors
  { code: 'FM01070', name: 'Contractor Application Form', category: 'Contractors' }
]

export const FORM_CATEGORIES = [
  'Management Agreements',
  'Tenancy',
  'During Tenancy',
  'Compliance',
  'Ending Tenancy',
  'Contractors'
]

export const PRIORITY_WIZARDS = ['FM00401', 'FM00104', 'FM00409d', 'NORI', 'FM00401c']

export function getFormByCode(code: string): FormDefinition | undefined {
  return FORMS_LIBRARY.find((f) => f.code === code)
}
