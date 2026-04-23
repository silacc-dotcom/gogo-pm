export type SubscriptionTier = 'free' | 'premium'
export type UserRole = 'admin' | 'pm'
export type PropertyStatus = 'vacant' | 'leased' | 'for_lease'
export type RentFrequency = 'weekly' | 'fortnightly' | 'monthly'
export type ImportSource = 'propertytree' | 'propertyme' | 'console' | 'palace' | 'csv' | 'manual'
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low'
export type TaskStatus = 'pending' | 'complete'
export type TaskCategory = 'inspection' | 'form' | 'compliance' | 'maintenance' | 'admin'
export type ReminderType = 'lease_expiry' | 'inspection' | 'compliance' | 'rent_arrears' | 'task_due'
export type Recurrence = 'none' | 'weekly' | 'monthly' | 'yearly'
export type FormDraftStatus = 'draft' | 'ready' | 'sent'
export type WebhookStatus = 'success' | 'error' | 'ignored'

export interface Agency {
  id: string
  created_at: string
  name: string
  abn: string | null
  licence_number: string | null
  address: string | null
  phone: string | null
  email: string | null
  subscription_tier: SubscriptionTier
  subscription_status: string | null
  stripe_customer_id: string | null
  max_properties: number | null
}

export interface Profile {
  id: string
  agency_id: string
  full_name: string
  role: UserRole
  phone: string | null
  rei_forms_live_email: string | null
  rei_forms_live_token: string | null
  avatar_url: string | null
  created_at: string
}

export interface Property {
  id: string
  created_at: string
  agency_id: string
  user_id: string
  address: string
  suburb: string
  state: string
  postcode: string
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  property_type: string | null
  status: PropertyStatus
  landlord_name: string | null
  landlord_email: string | null
  landlord_phone: string | null
  landlord_abn: string | null
  tenant_name: string | null
  tenant_email: string | null
  tenant_phone: string | null
  rent_amount: number | null
  rent_frequency: RentFrequency | null
  lease_start: string | null
  lease_end: string | null
  bond_amount: number | null
  water_efficient: boolean | null
  pets_allowed: boolean | null
  notes: string | null
  agency_agreement_signed: boolean | null
  import_source: ImportSource
  last_synced_at: string | null
  external_id: string | null
  external_tenancy_id: string | null
  normalised_address: string | null
}

export interface Task {
  id: string
  created_at: string
  agency_id: string
  user_id: string
  property_id: string | null
  title: string
  description: string | null
  due_date: string | null
  priority: TaskPriority
  status: TaskStatus
  category: TaskCategory
  form_code: string | null
  linked_reminder_id: string | null
  property?: Property
}

export interface Reminder {
  id: string
  created_at: string
  agency_id: string
  user_id: string
  property_id: string | null
  title: string
  description: string | null
  due_date: string
  reminder_type: ReminderType
  recurrence: Recurrence
  push_notified: boolean
  dismissed: boolean
  property?: Property
}

export interface FormDraft {
  id: string
  created_at: string
  agency_id: string
  user_id: string
  property_id: string | null
  form_code: string
  form_name: string
  form_data: Record<string, unknown>
  status: FormDraftStatus
  rei_forms_url: string | null
  notes: string | null
  property?: Property
}

export interface WebhookLog {
  id: string
  agency_id: string
  source: string
  event_type: string
  raw_payload: Record<string, unknown>
  mapped_data: Record<string, unknown> | null
  status: WebhookStatus
  error_message: string | null
  property_id: string | null
  created_at: string
}

export interface AgencyApiKey {
  id: string
  agency_id: string
  key_hash: string
  label: string
  created_at: string
  last_used_at: string | null
  revoked: boolean
}

// Form wizard types
export interface FormDefinition {
  code: string
  name: string
  category: string
  description?: string
}

export interface WizardStep {
  id: string
  title: string
  fields: WizardField[]
}

export interface WizardField {
  id: string
  label: string
  type: 'text' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'yesno'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
  legislation?: string
  hint?: string
  autoFillFrom?: keyof Property
}
