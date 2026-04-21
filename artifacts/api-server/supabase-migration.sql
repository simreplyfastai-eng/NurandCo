-- ═══════════════════════════════════════════════════════════════════
-- STARR AESTHETICS — Supabase Migration
-- Run this ONCE in your Supabase dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════

-- ── 1. Grant PostgREST role access ────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── 1b. Create blocked_slots table (intra-day recurring blocks) ────
CREATE TABLE IF NOT EXISTS blocked_slots (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id  UUID REFERENCES locations(id) ON DELETE CASCADE NOT NULL,
  day_of_week  INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  all_days     BOOLEAN DEFAULT false,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  label        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_slots_location
  ON blocked_slots(location_id, day_of_week);

-- ── 2. Enable RLS on all tables ────────────────────────────────────
ALTER TABLE locations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots         ENABLE ROW LEVEL SECURITY;

-- service_role automatically bypasses RLS in Supabase — no policies needed for it.

-- ── 3. Public-read RLS policies (for customer booking widget) ──────
CREATE POLICY IF NOT EXISTS "locations_anon_read"
  ON locations FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "treatments_anon_read"
  ON treatments FOR SELECT TO anon USING (active = true);

CREATE POLICY IF NOT EXISTS "availability_anon_read"
  ON availability_settings FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "blocked_dates_anon_read"
  ON blocked_dates FOR SELECT TO anon USING (true);

-- Bookings: anon can INSERT (for website bookings) but not SELECT
CREATE POLICY IF NOT EXISTS "bookings_anon_insert"
  ON bookings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "blocked_slots_anon_read"
  ON blocked_slots FOR SELECT TO anon USING (true);

-- ── 4. Seed clinic locations ───────────────────────────────────────
INSERT INTO locations (id, slug, name, address)
SELECT gen_random_uuid(), 'hornchurch', 'Hornchurch', 'Hornchurch, Essex RM11'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'hornchurch');

INSERT INTO locations (id, slug, name, address)
SELECT gen_random_uuid(), 'marylebone', 'Marylebone', 'Marylebone, London W1G'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE slug = 'marylebone');

-- ── 4b. Medical forms table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_forms (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id       TEXT NOT NULL,
  client_email     TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  dob              TEXT,
  address          TEXT,
  gp_name          TEXT,
  gp_practice      TEXT,
  gp_phone         TEXT,
  conditions       JSONB DEFAULT '[]',
  medications      TEXT,
  allergies        TEXT,
  previous_treatments TEXT,
  skin_concerns    TEXT,
  ip_address       TEXT,
  submitted_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_medical_forms_booking ON medical_forms(booking_id);
CREATE INDEX IF NOT EXISTS idx_medical_forms_email   ON medical_forms(client_email);

ALTER TABLE medical_forms ENABLE ROW LEVEL SECURITY;
-- anon INSERT (customer submits); service_role bypasses RLS for admin reads
CREATE POLICY IF NOT EXISTS "medical_forms_anon_insert"
  ON medical_forms FOR INSERT TO anon WITH CHECK (true);

-- ── 4c. Consent forms table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consent_forms (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id       TEXT NOT NULL,
  client_email     TEXT NOT NULL,
  client_name      TEXT NOT NULL,
  treatment        TEXT,
  consents         JSONB DEFAULT '{}',
  additional_notes TEXT,
  signature_data   TEXT,
  ip_address       TEXT,
  signed_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consent_forms_booking ON consent_forms(booking_id);
CREATE INDEX IF NOT EXISTS idx_consent_forms_email   ON consent_forms(client_email);

ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "consent_forms_anon_insert"
  ON consent_forms FOR INSERT TO anon WITH CHECK (true);

-- ── 5. Seed default availability for both locations ────────────────
-- (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
DO $$
DECLARE
  loc RECORD;
BEGIN
  FOR loc IN SELECT id FROM locations LOOP
    INSERT INTO availability_settings (location_id, day_of_week, is_open, start_time, end_time)
    VALUES
      (loc.id, 0, false, null, null),  -- Sun: closed
      (loc.id, 1, false, null, null),  -- Mon: closed
      (loc.id, 2, true, '10:00', '19:00'),  -- Tue
      (loc.id, 3, true, '10:00', '19:00'),  -- Wed
      (loc.id, 4, true, '10:00', '19:00'),  -- Thu
      (loc.id, 5, true, '09:00', '16:00'),  -- Fri
      (loc.id, 6, true, '09:00', '14:00')   -- Sat
    ON CONFLICT (location_id, day_of_week) DO NOTHING;
  END LOOP;
END $$;

-- ── 6. Enquiries table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enquiries (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT NOT NULL DEFAULT '',
  course      TEXT NOT NULL DEFAULT '',
  message     TEXT DEFAULT '',
  status      TEXT DEFAULT 'New',
  created_at  BIGINT DEFAULT 0
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
-- anon can INSERT (website enquiry form); service_role bypasses for admin reads
CREATE POLICY IF NOT EXISTS "enquiries_anon_insert"
  ON enquiries FOR INSERT TO anon WITH CHECK (true);
