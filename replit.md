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
- **Frontend**: React + Vite (Dermadoll website)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/dermadoll run dev` — run frontend locally

## Artifacts

### Dermadoll Aesthetics (`artifacts/dermadoll`)
Single-page luxury aesthetics clinic website (Birmingham & Solihull).
- **Public site**: `/` — hero video, treatments accordion, before/after grid, booking modal
- **Admin portal**: `/portal.html` — hidden admin interface

### API Server (`artifacts/api-server`)
Express 5 REST API on port 8080. All routes prefixed `/api/`.

**Auth routes:**
- `POST /api/auth/login` — JWT login (8h session, returns `token` + `expiresAt`)
- `GET /api/auth/verify` — Validates + refreshes token

**Booking routes:**
- `GET /api/bookings` — All bookings (runs auto-complete first)
- `GET /api/bookings/date/:date` — Active bookings for a date with `durationMinutes`
- `POST /api/bookings` — Create booking (conflict check, duration lookup, admin email)
- `PUT /api/bookings/:id` — Update (sends cancel email if status→Cancelled)
- `DELETE /api/bookings/:id` — Delete
- `DELETE /api/bookings/sample` — Remove seeded test data

**Other routes:**
- `GET /api/availability` — Working hours from portal_kv (day-name keys)
- `POST /api/media/upload-url` — Presigned GCS upload URL
- `GET /api/media/serve?path=` — Serve stored media objects
- `GET /api/cron/autocomplete` — Mark past Confirmed bookings Complete
- `GET /api/cron/reminders` — Send 24h reminder emails (set up as scheduled task)

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

**Unique index**: `bookings_date_time_unique` on `(date, time)` WHERE `status != 'Cancelled' AND time != ''`

### `clients`
id, name, email, phone, join_date, notes, source, created_at

### `portal_kv`
Key-value store for portal settings: `dd_settings`, `dd_availability`, `dd_media`

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
