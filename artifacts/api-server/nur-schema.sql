-- ============================================================
-- NUR & CO AESTHETICS — Premium Plus Schema (single location)
-- Target: Supabase project nur-andco-aesthetix (kgbgqukgsfcrpkdxiptx)
-- Idempotent: safe to re-run
-- Last edited: 27 Apr 2026
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =====================================================
-- 1. CORE TABLES
-- =====================================================

create table if not exists locations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  address text,
  address_full text,
  postcode text,
  phone text,
  email text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists treatments (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  name text not null,
  category text,
  description text,
  duration_minutes integer not null default 30,
  price numeric(10,2) not null default 0,
  deposit_amount numeric(10,2) not null default 20,
  deposit_type text default 'fixed',
  requires_medical_form boolean default false,
  requires_consent_form boolean default false,
  short_description text,
  active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now()
);
create index if not exists idx_treatments_location on treatments(location_id);
create index if not exists idx_treatments_active on treatments(active);

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text,
  phone text,
  date_of_birth date,
  notes text,
  created_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete restrict,
  treatment_id uuid references treatments(id) on delete restrict,
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  booking_date date not null,
  time_slot time not null,
  duration_minutes integer not null default 30,
  status text default 'pending',
  deposit_paid boolean default false,
  stripe_payment_intent_id text,
  google_calendar_event_id text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_bookings_date on bookings(booking_date);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_email on bookings(client_email);

-- =====================================================
-- 2. AVAILABILITY & SCHEDULING
-- =====================================================

create table if not exists availability_settings (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  is_open boolean default true,
  open_time time,
  close_time time,
  slot_duration_minutes integer default 30,
  buffer_minutes integer default 15,
  unique(location_id, day_of_week)
);

create table if not exists blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  blocked_date date not null,
  reason text,
  created_at timestamptz default now(),
  unique(location_id, blocked_date)
);

create table if not exists blocked_slots (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  day_of_week integer check (day_of_week between 0 and 6),
  all_days boolean default false,
  start_time time not null,
  end_time time not null,
  label text,
  created_at timestamptz default now()
);
create index if not exists idx_blocked_slots_location on blocked_slots(location_id, day_of_week);

-- =====================================================
-- 3. PREMIUM PLUS — Forms
-- =====================================================

create table if not exists medical_forms (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  client_email text not null,
  client_name text not null,
  dob date,
  address text,
  gp_name text,
  gp_practice text,
  conditions jsonb default '{}',
  medications text,
  allergies text,
  pregnancy_status text,
  additional_notes text,
  signature_data text,
  ip_address text,
  submitted_at timestamptz default now()
);
create index if not exists idx_medical_forms_booking on medical_forms(booking_id);
create index if not exists idx_medical_forms_email on medical_forms(client_email);

create table if not exists consent_forms (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) on delete cascade,
  client_email text not null,
  client_name text not null,
  treatment text,
  consents jsonb default '{}',
  additional_notes text,
  signature_data text,
  ip_address text,
  signed_at timestamptz default now()
);
create index if not exists idx_consent_forms_booking on consent_forms(booking_id);

create table if not exists form_tokens (
  token text primary key,
  booking_id uuid references bookings(id) on delete cascade,
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_form_tokens_booking on form_tokens(booking_id);

-- =====================================================
-- 4. PREMIUM PLUS — Subscriptions (Nur's brief)
-- =====================================================

create table if not exists subscription_tiers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  price_monthly numeric(10,2) not null,
  cadence text default 'monthly',
  treatments_included jsonb default '[]',
  stripe_price_id text,
  display_order integer default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete restrict,
  tier_id uuid references subscription_tiers(id) on delete restrict,
  status text default 'pending',
  start_date date,
  next_billing_date date,
  stripe_customer_id text,
  stripe_subscription_id text,
  cancelled_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_subscriptions_client on subscriptions(client_id);
create index if not exists idx_subscriptions_status on subscriptions(status);

-- =====================================================
-- 5. ELITE+ — Google Calendar
-- =====================================================

create table if not exists google_calendar_tokens (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references locations(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  calendar_id text,
  updated_at timestamptz default now()
);

-- =====================================================
-- 6. ADMIN & PORTAL
-- =====================================================

create table if not exists admin_users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  password_hash text not null,
  full_name text,
  active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now()
);

create table if not exists portal_kv (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

create table if not exists enquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null default '',
  phone text default '',
  message text default '',
  source text default 'contact_form',
  status text default 'new',
  created_at timestamptz default now()
);

-- =====================================================
-- 7. RLS
-- =====================================================

alter table locations             enable row level security;
alter table treatments            enable row level security;
alter table clients               enable row level security;
alter table bookings              enable row level security;
alter table availability_settings enable row level security;
alter table blocked_dates         enable row level security;
alter table blocked_slots         enable row level security;
alter table medical_forms         enable row level security;
alter table consent_forms         enable row level security;
alter table form_tokens           enable row level security;
alter table subscription_tiers    enable row level security;
alter table subscriptions         enable row level security;
alter table google_calendar_tokens enable row level security;
alter table admin_users           enable row level security;
alter table portal_kv             enable row level security;
alter table enquiries             enable row level security;

drop policy if exists "locations_anon_read" on locations;
create policy "locations_anon_read" on locations
  for select to anon using (active = true);

drop policy if exists "treatments_anon_read" on treatments;
create policy "treatments_anon_read" on treatments
  for select to anon using (active = true);

drop policy if exists "subscription_tiers_anon_read" on subscription_tiers;
create policy "subscription_tiers_anon_read" on subscription_tiers
  for select to anon using (active = true);

drop policy if exists "availability_anon_read" on availability_settings;
create policy "availability_anon_read" on availability_settings
  for select to anon using (true);

drop policy if exists "blocked_dates_anon_read" on blocked_dates;
create policy "blocked_dates_anon_read" on blocked_dates
  for select to anon using (true);

drop policy if exists "blocked_slots_anon_read" on blocked_slots;
create policy "blocked_slots_anon_read" on blocked_slots
  for select to anon using (true);

drop policy if exists "bookings_anon_insert" on bookings;
create policy "bookings_anon_insert" on bookings
  for insert to anon with check (true);

drop policy if exists "medical_forms_anon_insert" on medical_forms;
create policy "medical_forms_anon_insert" on medical_forms
  for insert to anon with check (true);

drop policy if exists "consent_forms_anon_insert" on consent_forms;
create policy "consent_forms_anon_insert" on consent_forms
  for insert to anon with check (true);

drop policy if exists "enquiries_anon_insert" on enquiries;
create policy "enquiries_anon_insert" on enquiries
  for insert to anon with check (true);

-- =====================================================
-- 8. SEED — Nur's location & default availability
-- =====================================================

insert into locations (name, slug, address, postcode, active)
values ('Nottingham', 'nur-and-co', 'Nottingham, UK', null, true)
on conflict (slug) do nothing;

do $$
declare
  loc_id uuid;
begin
  select id into loc_id from locations where slug = 'nur-and-co';
  if loc_id is null then return; end if;

  insert into availability_settings (location_id, day_of_week, is_open, open_time, close_time, slot_duration_minutes, buffer_minutes)
  values
    (loc_id, 0, false, null,    null,    30, 15),
    (loc_id, 1, true,  '09:00', '18:00', 30, 15),
    (loc_id, 2, true,  '09:00', '18:00', 30, 15),
    (loc_id, 3, true,  '09:00', '18:00', 30, 15),
    (loc_id, 4, true,  '09:00', '18:00', 30, 15),
    (loc_id, 5, true,  '09:00', '18:00', 30, 15),
    (loc_id, 6, true,  '09:00', '18:00', 30, 15)
  on conflict (location_id, day_of_week) do nothing;
end $$;

-- ============================================================
-- END
-- ============================================================

-- =====================================================
-- 9. GRANTS (Postgres role permissions, separate from RLS)
-- =====================================================
-- IMPORTANT: Tables created via SQL Editor don't auto-grant
-- table ACLs to anon/authenticated/service_role. Without these
-- grants, queries fail with code 42501 "permission denied"
-- BEFORE RLS even runs. RLS still controls actual access; these
-- grants just let the role's query reach the RLS check.
--
-- This matches what Supabase's dashboard table-creator does.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- Default privileges for any tables added later
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
