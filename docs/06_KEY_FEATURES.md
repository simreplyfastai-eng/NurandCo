# 06 — Key Features

---

## 1. Booking System Flow

**What it does:** Allows customers to book a treatment online, select a date and time slot, and pay a fixed deposit.

**File paths:**
- `artifacts/dermadoll/src/components/BookingModal.tsx` — full booking UI (1165 lines)
- `artifacts/dermadoll/src/pages/Book.tsx` — `/book` page wrapper
- `artifacts/dermadoll/src/lib/nextSlot.ts` — next available slot calculator
- `artifacts/api-server/src/routes/bookings.ts` — POST /api/bookings
- `artifacts/api-server/src/routes/availability.ts` — GET /api/availability
- `artifacts/api-server/src/lib/treatments.ts` — deposit logic helpers

**Step-by-step user flow:**

1. Customer visits `/book` or opens BookingModal from any CTA.
2. **Location select** — customer picks [LOCATION_1] or [LOCATION_2].
3. **Treatment select** — treatments loaded from `GET /api/portal/catalog?locationId=<uuid>` (60s cached).
4. **Date picker** — calendar rendered; closed days (per `availability_settings`) and `blocked_dates` are greyed out.
5. **Time slot picker** — `GET /api/availability?locationId=&date=&duration=` returns free 15-minute slots. Slots already occupied by existing bookings and Google Calendar events are excluded.
6. **Customer details** — name, email, phone fields.
7. **Stripe deposit payment** — `POST /api/stripe/create-payment-intent` creates a PaymentIntent; Stripe Elements mounted in modal; customer pays deposit.
8. On Stripe payment success, browser calls `POST /api/bookings` with `{locationId, treatmentId, date, time, clientDetails, paymentIntentId}`.
9. API creates client record (or upserts by email), creates `bookings` row with `status='pending_payment'`.
10. Stripe webhook `payment_intent.succeeded` fires → status → `awaiting_forms`, forms email auto-sent.
11. Customer is redirected to `/confirmed.html`.

**Quirks / known issues:**
- `BookingModal.tsx` has a hardcoded `AVAIL_DEFAULT` fallback (Tue–Sat) that is used if the API availability fetch fails.
- Time slots use UTC date math (`Date.UTC()`) throughout to avoid local timezone issues.
- Slot picker computes intervals from the treatment's `durationMins` to prevent back-to-back conflicts.

---

## 2. Admin Portal

**What it does:** Full clinic management SPA for Eva. Single-file vanilla JS served at `/portal.html`.

**File paths:**
- `artifacts/dermadoll/public/portal.html` (~6000 lines, vanilla JS SPA)
- `artifacts/api-server/src/routes/auth.ts` — login/verify/change-password
- `artifacts/api-server/src/routes/portal.ts` — KV store CRUD
- `artifacts/api-server/src/lib/auth.ts` — `requireAuth()` middleware

**Step-by-step user flow:**

1. Eva navigates to `https://[CLIENT_NAME]y.co.uk/portal.html`.
2. Login screen: email + password → `POST /api/auth/login` → JWT returned, stored in `localStorage` as `dd_token`.
3. On every page load: `GET /api/auth/verify` validates token; 401 redirects to login.
4. Location dropdown at top — switches active location; all API calls include `X-Location-Id` header.
5. **Dashboard** — upcoming bookings count, today's bookings, revenue summary.
6. **Bookings** — calendar view + list; status badges; manual status changes; resend forms link; internal notes.
7. **Clients** — client list with booking history; search by name/email; edit client details.
8. **Treatments** — toggle active/inactive; add custom treatments; price overrides.
9. **Availability** — per-location working hours editor and blocked date management.
10. **Finance** — monthly revenue chart; summary cards (total, deposits, balance).
11. **Media** — upload images/videos to GCS; gallery management for hero content.
12. **Settings** — location WhatsApp number, address, notification toggles; global admin password change.
13. **Enquiries** — view/manage course enquiries from the public site.
14. **Calendar** — Google Calendar OAuth connect/disconnect per location.

**Quirks:**
- Auth token key in localStorage is `dd_token` (not `fbn_token` as some older comments suggest — verify in portal.html if issues arise).
- All user-supplied data in booking/client tables is wrapped through `escPortal()` for XSS safety.
- Portal KV keys use `fbn_*` internally but are stored as `dd_*` in Supabase.

---

## 3. Google Calendar Two-Way Sync

**What it does:** Creates calendar events for confirmed bookings; reads calendar events to block availability slots in the booking widget.

**File paths:**
- `artifacts/api-server/src/googleCalendar.ts` — ALL Google Calendar logic lives here
- `artifacts/api-server/src/routes/google.ts` — OAuth2 flow endpoints
- `artifacts/api-server/src/routes/availability.ts` — calls `getGoogleCalendarBusyRanges()`

**Key functions:**

| Function | Location | Purpose |
|---|---|---|
| `getOAuthClient()` | `googleCalendar.ts` line 14 | Creates OAuth2 client from env vars |
| `getClientForLocation()` | `googleCalendar.ts` line 22 | Fetches + auto-refreshes token for a location |
| `createCalendarEvent()` | `googleCalendar.ts` line 59 | Creates event after booking confirmed |
| `deleteCalendarEvent()` | `googleCalendar.ts` line 128 | Deletes event on booking cancellation |
| `getGoogleCalendarBusyRanges()` | `googleCalendar.ts` line 167 | **Two-way sync** — reads existing calendar events to block slots |
| `getBusyTimesForDate()` | `googleCalendar.ts` line 210 | Alternative freebusy query (not currently used in availability route) |

**OAuth flow:**
1. Admin clicks "Connect Google Calendar" in portal → `GET /api/google/auth?locationId=<uuid>`.
2. Redirects to Google OAuth consent screen.
3. Callback: `GET /api/google/callback` — exchanges code for tokens, stores in `google_calendar_tokens`.
4. Tokens auto-refresh when within 60 seconds of expiry.

**Two-way sync detail:**
- `getGoogleCalendarBusyRanges(locationId, date)` lists all timed events for the day from the location's calendar.
- Returns `{start, end}` ranges as minutes-since-midnight in `Europe/London`.
- All-day events are skipped (no `dateTime` property).
- Falls back to `[]` on any error so the booking widget always loads.
- Called from `availability.ts` when computing available slots.

**Known issues:**
- Event duration is hardcoded to 2 hours regardless of treatment duration (see `08_KNOWN_ISSUES`).
- OAuth app is in **Testing mode** — refresh tokens expire after 7 days; Eva must re-authorise each week.

---

## 4. Deposit Collection Flow via Stripe

**What it does:** Collects a fixed deposit when a customer books, before confirming the appointment.

**File paths:**
- `artifacts/api-server/src/routes/stripe.ts` — payment intent + webhook
- `artifacts/api-server/src/lib/treatments.ts` — `getDepositAmount()`, `isInjectableTreatment()`
- `artifacts/dermadoll/src/components/BookingModal.tsx` — Stripe Elements UI

**Deposit amounts:**
| Treatment type | Deposit |
|---|---|
| Injectables (contains keywords: filler, lips, rhinoplasty, jaw, cheek, smile line, tear trough, polynucleotides, dissolve, hydration, naturale, hd sculpt, contouring, consultation, refill) | £20 |
| All other treatments | £10 |
| Consultation (explicit `deposit_amount=0` in seed) | £0 |

**Flow:**
1. `POST /api/stripe/create-payment-intent` — body: `{bookingId, amount}` (amount in pence). Rate limited: 5/10min/IP. Returns `{clientSecret}`.
2. BookingModal mounts Stripe Elements with the `clientSecret`.
3. Customer enters card details; Stripe confirms payment client-side.
4. Stripe fires `payment_intent.succeeded` webhook to `POST /api/stripe/webhook`.
5. Webhook verifies signature (`STRIPE_WEBHOOK_SECRET`), reads `bookingId` from PI metadata.
6. Updates booking: `deposit_paid=true`, `status='awaiting_forms'`.
7. Generates `form_token` (32-byte hex, 7-day expiry), inserts into `form_tokens`.
8. Sends forms link email via Resend.
9. Creates Google Calendar event.

**Note:** Raw body middleware (`express.raw()`) is applied to the webhook route before `express.json()` — this is required for Stripe signature verification.

---

## 5. Email Automation Flow via Resend

**What it does:** Sends transactional emails at key booking lifecycle points.

**File paths:**
- `artifacts/api-server/src/lib/email.ts` — ALL email functions (1191 lines)
- `artifacts/api-server/src/routes/cron.ts` — triggers reminder emails
- `artifacts/api-server/src/routes/stripe.ts` — triggers forms link email

**Email functions:**

| Function | When triggered | Recipient |
|---|---|---|
| `sendBookingConfirmationEmail()` | Booking created + paid | Client; includes ICS attachment |
| `sendFormsLinkEmail()` | Stripe webhook success | Client; includes URL to `forms.html?token=<hex>` |
| `sendFormsReminderEmail()` | Cron `forms-reminders` (48h before appt if forms incomplete) | Client |
| `sendReminderEmail()` | Cron `reminders` (23–25h before appt) | Client; includes WhatsApp contact link |
| `sendFormsCompletedOwnerEmail()` | Consent form submitted | Eva (owner); includes booking summary |
| `sendEnquiryEmail()` | Public enquiry submitted | Eva + enquirer |
| `buildICSContent()` | Called by confirmation email | Generates RFC 5545 `.ics` file |
| `buildGoogleCalendarUrl()` | Used in email templates | Generates "Add to Google Calendar" link |

**From address:** `[CLIENT_NAME] <hello@[CLIENT_NAME]y.co.uk>` (must be Resend-verified domain).

**Known gap:** `sendFormsCompletedOwnerEmail()` is only called on consent form submission. If a client submits only the medical form and abandons, Eva receives no notification.

---

## 6. Multi-Location Handling

**What it does:** Strictly isolates [LOCATION_1] and [LOCATION_2] data — a client or booking at one location is completely invisible from the other.

**Enforcement points:**

| Layer | Mechanism |
|---|---|
| Database | `location_id` FK on all core tables (`treatments`, `clients`, `bookings`, `enquiries`, `portal_kv`) |
| API — all admin queries | Filter by `X-Location-Id` header (required for all admin endpoints) |
| API — client update IDOR guard | `PUT /api/clients/:id` reads the stored `location_id` from DB and rejects if it doesn't match the header |
| Treatments seed | 66 rows for [LOCATION_1] UUID, 11 rows for [LOCATION_2] UUID |
| Portal KV | All KV keys stored with a `location_id`; global keys use `__global__` prefix |
| Client dedup | Unique index on `(location_id, LOWER(email))` — same email at different locations = two independent records |
| Finance | Filter by `location_id` when header present; aggregate view when absent |
| Google Calendar | One `google_calendar_tokens` row per `location_id`; booking events go to the correct calendar |

**Location UUIDs (production):**
- [LOCATION_1]: `ccb325d5-6b17-4218-b97d-1a1a0383410a`
- [LOCATION_2]: `5b3d890a-bf6f-4e87-af43-5db0726a46ce`

---

## 7. Medical & Consent Forms System

**What it does:** Sends clients a secure link to complete medical questionnaire and consent form after deposit payment.

**File paths:**
- `artifacts/api-server/src/routes/forms.ts` — token validation + form submission
- `artifacts/dermadoll/public/forms.html` — client-facing forms page (token-gated)

**Flow:**
1. After successful Stripe payment, API generates a 64-char hex token, inserts into `form_tokens` with 7-day expiry.
2. `sendFormsLinkEmail()` sends link: `https://[CLIENT_NAME]y.co.uk/forms.html?token=<hex>`.
3. Client opens link → `GET /api/forms/check?token=<hex>` validates token, returns booking metadata.
4. Client completes **medical questionnaire** → `POST /api/forms/medical` (token in body).
5. Token validated (5 retries × 1s delay for Supabase eventual consistency).
6. Medical data saved to `medical_forms` table.
7. Client completes **consent form** → `POST /api/forms/consent`.
8. Consent data saved to `consent_forms` table.
9. `forms_completed=true`, booking `status → confirmed`.
10. `submitted_at` stamped on token (enforces one-use).
11. `sendFormsCompletedOwnerEmail()` notifies Eva.

**Security:** Tokens are 256-bit random, expire after 7 days, and are single-use. The `form_tokens` table must be created manually before forms will work.

---

## 8. Cron Jobs

**What it does:** Automates routine tasks — auto-completing past bookings, sending reminders, and chasing incomplete forms.

**File paths:**
- `artifacts/api-server/src/routes/cron.ts`

| Endpoint | Frequency (recommended) | What it does |
|---|---|---|
| `GET /api/cron/autocomplete` | Every 30 minutes | Marks `confirmed` bookings past their time as `completed`; cancels stale `pending_payment` bookings (>2 hours old) |
| `GET /api/cron/reminders` | Every hour | Sends 24h appointment reminder to clients with `reminder_sent=false`, `status=confirmed`, appointment in 23–25h window |
| `GET /api/cron/forms-reminders` | Every 6 hours | Sends 48h forms reminder to clients with `forms_completed=false`, appointment within 48h |

**Auth:** All cron endpoints accept either `X-Cron-Secret: <CRON_SECRET>` header or a valid admin Bearer JWT.
