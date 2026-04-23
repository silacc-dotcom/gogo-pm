-- GoGo PM — Supabase Schema & RLS Policies
-- Run this in your Supabase SQL editor to initialise the database.

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- AGENCIES
-- ─────────────────────────────────────────────
create table if not exists agencies (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  abn text,
  licence_number text,
  address text,
  phone text,
  email text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free','premium')),
  subscription_status text,
  stripe_customer_id text,
  max_properties integer default 5
);

alter table agencies enable row level security;

create policy "Agency members can read own agency"
  on agencies for select
  using (id in (
    select agency_id from profiles where id = auth.uid()
  ));

create policy "Agency admins can update own agency"
  on agencies for update
  using (id in (
    select agency_id from profiles where id = auth.uid() and role = 'admin'
  ));

-- ─────────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  agency_id uuid references agencies(id) on delete cascade,
  full_name text not null,
  role text not null default 'pm' check (role in ('admin','pm')),
  phone text,
  rei_forms_live_email text,
  rei_forms_live_token text, -- stored encrypted
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Agency members can read agency profiles"
  on profiles for select
  using (agency_id in (
    select agency_id from profiles where id = auth.uid()
  ));

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

-- ─────────────────────────────────────────────
-- AGENCY API KEYS
-- ─────────────────────────────────────────────
create table if not exists agency_api_keys (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references agencies(id) on delete cascade,
  key_hash text not null,
  label text not null,
  created_at timestamptz default now(),
  last_used_at timestamptz,
  revoked boolean default false
);

alter table agency_api_keys enable row level security;

create policy "Agency admins can manage api keys"
  on agency_api_keys for all
  using (agency_id in (
    select agency_id from profiles where id = auth.uid() and role = 'admin'
  ));

-- ─────────────────────────────────────────────
-- PROPERTIES
-- ─────────────────────────────────────────────
create table if not exists properties (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  agency_id uuid references agencies(id) on delete cascade,
  user_id uuid references auth.users(id),
  address text not null,
  suburb text not null,
  state text not null default 'NSW',
  postcode text not null,
  bedrooms integer,
  bathrooms integer,
  parking integer,
  property_type text,
  status text not null default 'vacant' check (status in ('vacant','leased','for_lease')),
  landlord_name text,
  landlord_email text,
  landlord_phone text,
  landlord_abn text,
  tenant_name text,
  tenant_email text,
  tenant_phone text,
  rent_amount numeric(10,2),
  rent_frequency text check (rent_frequency in ('weekly','fortnightly','monthly')),
  lease_start date,
  lease_end date,
  bond_amount numeric(10,2),
  water_efficient boolean,
  pets_allowed boolean,
  notes text,
  agency_agreement_signed boolean,
  import_source text not null default 'manual',
  last_synced_at timestamptz,
  external_id text,
  external_tenancy_id text,
  normalised_address text generated always as (
    lower(regexp_replace(address || ' ' || suburb || ' ' || state || ' ' || postcode, '[^a-zA-Z0-9\s]', '', 'g'))
  ) stored
);

alter table properties enable row level security;

create policy "Agency members can read own agency properties"
  on properties for select
  using (
    agency_id in (select agency_id from profiles where id = auth.uid())
    and (
      -- PM sees own properties, admin sees all
      user_id = auth.uid()
      or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    )
  );

create policy "Agency members can insert properties"
  on properties for insert
  with check (agency_id in (select agency_id from profiles where id = auth.uid()));

create policy "Property owners and admins can update"
  on properties for update
  using (
    agency_id in (select agency_id from profiles where id = auth.uid())
    and (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

create policy "Property owners and admins can delete"
  on properties for delete
  using (
    user_id = auth.uid()
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ─────────────────────────────────────────────
-- TASKS
-- ─────────────────────────────────────────────
create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  agency_id uuid references agencies(id) on delete cascade,
  user_id uuid references auth.users(id),
  property_id uuid references properties(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'normal' check (priority in ('urgent','high','normal','low')),
  status text not null default 'pending' check (status in ('pending','complete')),
  category text not null default 'admin' check (category in ('inspection','form','compliance','maintenance','admin')),
  form_code text,
  linked_reminder_id uuid
);

alter table tasks enable row level security;

create policy "Agency members can manage own tasks"
  on tasks for all
  using (
    agency_id in (select agency_id from profiles where id = auth.uid())
    and (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

-- ─────────────────────────────────────────────
-- REMINDERS
-- ─────────────────────────────────────────────
create table if not exists reminders (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  agency_id uuid references agencies(id) on delete cascade,
  user_id uuid references auth.users(id),
  property_id uuid references properties(id) on delete set null,
  title text not null,
  description text,
  due_date date not null,
  reminder_type text not null check (reminder_type in ('lease_expiry','inspection','compliance','rent_arrears','task_due')),
  recurrence text not null default 'none' check (recurrence in ('none','weekly','monthly','yearly')),
  push_notified boolean default false,
  dismissed boolean default false
);

alter table reminders enable row level security;

create policy "Agency members can manage own reminders"
  on reminders for all
  using (
    agency_id in (select agency_id from profiles where id = auth.uid())
    and (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

-- ─────────────────────────────────────────────
-- FORM DRAFTS
-- ─────────────────────────────────────────────
create table if not exists form_drafts (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  agency_id uuid references agencies(id) on delete cascade,
  user_id uuid references auth.users(id),
  property_id uuid references properties(id) on delete set null,
  form_code text not null,
  form_name text not null,
  form_data jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','ready','sent')),
  rei_forms_url text,
  notes text
);

alter table form_drafts enable row level security;

create policy "Agency members can manage own form drafts"
  on form_drafts for all
  using (
    agency_id in (select agency_id from profiles where id = auth.uid())
    and (user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  );

-- ─────────────────────────────────────────────
-- WEBHOOK LOGS
-- ─────────────────────────────────────────────
create table if not exists webhook_logs (
  id uuid primary key default uuid_generate_v4(),
  agency_id uuid references agencies(id) on delete cascade,
  source text not null,
  event_type text not null,
  raw_payload jsonb,
  mapped_data jsonb,
  status text not null check (status in ('success','error','ignored')),
  error_message text,
  property_id uuid references properties(id) on delete set null,
  created_at timestamptz default now()
);

alter table webhook_logs enable row level security;

create policy "Agency admins can read webhook logs"
  on webhook_logs for select
  using (agency_id in (
    select agency_id from profiles where id = auth.uid() and role = 'admin'
  ));

-- ─────────────────────────────────────────────
-- FUNCTION: create agency + admin profile atomically
-- ─────────────────────────────────────────────
create or replace function create_agency_and_profile(
  p_user_id uuid,
  p_full_name text,
  p_agency_name text,
  p_abn text default null,
  p_licence_number text default null
) returns void language plpgsql security definer as $$
declare
  v_agency_id uuid;
begin
  insert into agencies (name, abn, licence_number)
  values (p_agency_name, p_abn, p_licence_number)
  returning id into v_agency_id;

  insert into profiles (id, agency_id, full_name, role)
  values (p_user_id, v_agency_id, p_full_name, 'admin');
end;
$$;
