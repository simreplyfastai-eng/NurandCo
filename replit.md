# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL (raw pool queries, no ORM)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite (Face By Niamh website)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/dermadoll run dev` — run frontend locally

## Artifacts

### Face By Niamh Aesthetics (`artifacts/dermadoll`)
Single-page luxury aesthetics clinic website (Leeds & Wakefield).
- **Public site**: `/` — hero video, treatments accordion, before/after grid, booking modal
- **Admin portal**: `/portal.html` — hidden admin interface

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

**Finance routes (all JWT-protected, always query PostgreSQL directly):**
- `GET /api/finance/summary?month=YYYY-MM` — Revenue/deposits/balance summary [JWT]
- `GET /api/finance/monthly?month=YYYY-MM` — Daily revenue chart data [JWT]

**Portal store routes (all JWT-protected):**
- `GET /api/portal/store?keys=k1,k2` — Bulk fetch portal settings [JWT]
- `GET /api/portal/store/:key` — Fetch single setting [JWT]
- `PUT /api/portal/store/:key` — Save setting [JWT]

**Other public routes:**
- `GET /api/availability` — Working hours from portal_kv (day-name keys) [public]
- `POST /api/media/upload-url` — Presigned GCS upload URL
- `GET /api/media/serve?path=` — Serve stored media objects
- `GET /api/cron/autocomplete` — Mark past Confirmed bookings Complete [CRON_SECRET]
- `GET /api/cron/reminders` — Send 24h reminder emails [CRON_SECRET]

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
Key-value store for portal settings: `fbn_settings`, `fbn_availability`, `fbn_media`

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
