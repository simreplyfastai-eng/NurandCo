# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Primary Database**: Supabase (PostgreSQL, via @supabase/supabase-js v2) — ALL routes fully migrated
- **Legacy Database**: PostgreSQL pool — FULLY REMOVED from all routes (no more pool.query anywhere)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite (Starr Aesthetics website)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/dermadoll run dev` — run frontend locally

## Artifacts

### Starr Aesthetics (`artifacts/dermadoll`)
Single-page luxury aesthetics clinic website with admin portal. Founder: **Eva**. Two clinic locations: Hornchurch (Essex RM11) + Marylebone (London W1G). Signature: NaturalèLips™ technique.
- **Design tokens**: Burgundy #5C1A1A · Gold #C9A96E · Cream #F5F0EB. Fonts: Cormorant Garamond (italic headings) + Inter (body). 0 border-radius, outlined buttons only.
- **Brand**: Instagram @starraestheticss · Website www.[CLIENT_NAME]y.co.uk · Email [CLIENT_NAME]yltd@gmail.com
- **Page sections** (in order): Navbar (SERVICES | LOCATIONS | TRAINING + BOOK NOW) → Hero (split cream/photo) → About (Eva founder, 6+ yrs, NL™ stats) → TreatmentMarquee (THE EDIT, dual scrolling rows) → Locations (Hornchurch/Marylebone cards) → Services (accordion with location toggle, per-location pricing) → BeforeAfter (Real Transformations grid) → ResultsVideos (Watch Real Treatments) → Training (Starr Academy, Essex/London masterclasses) → Reviews (6-card grid, CLIENT LOVE) → FAQ (NaturalèLips™ questions) → CTABanner (BOOK HORNCHURCH / BOOK MARYLEBONE) → Footer (Beauty Redefined, clean)
- **Admin portal**: `/portal.html` — Starr Aesthetics rebrand; location selector for Hornchurch / Marylebone; API calls use `fbn_*` keys (mapped to `dd_*` in Supabase portal_kv backend); `X-Location-Id` header passed on all KV/bookings/clients calls

### API Server (`artifacts/api-server`)
Express 5 REST API on port 8080. All routes prefixed `/api/`.

**Auth routes:**
- `POST /api/auth/login` — JWT login (8h session, returns `token` + `expiresAt`)
- `GET /api/auth/verify` — Validates + refreshes token

**Booking routes (JWT-protected unless noted):**
- `GET /api/bookings` — All bookings (runs auto-complete first) [JWT]
- `GET /api/bookings/date/:date` — Active bookings for a date with `durationMinutes` [public]
- `POST /api/bookings` — Create booking (conflict check, duration lookup, admin email) [public]
- `POST /api/bookings/bulk` — Bulk upsert bookings [JWT]
- `PUT /api/bookings/:id` — Update (sends cancel email if status→Cancelled) [JWT]
- `DELETE /api/bookings/:id` — Delete [JWT]
- `DELETE /api/bookings/sample` — Remove seeded test data [JWT]

**Client routes (all JWT-protected):**
- `GET /api/clients` — All clients [JWT]
- `POST /api/clients` — Upsert client by email/phone [JWT]
- `POST /api/clients/bulk` — Bulk upsert [JWT]
- `PUT /api/clients/:id` — Update [JWT]
- `DELETE /api/clients/:id` — Delete [JWT]
- `DELETE /api/clients` — Clear all [JWT]
- `DELETE /api/clients/sample` — Remove test data [JWT]

**Enquiry routes:**
- `GET /api/enquiries` — All training enquiries [JWT]
- `POST /api/enquiries` — Submit training enquiry (rate-limited) [public]
- `PUT /api/enquiries/:id` — Update enquiry status [JWT]

**Finance routes (all JWT-protected, query Supabase bookings with location_id filter):**
- `GET /api/finance/summary?month=YYYY-MM` — Revenue/deposits/balance summary [JWT]
- `GET /api/finance/monthly?month=YYYY-MM` — Daily revenue chart data [JWT]

**Portal store routes (all JWT-protected):**
- `GET /api/portal/store?keys=k1,k2` — Bulk fetch portal settings [JWT]
- `GET /api/portal/store/:key` — Fetch single setting [JWT]
- `PUT /api/portal/store/:key` — Save setting [JWT]

**Location routes (new):**
- `GET /api/locations` — All clinic locations (id, slug, name, address) [public]
- `GET /api/treatments` — Active treatments for a location (X-Location-Id header required) [public]
- `GET /api/treatments/all` — All treatments incl. inactive [JWT]
- `POST /api/treatments` — Create treatment [JWT]
- `PUT /api/treatments/:id` — Update treatment [JWT]

**Availability routes (rewritten — Supabase):**
- `GET /api/availability` — Weekly schedule + blocked dates from Supabase (X-Location-Id or ?locationId) [public]
- `POST /api/availability/settings` — Save weekly schedule to Supabase [JWT]
- `POST /api/availability/block` — Block a date [JWT]
- `DELETE /api/availability/block/:date` — Unblock a date [JWT]

**Other public routes:**
- `GET /api/availability` — Working hours from Supabase (falls back to defaults) [public]
- `POST /api/media/upload-url` — Presigned GCS upload URL
- `GET /api/media/serve?path=` — Serve stored media objects
- `GET /api/cron/autocomplete` — Mark past Confirmed bookings Complete [CRON_SECRET]
- `GET /api/cron/reminders` — Send 24h reminder emails [CRON_SECRET]

**Forms routes (medical + consent capture — post-payment flow):**
- `GET /api/forms/status?booking=[id]` — Returns booking info + hasMedical + hasConsent + medicalOnFileForEmail [public]
- `POST /api/forms/medical` — Save medical questionnaire for a booking [public, GDPR IP logged]
- `POST /api/forms/consent` — Save consent form + base64 signature PNG [public, GDPR IP logged]
- `GET /api/admin/forms/:bookingId` — Full form data for admin drawer [JWT]

**Shared auth middleware:** `artifacts/api-server/src/lib/auth.ts` — `requireAuth()` verifies JWT with admin role. Used by ALL protected routes (bookings, clients, finance, portal, enquiries).

**Security hardening:**
- `helmet` — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.
- CORS whitelist — only production domain + Replit dev domain
- Rate limiting on sensitive POST endpoints (bookings, login, enquiries, payment)
- Stripe webhook requires `STRIPE_WEBHOOK_SECRET` — rejects if not set
- SQL injection protected via parameterized queries throughout
- KV store key allowlist prevents arbitrary data writes
- No fallback secrets — `SESSION_SECRET` must be set or auth returns 500

**Availability defaults (Niamh's schedule):**
Mon: OFF, Tue–Thu: 10:00–19:00, Fri: 09:00–16:00, Sat: 09:00–14:00, Sun: OFF

## Database Schema

### `bookings`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | |
| client_id | text FK→clients | |
| client_name | text | |
| client_email | text | |
| treatment | text | |
| category | text | |
| price | integer | pence |
| deposit | integer | pence |
| deposit_paid | boolean | |
| balance_paid | boolean | |
| date | text | YYYY-MM-DD |
| time | text | HH:MM |
| status | text | Pending/Confirmed/Complete/Cancelled |
| duration_minutes | integer | default 30, looked up from treatments lib |
| reminder_sent | boolean | default false |
| source | text | Website/Portal |
| client_phone | text | Captured from booking form |

**Unique index**: `bookings_date_time_unique` on `(date, time)` WHERE `status != 'Cancelled' AND time != ''`

### `clients`
id, name, email, phone, join_date, notes, source, created_at

### `enquiries`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | Date.now().toString(36) + random suffix |
| name | text | |
| email | text | |
| phone | text | |
| course | text | Training course name |
| message | text | |
| status | text | New / Contacted / Closed |
| created_at | bigint | Unix timestamp ms |

### `portal_kv`
Key-value store for portal settings: `fbn_settings`, `fbn_availability`, `fbn_media` (stored as `dd_media` in Supabase via KV_KEY_MAP).
**`dd_media` structure (new format):** `{ heroVideo, heroImage, aboutImage, galleryImages: string[], resultsVideos: string[] }`
The `/api/media/config` endpoint exposes these fields plus legacy `practitionerImage`, `beforeAfter`, `videos` for backward compatibility.

## Key Libraries

### `artifacts/api-server/src/lib/`
- `treatments.ts` — Full treatment duration map + conflict detection helpers
- `email.ts` — Resend email service (cancel/reminder/admin notifications)
- `objectStorage.ts` — GCS object storage via Replit sidecar
- `objectAcl.ts` — Object ACL policies

## Environment Secrets

- `ADMIN_EMAIL` — Admin login email
- `ADMIN_PASSWORD` — Admin login password
- `SESSION_SECRET` — JWT signing secret
- `DATABASE_URL` — PostgreSQL connection
- `RESEND_API_KEY` — Email sending (resend.com) — **required for emails to work**
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR` — GCS object storage

## Business Logic Notes

- **Treatment durations**: Defined in `lib/treatments.ts`, stored as `duration_minutes` on each booking
- **Slot blocking**: Each booking blocks `duration + 15 min buffer`. Frontend fetches `/api/bookings/date/:date` fresh on every date selection (never cached)
- **Double-booking protection**: Server-side conflict check before INSERT + partial unique DB constraint as last-line-of-defence
- **Auto-complete**: Cron at `/api/cron/autocomplete` and on every `GET /api/bookings`; marks Confirmed bookings past their end time as Complete
- **Session expiry**: 8h inactivity. Portal checks expiry every 60s, refreshes token on verify
- **Timezone**: All date logic uses `Europe/London` (BST-aware). Dates stored as text `YYYY-MM-DD`, times as `HH:MM` local UK time

## GODMODE 10-Bug Fix Pass (April 2026)

All 10 bugs from the MASTER GODMODE spec fixed:

1. **Bug 1 — Book.tsx hardcoded treatments**: TreatmentPicker now fetches live from `/api/treatments?locationId=xxx`. Groups by category, renders duration + price from DB. `treatments.ts` SERVICES array no longer used by booking flow (still used by Services.tsx homepage section).

2. **Bug 2 — Edit treatment broken for Supabase UUIDs**: `openEditTreat` checks `fbn_supabase_treats` cache first by UUID. `saveEditTreatment` calls `PUT /api/treatments/:id` for Supabase treats. `saveNewTreatment` calls `POST /api/treatments` when Supabase treats are active.

3. **Bug 3 — Login/clearSession race**: Added `_loginJustSucceeded` flag. `doLogin` sets it true before calling `showLocationSelector`. `clearSession` returns early if flag is set.

4. **Bug 4 — switchLocation stale module vars**: `switchLocation` now also resets `_SESSION_LOC_ID=''` and `_SESSION_LOC_NAME=''`.

5. **Bug 5 — Portal viewport meta**: Updated to `maximum-scale=1.0,user-scalable=no`.

6. **Bug 6 — New booking treatment blank on edit**: `openBookingModal` edit mode inserts a dynamic `(legacy)` option if the booking's treatment name is not found in the current select options.

7. **Bug 7 — findOrCreateClient location filter**: Added Step 3 cross-location email lookup as fallback. If client found under different/null location_id, updates their location_id to the current one.

8. **Bug 8 — Form icons always same color**: `GET /api/bookings` batch-queries `medical_forms` + `consent_forms` by booking IDs and adds `hasMedical`/`hasConsent` flags. Bookings list now shows dual 📋/✍️ icons using `.has-form` class. Day panel timeline items also show form status icons.

9. **Bug 9 — Medical form 90-day skip rule**: `GET /api/forms/status` now applies 90-day check to `medicalOnFileForEmail` (only true if last submission was within 90 days). Returns `medicalLastSubmitted` ISO date. `forms.html` shows last submission date in the returning client notice.

10. **Bug 10 — Schedule booking opens edit modal**: Day panel now calls `openBookingDetailPanel(id)` instead of `openBookingModal(id)`. New function renders a rich read-only detail panel with all fields: client info, email/phone links, treatment, date/time/duration, location, payment status, form status icons (click to open forms drawer), notes. Has "← Back" and "Edit" buttons.
