# 04 — Environment Variables

All secrets are stored in **Replit Secrets** — never in `.env` files committed to the repository.

---

## Secrets (sensitive — stored in Replit Secrets vault)

| Variable | Service | What it does | Scope |
|---|---|---|---|
| `SUPABASE_URL` | Supabase | Project URL (e.g. `https://xxxx.supabase.co`) | [CLIENT-SPECIFIC] |
| `SUPABASE_ANON_KEY` | Supabase | Anon/public key — used for public reads (treatments, locations) | [CLIENT-SPECIFIC] |
| `SUPABASE_SERVICE_KEY` | Supabase | Service role key — used for all DB writes; bypasses RLS | [CLIENT-SPECIFIC] |
| `SESSION_SECRET` | API auth | JWT signing secret (HS256); must be a long random string | [CLIENT-SPECIFIC] |
| `ADMIN_EMAIL` | API auth | Primary admin login email | [CLIENT-SPECIFIC] |
| `ADMIN_PASSWORD` | API auth | Primary admin password (plaintext or bcrypt `$2*` hash) | [CLIENT-SPECIFIC] |
| `STRIPE_SECRET_KEY` | Stripe | Server-side Stripe key (`sk_live_*` or `sk_test_*`) | [CLIENT-SPECIFIC] |
| `STRIPE_PUBLISHABLE_KEY` | Stripe | Client-side Stripe key (`pk_live_*` or `pk_test_*`) — injected into frontend at build time | [CLIENT-SPECIFIC] |
| `STRIPE_WEBHOOK_SECRET` | Stripe | Webhook signature verification (`whsec_*`) | [CLIENT-SPECIFIC] |
| `RESEND_API_KEY` | Resend | Transactional email sending key | [CLIENT-SPECIFIC] |
| `GOOGLE_CLIENT_ID` | Google Calendar | OAuth2 client ID for Calendar integration | [CLIENT-SPECIFIC] |
| `GOOGLE_CLIENT_SECRET` | Google Calendar | OAuth2 client secret | [CLIENT-SPECIFIC] |
| `GOOGLE_REDIRECT_URI` | Google Calendar | OAuth2 redirect URI — must match Google Console setting exactly | [CLIENT-SPECIFIC] |
| `CRON_SECRET` | Cron endpoints | Shared secret for external cron service to authenticate `/api/cron/*` calls | [CLIENT-SPECIFIC] |
| `GCS_BUCKET` | Google Cloud Storage | GCS bucket name for media uploads | [CLIENT-SPECIFIC] |
| `GCS_KEY_JSON` | Google Cloud Storage | GCS service account key JSON (base64-encoded or raw) | [CLIENT-SPECIFIC] |

---

## Runtime Environment Variables (non-secret)

| Variable | Default | Notes | Scope |
|---|---|---|---|
| `PORT` | Assigned by Replit | Each artifact binds to this; do not hardcode | [SHARED] |
| `NODE_ENV` | `development` | Set to `production` in Replit deployment; affects logging, cache headers | [SHARED] |
| `REPLIT_DEV_DOMAIN` | Set by Replit | Used to dynamically build CORS allowlist in development | [SHARED] |
| `PUBLIC_URL` | (empty) | Used by `lib/email.ts` for constructing form/confirmation links; set to `https://starrbeautyy.co.uk` in production | [CLIENT-SPECIFIC] |
| `SESSION_HOURS` | `8` | JWT expiry in hours; configurable without code change | [SHARED] |
| `TZ` | Set at startup in `index.ts` | Forces `Europe/London` timezone for all `new Date()` calls in the process | [SHARED] |

---

## Variables Baked Into Code (Bugs / Technical Debt)

These values are hardcoded in source files and should be moved to environment variables for cleaner forking:

| Hardcoded value | Location | Recommended env var |
|---|---|---|
| `FROM = "StarrBeauty <hello@starrbeautyy.co.uk>"` | `artifacts/api-server/src/lib/email.ts` line 4 | `EMAIL_FROM` |
| `+447701298985` (WhatsApp number in email templates) | `artifacts/api-server/src/lib/email.ts` | `WHATSAPP_NUMBER` (or use `dd_settings` KV — partially done) |
| `https://starrbeautyy.co.uk` (CORS, ICS links) | `artifacts/api-server/src/app.ts` | `SITE_URL` (partially via `PUBLIC_URL`) |
| `Hornchurch UUID / Marylebone UUID` | `artifacts/api-server/src/lib/seed.ts` | Should be derived from DB after location insert |
| `BUILT_IN_TREATMENTS` array | `artifacts/api-server/src/routes/portal.ts` | Should be read from Supabase `treatments` table |

---

## Notes

- `STRIPE_PUBLISHABLE_KEY` is the only secret exposed to the frontend — it is injected as `VITE_STRIPE_PUBLISHABLE_KEY` via the Vite build and referenced in `BookingModal.tsx`. This is intentional and safe (publishable keys are designed to be public).
- No secrets are committed to the repository. Verify with `git log --all -S "sk_live"` after any refactor.
- The `ADMIN_PASSWORD` fallback chain: DB override (`portal_kv` key `__global__admin_password_override`) is checked first, then `ADMIN_PASSWORD` env var. This ensures the owner can never be locked out.
