# PROJECT_SPEC.md
## Aesthetix Systems — Master Technical Reference
### [Client Name] / [CLIENT_NAME] Clinic Platform

> **Template reference document** for Aesthetix Systems multi-clinic deployments.
> Supabase project: `[SUPABASE_PROJECT_REF]` · Domain: `[CLIENT_NAME]y.co.uk`
> Last audited: April 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Repository Structure](#2-architecture--repository-structure)
3. [Environment Variables & Secrets](#3-environment-variables--secrets)
4. [Database Schema](#4-database-schema)
5. [API Server — Routes Reference](#5-api-server--routes-reference)
6. [Authentication System](#6-authentication-system)
7. [Booking Lifecycle](#7-booking-lifecycle)
8. [Deposit & Stripe Payment Flow](#8-deposit--stripe-payment-flow)
9. [Forms System (Medical & Consent)](#9-forms-system-medical--consent)
10. [Email System (Resend)](#10-email-system-resend)
11. [Google Calendar Integration](#11-google-calendar-integration)
12. [Cron Jobs](#12-cron-jobs)
13. [Admin Portal (portal.html)](#13-admin-portal-portalhtml)
14. [Public Marketing Site (React/Vite)](#14-public-marketing-site-reactvite)
15. [Security Controls](#15-security-controls)
16. [Location Isolation Rules](#16-location-isolation-rules)
17. [Treatment Catalogue & Deposit Logic](#17-treatment-catalogue--deposit-logic)
18. [Known Gaps & Planned Work](#18-known-gaps--planned-work)

---

## 1. Project Overview

**[Client Name]** (trading as [CLIENT_NAME]) is a two-location aesthetics clinic in the UK.

| Attribute | Value |
|---|---|
| Brand name | [Client Name] / [CLIENT_NAME] |
| Domain | `[CLIENT_NAME]y.co.uk` |
| Locations | [LOCATION_1] (Essex), [LOCATION_2] (London) |
| Operator | Eva (sole proprietor) |
| Palette | Burgundy `#5C1A1A` · Gold `#C9A96E` · Cream `#FAF7F4` |
| Timezone | `Europe/London` (BST/GMT auto-switches) |
| Currency | GBP (£) |
| Deposit rules | Injectables £20 · All other treatments £10 |

The platform comprises:

- **Public marketing site** — React + Vite SPA hosted at `/` (treatments catalogue, booking flow, enquiry form).
- **Admin portal** — Single-file SPA (`portal.html`) served at `/portal.html`; used by Eva to manage bookings, clients, settings, finance, and media.
- **API server** — Express 5 + TypeScript backend serving `/api/*`.
- **Supabase PostgreSQL** — single cloud database; all writes use the `service_role` key (`supabaseAdmin`).
- **Stripe** — deposit payment processing.
- **Resend** — transactional email (booking confirmations, reminders, form links, owner notifications).
- **Google Calendar** — per-location OAuth2 calendar event creation.

---

## 2. Architecture & Repository Structure

```
workspace/                          ← pnpm monorepo root
├── artifacts/
│   ├── dermadoll/                  ← Public marketing site + static admin pages
│   │   ├── src/                    ← React + Vite app (public site)
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   ├── portal.html         ← Admin SPA (~6 000 lines, vanilla JS)
│   │   │   ├── forms.html          ← Medical/consent form page (token-gated)
│   │   │   └── confirmed.html      ← Post-booking confirmation page
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── api-server/                 ← Express 5 API backend
│   │   ├── src/
│   │   │   ├── app.ts              ← Express setup: CORS, Helmet CSP, rate limits
│   │   │   ├── index.ts            ← Server entry point; sets TZ=Europe/London
│   │   │   ├── googleCalendar.ts   ← Google Calendar OAuth2 + event creation
│   │   │   ├── routes/
│   │   │   │   ├── index.ts        ← Router aggregator
│   │   │   │   ├── health.ts       ← GET /api/healthz
│   │   │   │   ├── auth.ts         ← POST /api/auth/login, verify, change-password
│   │   │   │   ├── bookings.ts     ← CRUD + auto-complete + auto-send forms
│   │   │   │   ├── clients.ts      ← CRUD + dedup + IDOR guard
│   │   │   │   ├── availability.ts ← Slot availability engine
│   │   │   │   ├── treatments-route.ts ← GET /api/treatments (Supabase)
│   │   │   │   ├── portal.ts       ← KV store + /api/portal/catalog
│   │   │   │   ├── forms.ts        ← Token-gated medical/consent submission
│   │   │   │   ├── stripe.ts       ← Payment intent + webhook
│   │   │   │   ├── finance.ts      ← Monthly summary + daily chart
│   │   │   │   ├── enquiries.ts    ← Public enquiry form
│   │   │   │   ├── admin.ts        ← Admin-only utility endpoints
│   │   │   │   ├── locations.ts    ← GET /api/locations
│   │   │   │   ├── media.ts        ← GCS media upload/list/delete
│   │   │   │   ├── calendar.ts     ← GET /api/calendar/ics
│   │   │   │   ├── cron.ts         ← Autocomplete, reminders, forms-reminders
│   │   │   │   └── google.ts       ← Google OAuth2 callback for Calendar
│   │   │   └── lib/
│   │   │       ├── supabase.ts     ← supabase (anon) + supabaseAdmin (service_role)
│   │   │       ├── auth.ts         ← requireAuth() middleware helper
│   │   │       ├── seed.ts         ← Treatment seeder (77 rows, runs once)
│   │   │       ├── treatments.ts   ← Deposit helpers, conflict detection, time utils
│   │   │       ├── email.ts        ← All Resend email functions + ICS builder
│   │   │       ├── tz.ts           ← BST/GMT boundary helpers
│   │   │       ├── sanitize.ts     ← XSS escaping helper
│   │   │       └── logger.ts       ← Pino logger
│   │   ├── build.mjs               ← esbuild bundler config
│   │   └── package.json
│   └── mockup-sandbox/             ← Canvas/design preview server (Vite)
├── packages/
│   ├── api-zod/                    ← Shared Zod schemas
│   ├── api-client-react/           ← Typed API client for React
│   └── db/                         ← Drizzle ORM schema
├── pnpm-workspace.yaml
└── PROJECT_SPEC.md                 ← This file
```

### Runtime

| Artifact | Framework | Port | Workflow name |
|---|---|---|---|
| Public site + static pages | Vite 5 + React 18 | `$PORT` | `artifacts/dermadoll: web` |
| API server | Express 5, Node.js ESM, esbuild | `$PORT` | `artifacts/api-server: API Server` |

- API is bundled with `esbuild` to `dist/index.mjs` before start.
- `TZ=Europe/London` is set at server startup (before any module is loaded) so `new Date()` returns UK-local time in logs.
- Express is configured with `trust proxy 1` for correct IP-based rate limiting behind the Replit proxy.

---

## 3. Environment Variables & Secrets

All secrets are stored in Replit Secrets (never in `.env` files committed to the repo).

| Secret | Used by | Purpose |
|---|---|---|
| `SUPABASE_URL` | API server | Supabase project URL |
| `SUPABASE_ANON_KEY` | API server | Supabase anon client (read-only public) |
| `SUPABASE_SERVICE_KEY` | API server | Supabase admin client (all writes) |
| `SESSION_SECRET` | API server | JWT signing secret (HS256) |
| `ADMIN_EMAIL` | API server | Primary admin login email |
| `ADMIN_PASSWORD` | API server | Primary admin password (plaintext or bcrypt hash) |
| `STRIPE_SECRET_KEY` | API server | Stripe server-side key |
| `STRIPE_PUBLISHABLE_KEY` | Public site | Stripe client-side key |
| `STRIPE_WEBHOOK_SECRET` | API server | Stripe webhook signature verification |
| `RESEND_API_KEY` | API server | Resend transactional email |
| `GOOGLE_CLIENT_ID` | API server | Google OAuth2 client ID for Calendar |
| `GOOGLE_CLIENT_SECRET` | API server | Google OAuth2 client secret |
| `GOOGLE_REDIRECT_URI` | API server | OAuth2 redirect URI |
| `CRON_SECRET` | API server | Shared secret for cron endpoints |
| `GCS_BUCKET` | API server | Google Cloud Storage bucket name (media) |
| `GCS_KEY_JSON` | API server | GCS service account key JSON (base64 or raw) |

### Runtime env vars (non-secret)

| Variable | Default | Notes |
|---|---|---|
| `PORT` | assigned by Replit | Each artifact binds to this |
| `NODE_ENV` | `development` | Set to `production` in deployment |
| `REPLIT_DEV_DOMAIN` | set by Replit | Used to dynamically allow CORS in dev |

---

## 4. Database Schema

Supabase (PostgreSQL). All tables use `gen_random_uuid()` for UUIDs. All writes use `supabaseAdmin` (service_role key). RLS is enabled on all tables with a `service_role` bypass policy.

### 4.1 `locations`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | Auto-generated |
| `name` | TEXT | "[LOCATION_1]" / "[LOCATION_2]" |
| `slug` | TEXT UNIQUE | "[location-1-slug]" / "[location-2-slug]" |
| `address` | TEXT | Full postal address |
| `created_at` | TIMESTAMPTZ | Default NOW() |

**Seeded location IDs (production):**
- [LOCATION_1]: `[LOCATION_1_UUID]`
- [LOCATION_2]: `[LOCATION_2_UUID]`

### 4.2 `treatments`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `location_id` | UUID FK → locations | Strict location isolation |
| `name` | TEXT | Treatment name |
| `category` | TEXT | e.g. "Aesthetics", "Lashes & Brows", "Nails" |
| `duration_minutes` | INT | Appointment length |
| `price` | NUMERIC | Full price in £. `0` = POA (display only) |
| `deposit_amount` | NUMERIC | Fixed £20 or £10 |
| `deposit_type` | TEXT | Always `'fixed'` |
| `active` | BOOLEAN | Whether bookable |
| `created_at` | TIMESTAMPTZ | Default NOW() |

**Seeded counts:** 66 [LOCATION_1] + 11 [LOCATION_2] = 77 total.
**Only one price=0 row:** "Fat Dissolving Lemon Bottle" ([LOCATION_1], shown as POA).

Seed runs once on server startup only when the table is completely empty. Re-seed by deleting all treatment rows.

### 4.3 `clients`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `location_id` | UUID FK → locations | Hard location isolation |
| `name` | TEXT | |
| `email` | TEXT | Nullable |
| `phone` | TEXT | Nullable; normalised +44XXXXXXXXXX → 0XXXXXXXXXX |
| `notes` | TEXT | Internal admin notes |
| `created_at` | TIMESTAMPTZ | |

**Dedup index:** `UNIQUE INDEX clients_location_email_unique ON clients(location_id, LOWER(email)) WHERE email IS NOT NULL`

Client creation (`POST /api/clients`) checks for an existing client at the same location by normalised email, and upserts instead of inserting duplicates.

**IDOR guard:** `PUT /api/clients/:id` fetches the existing client's `location_id` and refuses the request if it does not match the `X-Location-Id` header.

### 4.4 `bookings`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `location_id` | UUID FK → locations | |
| `client_id` | UUID FK → clients | Nullable |
| `client_name` | TEXT | Denormalised for quick display |
| `client_email` | TEXT | |
| `client_phone` | TEXT | |
| `treatment` | TEXT | Legacy name column |
| `treatment_name` | TEXT | Canonical treatment name |
| `treatment_id` | UUID FK → treatments | Nullable |
| `booking_date` | DATE | ISO `YYYY-MM-DD` |
| `time_slot` | TIME | `HH:MM:SS` |
| `duration_minutes` | INT | From treatment row |
| `total_amount` | NUMERIC | Full treatment price |
| `deposit_amount` | NUMERIC | Fixed deposit (£20 or £10) |
| `deposit_paid` | BOOLEAN | Set by Stripe webhook |
| `balance_due` | NUMERIC | Computed or stored remainder |
| `status` | TEXT | `pending_payment` → `awaiting_forms` → `confirmed` → `completed` / `cancelled` |
| `payment_intent_id` | TEXT | Stripe PI id |
| `forms_completed` | BOOLEAN | True when both medical + consent submitted |
| `forms_sent` | BOOLEAN | True when forms email was auto-sent |
| `forms_reminder_sent` | BOOLEAN | True after cron reminder sent |
| `reminder_sent` | BOOLEAN | True after 24h appointment reminder sent |
| `google_event_id` | TEXT | Calendar event ID if created |
| `notes` | TEXT | Internal admin notes |
| `created_at` | TIMESTAMPTZ | |

**Booking status flow:**

```
Public booking created
        │
        ▼
pending_payment ──(Stripe webhook: payment_intent.succeeded)──▶ awaiting_forms
        │                                                              │
        │                                           auto-send forms email
        │                                                              │
        │                                           (cron/forms-reminders if not completed)
        │                                                              │
        ▼                                                              ▼
   (admin can                                              forms_completed = true
    override)                                              status → confirmed
        │                                                              │
        ▼                                                              ▼
  confirmed ──(cron/autocomplete after appointment)──▶ completed
  cancelled
```

### 4.5 `form_tokens`

Stores single-use tokens for the forms email link. **Must be created manually via SQL migration** (not auto-created by seed).

```sql
CREATE TABLE IF NOT EXISTS form_tokens (
  token       TEXT PRIMARY KEY,
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS form_tokens_booking_id_idx ON form_tokens(booking_id);
ALTER TABLE form_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "form_tokens_service_all" ON form_tokens FOR ALL TO service_role USING (true);
```

Token is a 32-byte hex string (64 chars), generated with `crypto.randomBytes(32).toString('hex')`. Tokens expire after 7 days. `submitted_at` is set on first submission (token becomes one-use).

### 4.6 `enquiries`

Created by the seed helper if missing. Stores course/treatment enquiries from the public site.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `location_id` | UUID FK → locations | |
| `course_name` | TEXT | |
| `name` / `email` / `phone` | TEXT | Enquirer details |
| `experience_level` | TEXT | |
| `message` | TEXT | |
| `status` | TEXT | `new` / `contacted` / `enrolled` / `closed` |
| `notes` | TEXT | Admin notes |
| `created_at` | TIMESTAMPTZ | |

### 4.7 `portal_kv`

Key-value store backing portal.html settings.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `location_id` | UUID FK → locations | Nullable for global keys |
| `key` | TEXT | |
| `value` | JSONB | Any JSON value |
| `updated_at` | TIMESTAMPTZ | |

**Key naming convention:**

| Client key (portal.html) | DB key | Scope |
|---|---|---|
| `fbn_settings` | `dd_settings` | per-location |
| `fbn_custom_treats` | `dd_custom_treats` | per-location |
| `fbn_custom_cats` | `dd_custom_cats` | per-location |
| `fbn_cat_states` | `dd_cat_states` | per-location |
| `fbn_treatment_overrides` | `dd_treatment_overrides` | per-location |
| `fbn_video_labels` | `dd_video_labels` | per-location |
| `fbn_availability` | `dd_availability` | per-location |
| `fbn_initialized` | `dd_initialized` | per-location |
| `fbn_media` | `dd_media` | per-location |
| `admin_password_override` | `admin_password_override` | per-location (stored under first location) |
| `__global__<key>` | `__global__<key>` | global (stored under first location alphabetically) |

**Global keys** (prefix `__global__`) are stored under the first location by alphabetical name order. Currently used:
- `__global__admin_password_override` — bcrypt-hashed override password
- `__global__portal_extra_admins` — array of `{email, passwordHash}` for additional admin accounts

### 4.8 `google_calendar_tokens`

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `location_id` | UUID FK → locations | One row per location |
| `calendar_id` | TEXT | Google Calendar ID |
| `access_token` | TEXT | |
| `refresh_token` | TEXT | |
| `expiry_date` | BIGINT | Unix ms |
| `updated_at` | TIMESTAMPTZ | |

Tokens refresh automatically at request time if within 60 seconds of expiry. Google OAuth is in **Testing mode** — refresh tokens expire after 7 days unless the app is published.

### 4.9 `media` (GCS-backed, metadata in Supabase)

Media files are stored in Google Cloud Storage. The `media.ts` route handles upload/list/delete. Metadata (file names, labels) may also be stored in `portal_kv` under `dd_media`.

---

## 5. API Server — Routes Reference

Base path: `/api`

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/healthz` | None | Returns `{"status":"ok"}` |

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Email + password → JWT |
| GET | `/auth/verify` | Bearer JWT | Validates token, returns refreshed JWT |
| POST | `/auth/change-password` | Bearer JWT | bcrypt-hashes new password, stores in `portal_kv` |

### Locations

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/locations` | None | Returns all locations (id, slug, name, address) |

### Treatments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/treatments` | None | Treatments from Supabase, filterable by `locationId` |
| POST | `/treatments` | Admin JWT | Create treatment |
| PUT | `/treatments/:id` | Admin JWT | Update treatment |
| DELETE | `/treatments/:id` | Admin JWT | Soft/hard delete treatment |

### Availability

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/availability` | None | Available time slots for a date + location + duration |

Slots are computed in 15-minute intervals. Back-to-back appointments allowed (no buffer). Blocked slots are derived from confirmed/awaiting_forms/pending bookings on that date at that location.

### Bookings

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/bookings` | Admin JWT | List bookings (filterable by date, location, status) |
| POST | `/bookings` | None (rate limited) | Create booking; triggers deposit Stripe PI |
| GET | `/bookings/:id` | Admin JWT | Get single booking |
| PUT | `/bookings/:id` | Admin JWT | Update booking |
| DELETE | `/bookings/:id` | Admin JWT | Cancel/delete booking |
| POST | `/bookings/:id/send-forms` | Admin JWT | Manually resend forms email |

**Auto-send forms:** on `POST /bookings`, if `deposit_paid` is already true (or no deposit required), the server immediately generates a `form_token`, inserts it, and sends the forms email.

### Clients

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/clients` | Admin JWT | List clients (location-isolated) |
| POST | `/clients` | Admin JWT | Create or upsert client (email dedup) |
| GET | `/clients/:id` | Admin JWT | Get client + booking history |
| PUT | `/clients/:id` | Admin JWT | Update (IDOR-guarded by location_id) |
| DELETE | `/clients/:id` | Admin JWT | Delete client |

### Forms

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/forms/check?token=` | None | Validate token, return booking metadata |
| POST | `/forms/medical` | None (token in body) | Submit medical questionnaire |
| POST | `/forms/consent` | None (token in body) | Submit consent form; notifies Eva |

Token validation: 5 retry attempts with 1s delay (Supabase eventual consistency). Checks `expires_at > now()` and `submitted_at IS NULL`. On first valid submission, `submitted_at` is set immediately (one-use token).

### Stripe

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/stripe/create-payment-intent` | None (rate limited) | Creates Stripe PI for deposit amount |
| POST | `/stripe/webhook` | Stripe signature | Handles `payment_intent.succeeded` |

Webhook: on success, sets `deposit_paid=true`, `status='awaiting_forms'`, triggers forms email (generates token, inserts into `form_tokens`, sends via Resend).

### Finance

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/finance/summary?month=YYYY-MM` | Admin JWT | Total revenue, deposits, balance, booking count |
| GET | `/finance/monthly?month=YYYY-MM` | Admin JWT | Day-by-day revenue + cumulative chart data |

Both endpoints accept `X-Location-Id` header or `locationId` query param for per-location filtering.

### Enquiries

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/enquiries` | Admin JWT | List enquiries (location-filtered) |
| POST | `/enquiries` | None (rate limited) | Submit public enquiry |
| PUT | `/enquiries/:id` | Admin JWT | Update status/notes |

### Portal KV

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/portal/catalog` | None | Public treatment categories (built-in + custom overrides) |
| GET | `/portal/store?keys=` | Admin JWT | Batch read KV keys |
| GET | `/portal/store/:key` | Admin JWT | Read single KV key |
| PUT | `/portal/store/:key` | Admin JWT | Write KV key |

Catalog endpoint caches per-location for 60 seconds in memory. Cache is busted on treatment-related KV writes.

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/stats` | Admin JWT | Dashboard statistics |
| Various | `/admin/*` | Admin JWT | Admin utility endpoints |

### Media

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/media` | Admin JWT | List media files |
| POST | `/media/upload` | Admin JWT | Upload to GCS (multer) |
| DELETE | `/media/:filename` | Admin JWT | Delete from GCS |

### Calendar

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/calendar/ics?booking=<uuid>` | None | Download ICS file for booking |

### Cron

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/cron/autocomplete` | Cron secret or admin JWT | Auto-complete past confirmed bookings |
| GET | `/cron/reminders` | Cron secret or admin JWT | Send 24h appointment reminders |
| GET | `/cron/forms-reminders` | Cron secret or admin JWT | Send 48h forms completion reminders |

Cron auth: accepts `X-Cron-Secret: <CRON_SECRET>` header **or** a valid admin Bearer JWT.

### Google

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/google/auth` | Admin JWT | Redirect to Google OAuth consent |
| GET | `/google/callback` | OAuth state | Handle OAuth callback, store tokens |
| GET | `/google/status` | Admin JWT | Check Calendar connection status per location |
| DELETE | `/google/disconnect` | Admin JWT | Remove Calendar tokens for location |

---

## 6. Authentication System

### Admin login

1. `POST /api/auth/login` with `{email, password}`
2. Email is compared against `ADMIN_EMAIL` env var (case-insensitive).
3. Password resolution order:
   - DB override (`portal_kv` key `__global__admin_password_override`) checked first.
   - Falls back to `ADMIN_PASSWORD` env var (plaintext or bcrypt `$2*` hash).
   - **Lockout prevention:** if the DB override fails, the env var password is always tried as a fallback — the account owner can never be permanently locked out.
4. Returns `{token, expiresAt}`. JWT signed with `SESSION_SECRET`, 8-hour expiry.
5. Extra admin accounts stored in `__global__portal_extra_admins` (array of `{email, passwordHash}`).

### JWT structure

```json
{ "role": "admin", "expiresAt": <unix_ms> }
```

Signed with HS256, `SESSION_HOURS=8` (env-configurable).

### `requireAuth()` middleware

Located in `lib/auth.ts`. Reads `Authorization: Bearer <token>` header, verifies with `SESSION_SECRET`, checks `role === "admin"`. Returns 401 on failure.

### Password change

`POST /api/auth/change-password` requires a valid JWT. Verifies current password (same fallback chain as login), bcrypt-hashes new password with 12 rounds, stores as `__global__admin_password_override` in `portal_kv`.

---

## 7. Booking Lifecycle

### Public booking creation (`POST /api/bookings`)

1. Validate request body (treatment, date, time, client details, locationId).
2. Check for double-booking conflicts at the requested time slot.
3. Look up or create client record (email dedup within location).
4. Create `bookings` row with `status='pending_payment'`.
5. Compute deposit amount (see §17).
6. Create Stripe Payment Intent for deposit amount.
7. Return `{bookingId, clientSecret, depositAmount}` to the browser.
8. Browser renders Stripe Elements; client pays.
9. Stripe webhook fires → see §8.

### Auto-complete cron (`GET /api/cron/autocomplete`)

Finds all `confirmed` bookings where `booking_date + time_slot < now()` and updates them to `completed`. Also handles bookings in `pending_payment` status older than 2 hours (cancels them).

### Manual status management

Admin can override any booking status from the portal. Common transitions: `pending_payment → confirmed` (waive deposit), `confirmed → cancelled`.

---

## 8. Deposit & Stripe Payment Flow

### Deposit amounts

| Treatment type | Deposit |
|---|---|
| Injectables (see §17 for keyword list) | £20 |
| All other treatments | £10 |
| Consultation (deposit_amount=0 in seed) | £0 |

Deposit amount is always read from the `treatments.deposit_amount` column when available. If not in Supabase, `getDepositAmount()` in `lib/treatments.ts` uses the injectable keyword heuristic.

### Payment Intent creation

`POST /api/stripe/create-payment-intent`
- Body: `{bookingId, amount}` (amount in pence)
- Rate limited: 5 per 10 minutes per IP
- Returns `{clientSecret}`
- Stripe PI metadata includes `bookingId`

### Webhook (`POST /api/stripe/webhook`)

- Verified with `STRIPE_WEBHOOK_SECRET` using `stripe.webhooks.constructEvent()`.
- Raw body required (configured before `express.json()` middleware).
- On `payment_intent.succeeded`:
  1. Reads `bookingId` from PI metadata.
  2. Updates `bookings` row: `deposit_paid=true`, `status='awaiting_forms'`.
  3. Generates `form_token` (32-byte hex, 7-day expiry).
  4. Inserts token into `form_tokens`.
  5. Sends forms link email via Resend.
  6. Creates Google Calendar event for the location.

---

## 9. Forms System (Medical & Consent)

### Flow

1. Client receives email with link: `https://[CLIENT_NAME]y.co.uk/forms.html?token=<hex>`
2. `GET /api/forms/check?token=<hex>` — validates token, returns booking metadata (client name, treatment, date, time, location).
3. Client completes **medical questionnaire** first: `POST /api/forms/medical`
   - Body: `{token, ...medicalFields}`
   - Token validated (5 retries × 1s).
   - Medical data saved to booking (or a `booking_forms` table).
   - `forms_completed` updated.
   - **Note:** owner notification email is NOT sent on medical-only submit (known gap — see §18).
4. Client completes **consent form**: `POST /api/forms/consent`
   - Token validated.
   - Consent data saved.
   - `forms_completed = true`, booking `status → confirmed`.
   - `sendFormsCompletedOwnerEmail()` called → notifies Eva.
   - Token `submitted_at` stamped (one-use enforced).

### Token security

- 64-character hex string (256-bit entropy).
- Expires after 7 days.
- One-use: `submitted_at` is set on first successful submission; subsequent attempts rejected.
- `form_tokens` table must exist (SQL migration provided in §4.5).

### Forms reminder cron

`GET /api/cron/forms-reminders`: finds bookings with `forms_completed=false`, `status IN ('awaiting_forms','confirmed')`, `booking_date` within 48 hours, `forms_reminder_sent=false`. Sends reminder email and marks `forms_reminder_sent=true`.

---

## 10. Email System (Resend)

All emails sent via the `resend` npm package. Sender address configured in `lib/email.ts` (typically `no-reply@[CLIENT_NAME]y.co.uk` or a Resend verified domain).

### Email functions in `lib/email.ts`

| Function | Trigger | Recipient |
|---|---|---|
| `sendBookingConfirmationEmail()` | Booking created + paid | Client |
| `sendFormsLinkEmail()` | Stripe webhook: payment succeeded | Client |
| `sendFormsReminderEmail()` | Cron: forms-reminders | Client |
| `sendReminderEmail()` | Cron: reminders (24h before) | Client |
| `sendFormsCompletedOwnerEmail()` | Consent form submitted | Eva (owner) |
| `sendEnquiryEmail()` | Public enquiry submitted | Eva + enquirer |
| `buildICSContent()` | Called to generate `.ics` attachment | — |

### ICS calendar attachment

`buildICSContent(booking, location)` returns RFC 5545 compliant ICS content. Attached to booking confirmation emails. Also served at `GET /api/calendar/ics?booking=<uuid>`.

### Reminder email (24h)

Includes appointment date, time, treatment name, and the clinic WhatsApp number read from `dd_settings.whatsapp` in `portal_kv` for the booking's location.

---

## 11. Google Calendar Integration

### OAuth2 flow

1. Admin clicks "Connect Google Calendar" in portal for a location.
2. `GET /api/google/auth?locationId=<uuid>` redirects to Google consent screen.
3. User grants calendar access.
4. Google redirects to `GOOGLE_REDIRECT_URI` → `GET /api/google/callback`.
5. Callback exchanges code for tokens, stores in `google_calendar_tokens` for the location.

### Event creation

`createCalendarEvent(locationId, bookingData)` in `googleCalendar.ts`:
- Fetches token for location; auto-refreshes if within 60s of expiry.
- Creates event with:
  - Summary: `<ClientName> — <Treatment> @ <ClinicName>`
  - Description: client contact + treatment details + address
  - Duration: 2 hours (hardcoded default; treatment duration not passed through)
  - Location: clinic address from `locations.address`

### Token refresh

On access token expiry, `oauth2Client.refreshAccessToken()` is called and the new token is written back to `google_calendar_tokens`. If refresh fails (e.g., token expired after 7-day Testing mode limit), function returns `null` and no event is created (silent failure).

---

## 12. Cron Jobs

All cron endpoints are under `GET /api/cron/*` and require either `X-Cron-Secret` header or a valid admin JWT.

### `/api/cron/autocomplete`

- Calls `runAutoComplete()` from `bookings.ts`.
- Marks `confirmed` bookings past their scheduled time as `completed`.
- Cancels stale `pending_payment` bookings (>2 hours old).

### `/api/cron/reminders`

- Time window: bookings with `booking_date+time_slot` in **23–25 hours** from now.
- Filter: `status='confirmed'`, `reminder_sent=false`, `client_email` not null.
- Sends `sendReminderEmail()` with WhatsApp number from `dd_settings` for the booking's location.
- Marks `reminder_sent=true` after sending.

### `/api/cron/forms-reminders`

- Time window: bookings with `booking_date` from today to **+48 hours**.
- Filter: `forms_completed=false`, `status IN ('awaiting_forms','confirmed')`, `forms_reminder_sent=false`.
- Sends `sendFormsReminderEmail()` with booking details + location name/address.
- Marks `forms_reminder_sent=true` after sending.

### Recommended schedule (external cron service)

| Job | Frequency | Header |
|---|---|---|
| `/api/cron/autocomplete` | Every 30 minutes | `X-Cron-Secret: <value>` |
| `/api/cron/reminders` | Every hour | `X-Cron-Secret: <value>` |
| `/api/cron/forms-reminders` | Every 6 hours | `X-Cron-Secret: <value>` |

---

## 13. Admin Portal (`portal.html`)

A single-file vanilla JavaScript SPA (~6 000 lines) served as a static file from `artifacts/dermadoll/public/portal.html`. Accessible at `https://[CLIENT_NAME]y.co.uk/portal.html`.

### Sections / tabs

| Section | Key features |
|---|---|
| Dashboard | Upcoming bookings count, today's bookings, revenue summary |
| Bookings | Calendar view + list; status badges; manual status changes; resend forms; notes |
| Clients | Client list with booking history; search; edit |
| Treatments | View/toggle active treatments; add custom treatments; price overrides |
| Availability | Per-location working hours and blocked slots editor |
| Finance | Monthly revenue chart (Recharts-style inline SVG); summary cards |
| Media | Image/video upload to GCS; gallery management |
| Settings | Location settings (WhatsApp, address, notifications); global admin password change |
| Enquiries | View/manage course enquiries |
| Calendar | Google Calendar OAuth connect/disconnect per location |

### Authentication

Login screen with email + password fields. JWT stored in `localStorage` under key `dd_token`. On page load, `GET /api/auth/verify` called; on 401, redirects to login screen. Token refreshed on every verify call.

### KV key mapping

Portal uses `fbn_*` keys internally; the API translates to `dd_*` for Supabase storage. See §4.7 for full mapping table.

### XSS protection

All user-supplied data rendered into booking/client tables is wrapped through `escPortal(value)` — an inline HTML escaping helper that replaces `&`, `<`, `>`, `"`, `'` with HTML entities.

### Location selector

A dropdown at the top of the portal switches the active location. All API calls include `X-Location-Id: <uuid>` header set to the selected location. Data is strictly isolated per location.

---

## 14. Public Marketing Site (React/Vite)

Located in `artifacts/dermadoll/src/`. Built with Vite 5 + React 18.

### Key dependencies

| Package | Purpose |
|---|---|
| `wouter` ^3.3.5 | Client-side routing |
| `@tanstack/react-query` | API data fetching + caching |
| `tailwindcss` | Styling (custom palette configured) |
| `@radix-ui/*` | Accessible UI primitives |
| `framer-motion` | Animations |
| `@stripe/stripe-js` ^9 | Stripe Elements for deposit payment |
| `react-hook-form` + `zod` | Form validation |
| `recharts` | Finance charts |
| `date-fns` | Date formatting |
| `sonner` | Toast notifications |
| `lucide-react` | Icons |

### Pages / routing

| Route | Component | Notes |
|---|---|---|
| `/` | Home | Hero, treatment categories, booking CTA |
| `/book` | Booking flow | Treatment picker → slot picker → Stripe deposit |
| `/treatments` | Treatments | Pulled from `/api/portal/catalog` |
| `/enquire` | Enquiry form | Sends to `/api/enquiries` |
| `/confirmed` | Booking confirmed | Post-payment success page |

### Static pages (not part of React SPA)

| File | Path | Purpose |
|---|---|---|
| `portal.html` | `/portal.html` | Admin SPA |
| `forms.html` | `/forms.html` | Medical/consent forms (token-gated) |
| `confirmed.html` | `/confirmed.html` | Booking confirmation page |

### API client

`@workspace/api-client-react` provides typed hooks wrapping `@tanstack/react-query`. Base URL is `import.meta.env.VITE_API_URL` (defaults to relative `/api` for same-origin dev and production).

---

## 15. Security Controls

### Rate limiting (per IP, via `express-rate-limit`)

| Endpoint | Limit | Window |
|---|---|---|
| All `/api/*` | 200 requests | 1 minute |
| `POST /api/auth/login` | 10 attempts | 15 minutes |
| `POST /api/auth/change-password` | 10 attempts | 15 minutes |
| `POST /api/bookings` | 5 requests | 1 hour |
| `POST /api/enquiries` | 5 requests | 1 minute |
| `POST /api/stripe/create-payment-intent` | 5 requests | 10 minutes |
| `POST /api/forms/medical` | 10 requests | 1 minute |
| `POST /api/forms/consent` | 10 requests | 1 minute |

`trust proxy 1` is set so real client IPs are used (not the Replit proxy IP).

### Content Security Policy (Helmet)

```
default-src 'self'
script-src 'self' https://js.stripe.com
frame-src 'self' https://js.stripe.com https://hooks.stripe.com
connect-src 'self' https://api.stripe.com
img-src 'self' data: https:
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
object-src 'none'
upgrade-insecure-requests
```

### CORS

Allowed origins:
- `https://[CLIENT_NAME]y.co.uk`
- `https://www.[CLIENT_NAME]y.co.uk`
- `http://localhost:3000`
- `http://localhost:5173`
- Replit dev domain (dynamic regex, development only)

### Authentication guards

- All admin endpoints require `requireAuth()` middleware (JWT validation).
- IDOR guard on `PUT /api/clients/:id`: fetches client's `location_id` from DB and rejects if different from request header.
- Form tokens are cryptographically random, one-use, and time-limited.

### XSS

- `escPortal()` wraps all user-supplied values rendered in portal.html booking/client tables.
- `lib/sanitize.ts` provides a `sanitize()` helper for server-side sanitisation of HTML input fields.

### Stripe webhook security

- `express.raw()` middleware applied to `/api/stripe/webhook` before `express.json()`.
- Signature verified with `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`.

### BST/auto-complete bug fix

- The auto-complete cron previously used `Date.UTC()` which ignored BST, causing appointments to auto-complete an hour late in summer.
- Fixed: uses `new Date().getTime()` (wall-clock UTC, correct for comparison against stored UTC timestamps).

---

## 16. Location Isolation Rules

**Critical design constraint:** [LOCATION_1] and [LOCATION_2] are completely isolated. A user or booking at one location must never appear in the other location's views.

Enforcement points:

1. **`location_id` column on all core tables** (`treatments`, `clients`, `bookings`, `enquiries`, `portal_kv`).
2. **Every admin API query** filters by `X-Location-Id` header (required for all admin endpoints).
3. **`PUT /api/clients/:id` IDOR guard** — server reads the client's actual `location_id` from the DB and rejects the update if it does not match the header.
4. **Treatments seed** — 66 rows for [LOCATION_1] UUID, 11 rows for [LOCATION_2] UUID; no cross-location rows.
5. **Portal KV** — all KV keys stored with a `location_id`; global keys use the `__global__` prefix convention.
6. **Client dedup** — unique index on `(location_id, LOWER(email))` — same client email at different locations creates two independent client records.
7. **Finance endpoints** — filter by `location_id` when header present; return cross-location data only if header absent (admin aggregate view).
8. **Google Calendar tokens** — one row per `location_id`; booking events go to the correct location's calendar.

---

## 17. Treatment Catalogue & Deposit Logic

### Supabase treatments (admin booking flow)

Loaded via `GET /api/treatments?locationId=<uuid>`. Used in portal.html treatment picker and public booking flow. Source of truth for deposit amounts.

### Portal catalog (public website)

`GET /api/portal/catalog?locationId=<uuid>` builds a category view from:
1. `BUILT_IN_TREATMENTS` — hardcoded array in `portal.ts` (legacy list, different from Supabase treatments)
2. Custom treatments from `dd_custom_treats` KV key
3. Price/duration overrides from `dd_treatment_overrides` KV key

**Note:** `BUILT_IN_TREATMENTS` in `portal.ts` is a separate list from the Supabase `treatments` table. The Supabase table is the canonical source for admin-portal bookings; the KV catalog is for the public marketing site display.

### Injectable keyword detection (`lib/treatments.ts`)

```typescript
const INJECTABLE_KEYWORDS = [
  'filler', 'lips', 'rhinoplasty', 'jaw', 'cheek', 'smile line',
  'tear trough', 'polynucleotides', 'dissolve', 'hydration',
  'naturale', 'hd sculpt', 'contouring', 'consultation', 'refill',
];

export function isInjectableTreatment(treatmentName: string): boolean {
  const lower = treatmentName.toLowerCase();
  return INJECTABLE_KEYWORDS.some(kw => lower.includes(kw));
}
```

### Deposit calculation

```typescript
export function getDepositAmount(
  treatmentName: string,
  settings: { depositInjectables?: number; depositOther?: number },
): number {
  return isInjectableTreatment(treatmentName)
    ? (settings.depositInjectables ?? 20)
    : (settings.depositOther ?? 10);
}
```

`settings` comes from `dd_settings` KV value for the location; defaults are £20/£10.

### Full treatment list ([LOCATION_1] — 66 treatments)

| Category | Count | Deposit |
|---|---|---|
| Aesthetics (fillers, SPMU, skin boosters) | 26 | £20 |
| Aesthetics (anti-wrinkle) | 3 | £10 |
| Aesthetics (consultation) | 1 | £0 |
| Aesthetics (Fat Dissolving, POA) | 1 | £10 |
| Lashes & Brows | 15 | £10 |
| Facials | 3 | £10 |
| Nails | 11 | £10 |
| SPMU | 2 | £20 |
| Skin Boosters | 6 | £20 |

**Full treatment list ([LOCATION_2] — 11 treatments):** 10 Aesthetics + 1 Lashes & Brows.

---

## 18. Known Gaps & Planned Work

### Gap 1 — Medical form: no owner notification

**Current behaviour:** `sendFormsCompletedOwnerEmail()` is called only when the **consent form** is submitted (`POST /api/forms/consent`, line ~525 of `forms.ts`). If a client submits only the medical questionnaire (e.g., abandons consent), Eva receives no notification.

**Expected behaviour:** Eva should be notified on medical-form submission as well (or at minimum, medical + consent together should trigger one consolidated notification).

**Fix:** Add `sendFormsCompletedOwnerEmail()` call (or a separate `sendMedicalFormOwnerEmail()`) in the `POST /api/forms/medical` handler.

### Gap 2 — `form_tokens` table must be created manually

The `form_tokens` table is not created by the seed helper (the seed only creates `enquiries` and checks column existence). It must be created in the Supabase SQL editor using the migration in §4.5 before the forms system will function.

### Gap 3 — Google Calendar: hardcoded 2-hour event duration

`createCalendarEvent()` uses a hardcoded `+2 * 60 * 60 * 1000` end time instead of the booking's `duration_minutes`. Treatment durations range from 15 min to 150 min; all calendar events incorrectly appear as 2 hours.

**Fix:** Pass `booking.duration_minutes` through to `createCalendarEvent()` and use it to compute `endISO`.

### Gap 4 — Google Calendar: Testing mode token expiry

Google OAuth app is in **Testing** mode → refresh tokens expire after 7 days. When a token expires, calendar event creation silently fails (returns `null`). Eva must re-authorise every 7 days.

**Fix:** Publish the Google Cloud project's OAuth consent screen to move from Testing to Production mode.

### Gap 5 — `BUILT_IN_TREATMENTS` vs Supabase treatments divergence

`portal.ts` contains a hardcoded `BUILT_IN_TREATMENTS` array (used for the public catalog endpoint) that does not match the Supabase `treatments` table (used for admin booking). These two lists have different treatment names, prices, and categories. The public catalog does not reflect actual bookable treatments.

**Fix:** Either unify the catalog to read from Supabase treatments, or document which list each surface uses and keep them in sync.

### Gap 6 — `lib/treatments.ts` TREATMENT_PRICES divergence

`TREATMENT_PRICES` and `TREATMENT_DURATIONS` in `lib/treatments.ts` are legacy fallback lists that do not match either the Supabase seed data or `BUILT_IN_TREATMENTS`. These are only used as a last resort fallback in `getTreatmentPrice()`.

---

## Appendix A — Supabase Connection Setup

```typescript
// lib/supabase.ts
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
```

`resolveLocationId(slugOrId)` accepts either a UUID or a slug string (e.g., `"[location-1-slug]"`) and returns the UUID. Used by availability and treatment endpoints.

## Appendix B — Timezone Handling

- Server process TZ set to `Europe/London` at startup.
- `lib/tz.ts` provides BST/GMT boundary helpers.
- All `booking_date` values stored as `DATE` (no time component).
- `time_slot` stored as `TIME` (UTC representation; display in UK time requires BST offset in UI).
- Cron reminder window calculation uses `new Date().getTime()` (wall-clock UTC) — correct for comparing against booking timestamps.
- The BST auto-complete bug (was using `Date.UTC()`) has been fixed.

## Appendix C — esbuild Bundle Config

`artifacts/api-server/build.mjs` bundles `src/index.ts` → `dist/index.mjs` as ESM with:
- `platform: 'node'`
- `esbuild-plugin-pino` for Pino transport compatibility
- Source maps enabled (`--enable-source-maps` at runtime)
- External: none significant (all deps bundled except native addons)

## Appendix D — Deployment Checklist

Before deploying to production:

- [ ] `form_tokens` table created in Supabase (§4.5 SQL migration)
- [ ] `STRIPE_WEBHOOK_SECRET` set to the production webhook endpoint secret
- [ ] `GOOGLE_REDIRECT_URI` points to production domain
- [ ] `SESSION_SECRET` set to a long random string
- [ ] `CRON_SECRET` set; external cron service configured
- [ ] Resend sender domain verified for `[CLIENT_NAME]y.co.uk`
- [ ] Google OAuth consent screen published (to avoid 7-day token expiry)
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` set to production values
- [ ] GCS bucket permissions configured for the service account
- [ ] CORS `allowedOrigins` in `app.ts` includes production domain (already set)
