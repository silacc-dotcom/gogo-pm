import type { Property } from '@/types'

type PropertyUpdate = Partial<Omit<Property, 'id' | 'created_at' | 'agency_id' | 'user_id'>>

type FieldMapper = (payload: Record<string, unknown>) => PropertyUpdate

function get(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') {
      const arrMatch = key.match(/^(\w+)\[(\d+)\]$/)
      if (arrMatch) {
        const arr = (acc as Record<string, unknown>)[arrMatch[1]]
        return Array.isArray(arr) ? arr[parseInt(arrMatch[2])] : undefined
      }
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function str(val: unknown): string | null {
  return val != null ? String(val) : null
}

function num(val: unknown): number | null {
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function joinName(first: unknown, last: unknown): string | null {
  const parts = [str(first), str(last)].filter(Boolean)
  return parts.length ? parts.join(' ') : null
}

// TODO: Verify field names against live PropertyTree API documentation before production release.
const propertyTreeMapper: FieldMapper = (payload) => ({
  address: str(get(payload, 'property.streetAddress')),
  suburb: str(get(payload, 'property.suburb')),
  state: str(get(payload, 'property.state')),
  postcode: str(get(payload, 'property.postCode')),
  bedrooms: num(get(payload, 'property.bedrooms')),
  bathrooms: num(get(payload, 'property.bathrooms')),
  parking: num(get(payload, 'property.carSpaces')),
  property_type: str(get(payload, 'property.propertyType')),
  external_id: str(get(payload, 'property.id')),
  external_tenancy_id: str(get(payload, 'tenancy.id')),
  lease_start: str(get(payload, 'tenancy.startDate')),
  lease_end: str(get(payload, 'tenancy.endDate')),
  rent_amount: num(get(payload, 'tenancy.rentAmount')),
  rent_frequency: str(get(payload, 'tenancy.rentFrequency')) as Property['rent_frequency'],
  bond_amount: num(get(payload, 'tenancy.bondAmount')),
  status: str(get(payload, 'tenancy.status')) as Property['status'],
  tenant_name: joinName(
    get(payload, 'tenancy.tenants[0].firstName'),
    get(payload, 'tenancy.tenants[0].lastName')
  ),
  tenant_email: str(get(payload, 'tenancy.tenants[0].email')),
  tenant_phone: str(get(payload, 'tenancy.tenants[0].mobile')),
  landlord_name: joinName(
    get(payload, 'tenancy.owner.firstName'),
    get(payload, 'tenancy.owner.lastName')
  ),
  landlord_email: str(get(payload, 'tenancy.owner.email')),
  landlord_phone: str(get(payload, 'tenancy.owner.phone')),
  import_source: 'propertytree'
})

// TODO: Verify field names against live PropertyMe API documentation before production release.
const propertyMeMapper: FieldMapper = (payload) => ({
  address: str(get(payload, 'property.address')),
  suburb: str(get(payload, 'property.suburb')),
  state: str(get(payload, 'property.state')),
  postcode: str(get(payload, 'property.postcode')),
  bedrooms: num(get(payload, 'property.bedrooms')),
  bathrooms: num(get(payload, 'property.bathrooms')),
  parking: num(get(payload, 'property.carSpaces')),
  property_type: str(get(payload, 'property.propertyType')),
  external_id: str(get(payload, 'property.id')),
  external_tenancy_id: str(get(payload, 'tenancy.id')),
  lease_start: str(get(payload, 'tenancy.startDate')),
  lease_end: str(get(payload, 'tenancy.endDate')),
  rent_amount: num(get(payload, 'tenancy.rentAmount')),
  rent_frequency: str(get(payload, 'tenancy.rentFrequency')) as Property['rent_frequency'],
  bond_amount: num(get(payload, 'tenancy.bondAmount')),
  status: str(get(payload, 'tenancy.status')) as Property['status'],
  tenant_name: joinName(
    get(payload, 'tenancy.tenants[0].firstName'),
    get(payload, 'tenancy.tenants[0].lastName')
  ),
  tenant_email: str(get(payload, 'tenancy.tenants[0].email')),
  tenant_phone: str(get(payload, 'tenancy.tenants[0].mobile')),
  landlord_name: joinName(
    get(payload, 'tenancy.owner.firstName'),
    get(payload, 'tenancy.owner.lastName')
  ),
  landlord_email: str(get(payload, 'tenancy.owner.email')),
  landlord_phone: str(get(payload, 'tenancy.owner.phone')),
  import_source: 'propertyme'
})

// TODO: Verify field names against live Console API documentation before production release.
const consoleMapper: FieldMapper = (payload) => ({
  address: str(get(payload, 'Property.Address')),
  suburb: str(get(payload, 'Property.Suburb')),
  state: str(get(payload, 'Property.State')),
  postcode: str(get(payload, 'Property.Postcode')),
  bedrooms: num(get(payload, 'Property.Bedrooms')),
  bathrooms: num(get(payload, 'Property.Bathrooms')),
  parking: num(get(payload, 'Property.CarSpaces')),
  lease_start: str(get(payload, 'Tenancy.LeaseStart')),
  lease_end: str(get(payload, 'Tenancy.LeaseEnd')),
  rent_amount: num(get(payload, 'Tenancy.Rent')),
  tenant_name: str(get(payload, 'Tenancy.Tenants[0].Name')),
  tenant_email: str(get(payload, 'Tenancy.Tenants[0].Email')),
  tenant_phone: str(get(payload, 'Tenancy.Tenants[0].Phone')),
  landlord_name: str(get(payload, 'Owner.Name')),
  landlord_email: str(get(payload, 'Owner.Email')),
  landlord_phone: str(get(payload, 'Owner.Phone')),
  import_source: 'console'
})

// TODO: Verify field names against live Palace API documentation before production release.
const palaceMapper: FieldMapper = (payload) => ({
  address: str(get(payload, 'Property.Address1')),
  suburb: str(get(payload, 'Property.Suburb')),
  state: str(get(payload, 'Property.State')),
  postcode: str(get(payload, 'Property.Postcode')),
  lease_start: str(get(payload, 'Lease.StartDate')),
  lease_end: str(get(payload, 'Lease.ExpiryDate')),
  rent_amount: num(get(payload, 'Lease.RentAmount')),
  tenant_name: str(get(payload, 'Tenant.FullName')),
  tenant_email: str(get(payload, 'Tenant.Email')),
  tenant_phone: str(get(payload, 'Tenant.Phone')),
  landlord_name: str(get(payload, 'Owner.FullName')),
  landlord_email: str(get(payload, 'Owner.Email')),
  landlord_phone: str(get(payload, 'Owner.Phone')),
  import_source: 'palace'
})

// GoGo PM Generic Webhook Format: accepts flat JSON using GoGo PM field names directly.
const genericMapper: FieldMapper = (payload) => ({
  address: str(payload.address),
  suburb: str(payload.suburb),
  state: str(payload.state),
  postcode: str(payload.postcode),
  bedrooms: num(payload.bedrooms),
  bathrooms: num(payload.bathrooms),
  parking: num(payload.parking),
  property_type: str(payload.property_type),
  status: str(payload.status) as Property['status'],
  landlord_name: str(payload.landlord_name),
  landlord_email: str(payload.landlord_email),
  landlord_phone: str(payload.landlord_phone),
  tenant_name: str(payload.tenant_name),
  tenant_email: str(payload.tenant_email),
  tenant_phone: str(payload.tenant_phone),
  rent_amount: num(payload.rent_amount),
  rent_frequency: str(payload.rent_frequency) as Property['rent_frequency'],
  lease_start: str(payload.lease_start),
  lease_end: str(payload.lease_end),
  bond_amount: num(payload.bond_amount),
  external_id: str(payload.external_id),
  import_source: 'csv'
})

export const CRM_FIELD_MAPS: Record<string, FieldMapper> = {
  propertytree: propertyTreeMapper,
  propertyme: propertyMeMapper,
  console: consoleMapper,
  palace: palaceMapper,
  generic: genericMapper
}

export function mapCRMPayload(
  source: string,
  payload: Record<string, unknown>
): PropertyUpdate | null {
  const mapper = CRM_FIELD_MAPS[source.toLowerCase()]
  if (!mapper) return null

  const mapped = mapper(payload)
  // Remove null/undefined entries
  return Object.fromEntries(
    Object.entries(mapped).filter(([, v]) => v !== null && v !== undefined)
  ) as PropertyUpdate
}

export function normaliseAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
