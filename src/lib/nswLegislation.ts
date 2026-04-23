// NSW legislation references current as of 2024.
// Verify against current legislation before production release.

export interface LegislationEntry {
  key: string
  section: string
  summary: string
  detail: string
}

export const LEGISLATION: Record<string, LegislationEntry> = {
  bond_maximum: {
    key: 'bond_maximum',
    section: 'RTA 2010 s.166',
    summary: 'Max bond is 4 weeks rent for rent ≤ $900/wk',
    detail:
      'For residential premises where the weekly rent is $900 or less, the maximum bond is equivalent to 4 weeks rent. For premises where rent exceeds $900 per week, there is no statutory cap, but the bond must be reasonable. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  bond_lodgement: {
    key: 'bond_lodgement',
    section: 'RTA 2010 s.168',
    summary: 'Must lodge within 10 working days of receipt',
    detail:
      'A landlord or agent who receives a rental bond must lodge the bond with NSW Fair Trading within 10 working days after receiving it. Failure to lodge is an offence. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  rent_increase: {
    key: 'rent_increase',
    section: 'RTA 2010 s.41-42',
    summary: 'Max once per 12 months, 60 days written notice',
    detail:
      'Rent may only be increased once per 12-month period (applicable from 19 June 2023). The landlord must give at least 60 days written notice of any rent increase. The notice must specify the new rent amount and the date from which it applies. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  entry_notice: {
    key: 'entry_notice',
    section: 'RTA 2010 s.72',
    summary: 'Min 7 days notice, max 4 inspections per year',
    detail:
      'A landlord or agent may enter premises for a routine inspection by giving at least 7 days written notice. Routine inspections are limited to a maximum of 4 per year. Entry must occur between 8am and 8pm on a day other than a Sunday or public holiday (unless the tenant agrees). Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  break_lease: {
    key: 'break_lease',
    section: 'RTA 2010 s.107A',
    summary: 'Tiered break fee for leases from 23 March 2020',
    detail:
      'For fixed-term agreements of 3 years or less entered into from 23 March 2020, a break fee applies based on what proportion of the lease has been served: less than 25% = 4 weeks rent; 25–50% = 3 weeks rent; 50–75% = 2 weeks rent; more than 75% = 1 week rent. Different rules may apply to leases entered before 23 March 2020. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  water_charging: {
    key: 'water_charging',
    section: 'RTA 2010 s.39',
    summary: 'WELS compliance required to charge water usage',
    detail:
      'A landlord can only charge a tenant for water usage if: (1) the premises are separately metered; (2) all taps and showerheads are rated at least 3 WELS stars; (3) all toilets are dual flush; and (4) the landlord provides evidence of the water charges. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  termination_tenant: {
    key: 'termination_tenant',
    section: 'RTA 2010 s.97',
    summary: 'Tenant: 14 days notice at end of fixed term',
    detail:
      'A tenant wishing to end a fixed-term agreement at the end of the term must give the landlord at least 14 days written notice. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  termination_landlord: {
    key: 'termination_landlord',
    section: 'RTA 2010 s.84',
    summary: 'Landlord: 30 days notice at end of fixed term',
    detail:
      'A landlord wishing to end a fixed-term agreement at the end of the term must give the tenant at least 30 days written notice. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  condition_report: {
    key: 'condition_report',
    section: 'RTA 2010 s.29',
    summary: 'Must be provided before or at start of tenancy',
    detail:
      'A landlord must provide two copies of a condition report to the tenant before or at the time the tenant moves in. The tenant must return one signed copy within 7 days. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  smoke_alarms: {
    key: 'smoke_alarms',
    section: 'EP&A Act 1979 / EP&A Regulation 2021',
    summary: 'Annual check required',
    detail:
      'Landlords are required to ensure smoke alarms are tested and have working batteries annually. All smoke alarms must comply with Australian Standard AS 3786. Interconnected photoelectric smoke alarms are required in new and substantially renovated dwellings. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  },
  pets: {
    key: 'pets',
    section: 'RTA 2010 s.19A',
    summary: 'Cannot unreasonably refuse. Must use FTR-PET process.',
    detail:
      'A landlord cannot unreasonably refuse a tenant\'s application to keep a pet. A specific process applies using the FTR-PET form. The landlord has 21 days to respond to a pet application. Conditions may be attached to pet approval. Disclaimer: Legislative references current as of 2024. Verify against current legislation before relying on them.'
  }
}
