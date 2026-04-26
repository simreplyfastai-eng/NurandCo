# 08 — Known Issues & Lessons Learned

---

## Critical Lessons (Must Know for Every Build)

### 1. Supabase `time` columns return `HH:MM:SS` — always slice to 5 chars

Supabase returns TIME columns as `"09:30:00"` not `"09:30"`. Any comparison or display of time slots must slice to 5 characters:

```typescript
const displayTime = timeSlot.slice(0, 5);  // "09:30:00" → "09:30"
```

If you forget this, time comparisons will fail silently and slot matching breaks.

**Applied in:** `lib/email.ts`, `googleCalendar.ts`, `BookingModal.tsx`, availability calculations.

---

### 2. `availability_settings` MUST have UNIQUE constraint on `(location_id, day_of_week)`

Without this constraint, duplicate rows are created every time the seed runs, causing the availability editor to show incorrect data and slot calculations to go wrong.

```sql
UNIQUE (location_id, day_of_week)
```

**Lesson:** Always add `ON CONFLICT (location_id, day_of_week) DO NOTHING` to the seed INSERT.

---

### 3. Only `blocked_dates` table exists — NOT `blocked_slots`

Early development referenced a `blocked_slots` table for intra-day blocks. This was added later via migration (`supabase-migration.sql`) but the code in `availability.ts` primarily uses `blocked_dates` for whole-day blocking. If you expect `blocked_slots` to block time ranges, verify the availability engine reads it.

**Current state:** `blocked_slots` table exists in the schema; `blocked_dates` is the battle-tested path.

---

### 4. All protected API calls must use `authHdr()` / `requireAuth()`

Every admin API endpoint must be wrapped with `requireAuth()` middleware (defined in `src/lib/auth.ts`). It reads `Authorization: Bearer <token>` and rejects with 401 if invalid.

In `portal.html`, every admin fetch includes the auth header:
```javascript
headers: { 'Authorization': `Bearer ${localStorage.getItem('dd_token')}` }
```

If you add a new admin route and forget `requireAuth()`, it becomes publicly accessible. Always add it.

---

### 5. Auth token key in localStorage is `dd_token`

The admin portal stores the JWT under `localStorage.getItem('dd_token')`. Some older code comments reference `fbn_token` — this is stale. The actual key used is `dd_token`.

**The portal KV mapping:** Client-side portal uses `fbn_*` key prefixes internally; the API maps these to `dd_*` in Supabase. This is a naming quirk from the project's history — do not mix them up.

---

### 6. `form_tokens` table must be created manually (not in seed)

The treatment seeder (`lib/seed.ts`) creates the `enquiries` table if missing, but does NOT create `form_tokens`. If `form_tokens` doesn't exist, the entire forms system silently fails after Stripe payment.

**Fix for new builds:** Always run the SQL from `05_SUPABASE_SCHEMA.sql` (the `form_tokens` section) in the Supabase SQL editor before going live.

---

### 7. Raw body middleware must be applied BEFORE `express.json()` for Stripe webhooks

Stripe webhook signature verification requires the raw request body. If `express.json()` parses it first, the signature check fails with a cryptic error.

In `app.ts`, the webhook route gets `express.raw({ type: 'application/json' })` applied before the global `express.json()` middleware. Never reorder these.

---

## Bugs Found and Fixed

### BST Auto-Complete Bug

**Bug:** The auto-complete cron was using `Date.UTC()` to compute the current time, which returned UTC midnight instead of the actual current time. This caused appointments to be auto-completed an hour late during BST (British Summer Time — April to October).

**Fix:** Changed to `new Date().getTime()` (wall-clock time), which is correct because `TZ=Europe/London` is set at server startup, so `new Date()` already returns the London wall-clock time.

**Location:** `artifacts/api-server/src/routes/cron.ts` (auto-complete function).

---

### Double-Booking Race Condition (Mitigated)

**Bug risk:** Two customers booking the same slot simultaneously could both pass the availability check.

**Mitigation:** The booking creation endpoint in `bookings.ts` re-checks for conflicts at INSERT time and rejects if a conflicting booking already exists at the same location, date, and overlapping time slot.

**Lesson:** Always check for conflicts server-side at write time, not just at slot calculation time.

---

### Google Calendar Token Expiry Silent Failure

**Bug:** After 7 days in Google OAuth Testing mode, refresh tokens expire. When `refreshAccessToken()` throws, the catch block returns `null`, and `createCalendarEvent()` silently does nothing.

**Lesson:** Always check `GET /api/google/status` after a week to verify calendar is still connected. Eva must re-authorise weekly until the OAuth app is moved to Production mode.

---

### Supabase Eventual Consistency on Form Tokens

**Bug:** Immediately after inserting a `form_token`, the forms endpoint sometimes couldn't find it (Supabase read-after-write lag).

**Fix:** Token validation in `forms.ts` retries 5 times with 1-second delays before returning 404. This is a workaround for Supabase's eventual consistency on the public API.

---

## Known Open Issues (as of April 2026)

### Gap 1 — Medical form: no owner notification
Owner notification (`sendFormsCompletedOwnerEmail()`) is only called on consent form submission. If a client abandons after the medical form only, Eva is not notified.
**Fix:** Add owner notification to the `POST /api/forms/medical` handler in `forms.ts`.

### Gap 2 — Google Calendar: hardcoded 2-hour event duration
`createCalendarEvent()` in `googleCalendar.ts` line 69 uses `+ 2 * 60 * 60 * 1000` regardless of treatment duration. All events appear as 2 hours in Google Calendar.
**Fix:** Pass `booking.duration_minutes` to `createCalendarEvent()` and compute `endISO` from it.

### Gap 3 — Google Calendar: Testing mode (7-day refresh token expiry)
**Fix:** Publish the Google Cloud project's OAuth consent screen to move from Testing to Production.

### Gap 4 — `BUILT_IN_TREATMENTS` vs Supabase `treatments` divergence
`portal.ts` contains a hardcoded `BUILT_IN_TREATMENTS` array for the public catalog endpoint that diverges from the Supabase `treatments` table used in the admin booking flow. The public site may show treatments that aren't bookable, or miss recently added ones.
**Fix:** Unify the catalog to read directly from Supabase `treatments`.

### Gap 5 — Legacy `TREATMENT_PRICES` and `TREATMENT_DURATIONS` fallbacks
`lib/treatments.ts` contains legacy hardcoded fallback arrays. These are never up to date with the Supabase seed data. They exist as a safety net but should not be relied upon.
**Fix:** Remove the fallback arrays and always read from Supabase.

### Gap 6 — `hero.mp4` in `/public/` (unused)
`artifacts/dermadoll/public/hero.mp4` (1.8 MB) still exists but `Hero.tsx` fetches video from `/api/media/config`. The file is dead weight in the deployed build.
**Fix:** Delete `hero.mp4` from `/public/` if confirmed unused.

---

## General Lessons for Future Builds

1. **Always set `TZ=Europe/London` at server startup** — before any module is imported — otherwise `new Date()` reflects the container timezone (UTC), not UK time.

2. **`trust proxy 1` is required** for correct IP-based rate limiting behind Replit's proxy. Without it, all requests share the same IP and rate limits fire immediately.

3. **esbuild bundles everything** — the API server's `build.mjs` produces a single `dist/index.mjs`. After any code change, the build must run before the server restarts. The `dev` script handles this: `build && start`.

4. **Supabase Storage range requests** — video streaming requires the `Content-Range` and `Accept-Ranges` headers. The `/api/media/serve` endpoint handles this. Without range support, videos won't scrub on iOS Safari.

5. **Portal KV key naming** — `fbn_*` in browser localStorage → `dd_*` in Supabase `portal_kv`. The translation happens in the API's `portal.ts`. If you add a new KV key, update both the portal.html read/write logic AND the API translation map.

6. **Location UUIDs are environment-specific** — the Hornchurch/Marylebone UUIDs used in seed.ts and hardcoded in portal.html are specific to the production Supabase project. A new Supabase project generates different UUIDs. Always read UUIDs from the DB via `GET /api/locations` rather than hardcoding.
