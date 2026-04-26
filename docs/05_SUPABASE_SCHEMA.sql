-- ═══════════════════════════════════════════════════════════════════
-- STARR AESTHETICS — Complete Supabase Schema
-- Derived from: supabase-migration.sql + PROJECT_SPEC.md + source audit
-- Run in Supabase dashboard → SQL Editor on a fresh project
-- ═══════════════════════════════════════════════════════════════════

-- ── 0. Schema permissions ────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: locations
-- Stores the clinic's physical locations. One row per location.
-- All other tables reference this via location_id FK.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS locations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,               -- Human-readable name e.g. "[LOCATION_1]"
  slug        TEXT UNIQUE NOT NULL,        -- URL-safe slug e.g. "hornchurch"
  address     TEXT,                        -- Full postal address
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "locations_anon_read"
  ON locations FOR SELECT TO anon USING (true);

-- service_role bypasses RLS automatically — no policy needed


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: treatments
-- All bookable treatments. Seeded with 77 rows (66 [LOCATION_1] + 11 [LOCATION_2]).
-- deposit_amount is always fixed: £20 for injectables, £10 for all others.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS treatments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id      UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  category         TEXT,                   -- "Aesthetics", "Lashes & Brows", "Nails", etc.
  duration_minutes INTEGER,                -- Appointment length in minutes
  price            NUMERIC,                -- Full price in GBP. 0 = POA (display only)
  deposit_amount   NUMERIC DEFAULT 10,     -- Fixed deposit: £20 injectables, £10 other
  deposit_type     TEXT DEFAULT 'fixed',   -- Always 'fixed' in this build
  active           BOOLEAN DEFAULT true,   -- Whether the treatment is bookable
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatments_location ON treatments(location_id);

ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "treatments_anon_read"
  ON treatments FOR SELECT TO anon USING (active = true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: clients
-- Client records per location. Strictly isolated — same email address
-- at two locations creates two independent client records.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS clients (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT,                        -- Nullable; normalised to lowercase for dedup
  phone        TEXT,                        -- Nullable; normalised: +44XXXXXXXXXX → 0XXXXXXXXXX
  notes        TEXT,                        -- Internal admin notes
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Dedup index: same client email cannot appear twice at same location
CREATE UNIQUE INDEX IF NOT EXISTS clients_location_email_unique
  ON clients(location_id, LOWER(email))
  WHERE email IS NOT NULL;

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- Clients are admin-only; anon has no direct access (bookings embed client details)


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: bookings
-- Core booking record. Status flows from pending_payment → awaiting_forms
-- → confirmed → completed (or cancelled).
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS bookings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id           UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  client_id             UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name           TEXT,               -- Denormalised for display speed
  client_email          TEXT,
  client_phone          TEXT,
  treatment             TEXT,               -- Legacy name column (kept for compatibility)
  treatment_name        TEXT,               -- Canonical treatment name
  treatment_id          UUID REFERENCES treatments(id) ON DELETE SET NULL,
  booking_date          DATE NOT NULL,      -- YYYY-MM-DD
  time_slot             TIME NOT NULL,      -- HH:MM:SS (stored UTC, displayed UK time)
  duration_minutes      INTEGER,            -- From treatment row
  total_amount          NUMERIC,            -- Full treatment price in £
  deposit_amount        NUMERIC,            -- Fixed deposit (£20 or £10)
  deposit_paid          BOOLEAN DEFAULT false,
  balance_due           NUMERIC,            -- Remainder after deposit
  status                TEXT DEFAULT 'pending_payment',
                        -- Values: pending_payment | awaiting_forms | confirmed | completed | cancelled
  payment_intent_id     TEXT,               -- Stripe PaymentIntent ID
  forms_completed       BOOLEAN DEFAULT false,
  forms_sent            BOOLEAN DEFAULT false,
  forms_reminder_sent   BOOLEAN DEFAULT false,
  reminder_sent         BOOLEAN DEFAULT false, -- 24h appointment reminder
  google_event_id       TEXT,               -- Google Calendar event ID
  notes                 TEXT,               -- Internal admin notes
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_location    ON bookings(location_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date        ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_client      ON bookings(client_id);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- anon can INSERT (public booking widget) but cannot SELECT
CREATE POLICY IF NOT EXISTS "bookings_anon_insert"
  ON bookings FOR INSERT TO anon WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: form_tokens
-- Single-use cryptographic tokens for the medical/consent forms link.
-- IMPORTANT: This table is NOT created by the seed helper.
-- It MUST be created manually before the forms system will work.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS form_tokens (
  token        TEXT PRIMARY KEY,            -- 64-char hex (32 random bytes)
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  expires_at   TIMESTAMPTZ NOT NULL,        -- 7 days from creation
  submitted_at TIMESTAMPTZ,                 -- Set on first use; makes token one-use
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS form_tokens_booking_id_idx ON form_tokens(booking_id);

ALTER TABLE form_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "form_tokens_service_all"
  ON form_tokens FOR ALL TO service_role USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: medical_forms
-- Stores client medical questionnaire submissions (one per booking).
-- anon can INSERT; admin reads via service_role.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS medical_forms (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id           TEXT NOT NULL,       -- References bookings.id (stored as TEXT for flexibility)
  client_email         TEXT NOT NULL,
  client_name          TEXT NOT NULL,
  dob                  TEXT,               -- Date of birth (free text from form)
  address              TEXT,
  gp_name              TEXT,
  gp_practice          TEXT,
  gp_phone             TEXT,
  conditions           JSONB DEFAULT '[]', -- Array of medical conditions
  medications          TEXT,
  allergies            TEXT,
  previous_treatments  TEXT,
  skin_concerns        TEXT,
  ip_address           TEXT,               -- For audit / fraud prevention
  submitted_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medical_forms_booking ON medical_forms(booking_id);
CREATE INDEX IF NOT EXISTS idx_medical_forms_email   ON medical_forms(client_email);

ALTER TABLE medical_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "medical_forms_anon_insert"
  ON medical_forms FOR INSERT TO anon WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: consent_forms
-- Stores client consent form submissions (one per booking).
-- Submission triggers booking status → confirmed and owner notification.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS consent_forms (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id       TEXT NOT NULL,
  client_email     TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  treatment        TEXT,
  consents         JSONB DEFAULT '{}',     -- Key-value map of consent items
  additional_notes TEXT,
  signature_data   TEXT,                   -- Base64 canvas signature image
  ip_address       TEXT,
  signed_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_forms_booking ON consent_forms(booking_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_email   ON consent_forms(client_email);

ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "consent_forms_anon_insert"
  ON consent_forms FOR INSERT TO anon WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: availability_settings
-- Per-location, per-day-of-week working hours.
-- Defaults seeded (Tue–Sat open, Mon/Sun closed).
-- UNIQUE constraint on (location_id, day_of_week) is critical.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS availability_settings (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                -- 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  is_open      BOOLEAN DEFAULT false,
  start_time   TIME,                        -- Opening time e.g. '10:00'
  end_time     TIME,                        -- Closing time e.g. '19:00'
  UNIQUE (location_id, day_of_week)         -- CRITICAL: prevents duplicate day rows
);

CREATE INDEX IF NOT EXISTS idx_availability_location ON availability_settings(location_id);

ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "availability_anon_read"
  ON availability_settings FOR SELECT TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: blocked_dates
-- Full days blocked from bookings (clinic closures, holidays).
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS blocked_dates (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL,               -- YYYY-MM-DD
  label        TEXT,                        -- Optional label e.g. "Bank Holiday"
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_location ON blocked_dates(location_id, date);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "blocked_dates_anon_read"
  ON blocked_dates FOR SELECT TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: blocked_slots
-- Intra-day recurring time blocks (e.g. lunch break every Thursday).
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS blocked_slots (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  day_of_week  INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
                -- NULL = all days (use all_days = true instead)
  all_days     BOOLEAN DEFAULT false,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  label        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_location
  ON blocked_slots(location_id, day_of_week);

ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "blocked_slots_anon_read"
  ON blocked_slots FOR SELECT TO anon USING (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: enquiries
-- Course/training enquiries submitted via the public site.
-- Admin manages status transitions: new → contacted → enrolled → closed.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS enquiries (
  id          TEXT PRIMARY KEY,             -- UUID string (generated by API)
  name        TEXT NOT NULL,
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  course      TEXT NOT NULL DEFAULT '',     -- Course or treatment enquired about
  message     TEXT DEFAULT '',
  status      TEXT DEFAULT 'New',           -- New | contacted | enrolled | closed
  created_at  BIGINT DEFAULT 0             -- Unix timestamp ms
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "enquiries_anon_insert"
  ON enquiries FOR INSERT TO anon WITH CHECK (true);


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: portal_kv
-- Key-value store backing admin portal settings, custom treatments,
-- availability overrides, media labels, and global admin config.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS portal_kv (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID REFERENCES locations(id) ON DELETE CASCADE,
                -- NULL for global keys (stored under first location alphabetically)
  key          TEXT NOT NULL,               -- See key naming convention in PROJECT_SPEC §4.7
  value        JSONB,                       -- Any JSON value
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (location_id, key)
);

ALTER TABLE portal_kv ENABLE ROW LEVEL SECURITY;
-- portal_kv is admin-only; no anon policies


-- ═══════════════════════════════════════════════════════════════════
-- TABLE: google_calendar_tokens
-- Stores OAuth2 tokens for Google Calendar per location.
-- One row per location. Tokens auto-refresh when within 60s of expiry.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id   UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  calendar_id   TEXT,                       -- Google Calendar ID (often the location's Gmail)
  access_token  TEXT,
  refresh_token TEXT,
  expiry_date   BIGINT,                     -- Unix milliseconds
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
-- admin-only; no anon policies


-- ═══════════════════════════════════════════════════════════════════
-- SEED: Locations
-- NOTE: These INSERT statements use gen_random_uuid() — the IDs will
-- differ from the production [Client] UUIDs. For production migration,
-- use the explicit UUIDs from 09_CLIENT_SPECIFIC_DATA.md.
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO locations (id, slug, name, address)
SELECT gen_random_uuid(), 'hornchurch', '[LOCATION_1]', '[LOCATION_1], Essex RM11'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'hornchurch');

INSERT INTO locations (id, slug, name, address)
SELECT gen_random_uuid(), 'marylebone', '[LOCATION_2]', '[LOCATION_2], London W1G'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'marylebone');


-- ═══════════════════════════════════════════════════════════════════
-- SEED: Default Availability Settings
-- Tue–Sat open; Mon/Sun closed. Matches AVAIL_DEFAULT in BookingModal.tsx.
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  loc RECORD;
BEGIN
  FOR loc IN SELECT id FROM locations LOOP
    INSERT INTO availability_settings (location_id, day_of_week, is_open, start_time, end_time)
    VALUES
      (loc.id, 0, false, null, null),         -- Sun: closed
      (loc.id, 1, false, null, null),         -- Mon: closed
      (loc.id, 2, true, '10:00', '19:00'),    -- Tue
      (loc.id, 3, true, '10:00', '19:00'),    -- Wed
      (loc.id, 4, true, '10:00', '19:00'),    -- Thu
      (loc.id, 5, true, '09:00', '16:00'),    -- Fri
      (loc.id, 6, true, '09:00', '14:00')     -- Sat
    ON CONFLICT (location_id, day_of_week) DO NOTHING;
  END LOOP;
END $$;
