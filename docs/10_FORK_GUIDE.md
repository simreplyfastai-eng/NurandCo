# 10 — Fork Guide

Step-by-step guide for forking this project for a new Aesthetix Systems client.

**Estimated total time (if everything goes smoothly): 3–5 hours**

---

## Prerequisites

Before starting:
- New client brief (brand name, locations, treatments, domain, practitioner name)
- Access to: Replit, Supabase, Stripe, Resend, Google Cloud Console, DNS registrar
- Client's brand assets: logo SVG, hero photos, gallery images, result videos
- Client's social handles and contact details

---

## STEP 1 — Fork the Replit project (15 min)

1. In Replit, open this project ([CLIENT_NAME]).
2. Click the three-dot menu → **Fork**.
3. Name the new Repl: `[ClientName]-platform` (e.g. `luminara-platform`).
4. The fork creates a full copy of the codebase. All secrets from the original are NOT copied — the new Repl starts with an empty secrets vault.
5. Verify both workflows start (they may fail until secrets are set — that's fine at this stage):
   - `artifacts/dermadoll: web`
   - `artifacts/api-server: API Server`

---

## STEP 2 — Create a new Supabase project (20 min)

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Name it: `[clientname]-clinic`.
3. Set a strong database password. Save it.
4. Copy the **Project URL**, **Anon Key**, and **Service Role Key** from Settings → API.
5. In the Supabase SQL Editor, paste and run the entire contents of `docs/05_SUPABASE_SCHEMA.sql`.
   - This creates all tables, indexes, RLS policies, and seeds the default locations + availability.
6. After running the migration, query the new location UUIDs:
   ```sql
   SELECT id, slug, name FROM locations;
   ```
   Save the UUID values — you'll need them in Step 5.
7. **Important:** The `form_tokens` table is included in `05_SUPABASE_SCHEMA.sql`. Verify it was created:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_name = 'form_tokens';
   ```
8. In Supabase Storage → create bucket named `media` (set to public).

---

## STEP 3 — Configure environment variables (20 min)

In the new Replit project, go to **Secrets** and add all of the following:

### Supabase
| Secret | Value |
|---|---|
| `SUPABASE_URL` | New project URL from Step 2 |
| `SUPABASE_ANON_KEY` | New anon key from Step 2 |
| `SUPABASE_SERVICE_KEY` | New service role key from Step 2 |

### Admin auth
| Secret | Value |
|---|---|
| `ADMIN_EMAIL` | Client's admin login email |
| `ADMIN_PASSWORD` | Strong initial password (client can change via portal) |
| `SESSION_SECRET` | Generate: `openssl rand -hex 32` |

### Stripe
| Secret | Value |
|---|---|
| `STRIPE_SECRET_KEY` | New client's Stripe secret key (`sk_live_*`) |
| `STRIPE_PUBLISHABLE_KEY` | New client's Stripe publishable key (`pk_live_*`) |
| `STRIPE_WEBHOOK_SECRET` | Generated in Step 7 after registering the webhook |

### Email
| Secret | Value |
|---|---|
| `RESEND_API_KEY` | New Resend API key for client's account |

### Google Calendar
| Secret | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console (Step 6) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console (Step 6) |
| `GOOGLE_REDIRECT_URI` | `https://[newdomain]/api/google/callback` |

### Cron
| Secret | Value |
|---|---|
| `CRON_SECRET` | Generate: `openssl rand -hex 24` |

### Optional
| Secret | Value |
|---|---|
| `PUBLIC_URL` | `https://[newdomain]` (used in email links) |

---

## STEP 4 — Replace brand tokens (45 min)

Use `docs/07_BRAND_TOKENS.md` and `docs/09_CLIENT_SPECIFIC_DATA.md` as your reference.

### Global search-and-replace

Run these replacements across the entire codebase. Use your editor's "Find in Files" or `sed`:

```bash
# Example using sed (run from workspace root):
grep -r "[CLIENT_NAME]y.co.uk" --include="*.ts" --include="*.tsx" --include="*.html" --include="*.xml" --include="*.txt" -l
```

| Replace | With |
|---|---|
| `[CLIENT_NAME]y.co.uk` | `newclientdomain.co.uk` |
| `[CLIENT_NAME]` | Client brand name |
| `hello@[CLIENT_NAME]y.co.uk` | `hello@newclientdomain.co.uk` (Resend FROM address) |
| `[CLIENT_NAME]yltd@gmail.com` | Client storefront email |
| `+447701298985` | Client WhatsApp number |

### File-by-file changes

1. **`artifacts/dermadoll/index.html`** — Update `<title>`, meta description, OG tags, JSON-LD schema (name, phone, email, locations, social handles).
2. **`artifacts/dermadoll/src/components/Navbar.tsx`** — Update "STARR" / "BEAUTY" wordmark text.
3. **`artifacts/dermadoll/src/components/Footer.tsx`** — Update brand name, social handles, email.
4. **`artifacts/dermadoll/src/components/Locations.tsx`** — Update location names, addresses, map links.
5. **`artifacts/dermadoll/src/components/About.tsx`** — Update practitioner name, bio copy.
6. **`artifacts/dermadoll/src/components/Hero.tsx`** — Update hero copy, location eyebrow text.
7. **`artifacts/dermadoll/src/components/ResultsVideos.tsx`** — Update Supabase CDN URLs to new project.
8. **`artifacts/api-server/src/app.ts`** — Update CORS allowlist with new domain.
9. **`artifacts/api-server/src/lib/email.ts`** — Update FROM address, WhatsApp number in email templates.
10. **`artifacts/api-server/src/routes/portal.ts`** — Update `BUILT_IN_TREATMENTS` array with client's treatments.
11. **`artifacts/dermadoll/public/sitemap.xml`** — Update domain and URLs.
12. **`artifacts/dermadoll/public/robots.txt`** — Update sitemap URL.
13. **`artifacts/dermadoll/public/confirmed.html`** — Update any brand copy.

### Colour palette

If the new client has a different palette, update hex values in `artifacts/dermadoll/src/index.css` and search for `#5C1A1A`, `#C9A96E`, `#FAF7F4` across all component files.

---

## STEP 5 — Replace client-specific data (60 min)

### Location UUIDs

After Step 2, you have new location UUIDs from your new Supabase project.

Files to update:
- `artifacts/api-server/src/lib/seed.ts` — update `LOCATION_IDS` or the UUID constants
- `artifacts/dermadoll/public/portal.html` — search for the old UUIDs and replace

### Treatment catalogue

Replace the seed data in `artifacts/api-server/src/lib/seed.ts` with the new client's full treatment list. Maintain the structure (name, category, duration_minutes, price, deposit_amount, deposit_type, active).

Also update `BUILT_IN_TREATMENTS` in `artifacts/api-server/src/routes/portal.ts` to match.

### Media assets

Replace all images in `artifacts/dermadoll/public/`:
- `favicon.svg` — new logo
- `opengraph.jpg` — 1200×630 OG image
- `eva-hero.jpg` → `[practitioner]-hero.jpg` (update reference in Hero.tsx)
- `eva-about.jpg`, `eva-chair.jpg` → new photos
- `gallery-1.jpg` through `gallery-7.jpg` → new gallery images
- `result-1.jpg` through `result-4.jpg` → new before/after images

Upload result videos to new Supabase Storage bucket and update URLs in `ResultsVideos.tsx`.

---

## STEP 6 — Connect Google Calendar (30 min)

1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project (or reuse if client already has one).
3. Enable **Google Calendar API**.
4. Create OAuth 2.0 credentials (Web Application).
   - Authorised redirect URI: `https://[newdomain]/api/google/callback`
5. Copy Client ID and Secret into Replit Secrets (Step 3).
6. **Publish the OAuth consent screen** (move from Testing to Production) to avoid 7-day token expiry.
7. After deployment, connect via the admin portal → Calendar tab → "Connect Google Calendar" for each location.

---

## STEP 7 — Connect Stripe (20 min)

1. Create or log into the client's Stripe account.
2. Get the live API keys (or test keys for staging).
3. Register a webhook endpoint in Stripe Dashboard → Webhooks:
   - URL: `https://[newdomain]/api/stripe/webhook`
   - Events: `payment_intent.succeeded`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET` Replit Secret.
5. Verify deposit amounts are correct: £20 injectables, £10 other (configurable in `lib/treatments.ts`).

---

## STEP 8 — Connect Resend (15 min)

1. Create or log into the client's Resend account.
2. Add and verify the client's domain (e.g. `newclientdomain.co.uk`) — add DNS TXT and MX records via the domain registrar.
3. Create a new API key and add to `RESEND_API_KEY` secret.
4. Verify the FROM address (`hello@newclientdomain.co.uk`) is on the verified domain.

---

## STEP 9 — Connect domain (20 min)

1. Register or transfer the client's domain.
2. In Replit → Deployment settings → Custom Domain, add the domain.
3. Follow Replit's DNS configuration instructions (usually a CNAME or A record pointing to Replit's servers).
4. Wait for DNS propagation (5–60 minutes).
5. Verify HTTPS is active.
6. Update `GOOGLE_REDIRECT_URI` secret to use the live domain.

---

## STEP 10 — Configure cron jobs (15 min)

Set up an external cron service (e.g. [cron-job.org](https://cron-job.org), [EasyCron](https://www.easycron.com)) to call the cron endpoints on schedule:

| Job URL | Schedule | Header |
|---|---|---|
| `https://[domain]/api/cron/autocomplete` | Every 30 minutes | `X-Cron-Secret: <CRON_SECRET>` |
| `https://[domain]/api/cron/reminders` | Every hour | `X-Cron-Secret: <CRON_SECRET>` |
| `https://[domain]/api/cron/forms-reminders` | Every 6 hours | `X-Cron-Secret: <CRON_SECRET>` |

---

## Testing Checklist Before Handover

Go through every item below before handing the project to the client:

### Infrastructure
- [ ] Both workflows running (`web` + `API Server`)
- [ ] `GET https://[domain]/api/healthz` returns `{"status":"ok"}`
- [ ] No secrets in source code (`git grep "sk_live"` returns nothing)

### Public site
- [ ] Homepage loads with correct brand name, colours, photos
- [ ] Locations section shows correct addresses
- [ ] All nav links scroll to correct sections
- [ ] Footer shows correct social handles and email

### Booking flow
- [ ] Treatment list loads from API
- [ ] Date picker disables closed days correctly
- [ ] Time slots available for an open day
- [ ] Stripe payment form loads (test mode)
- [ ] Test booking completes (use Stripe test card `4242 4242 4242 4242`)
- [ ] Booking confirmation email received by test address
- [ ] Forms link email received after payment

### Admin portal
- [ ] `https://[domain]/portal.html` loads
- [ ] Login works with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- [ ] Location dropdown shows both locations
- [ ] Test booking appears in Bookings tab
- [ ] Client record created in Clients tab
- [ ] Availability editor saves correctly

### Forms system
- [ ] `form_tokens` table exists in Supabase
- [ ] Forms link opens `forms.html?token=<hex>`
- [ ] Medical form submits without error
- [ ] Consent form submits; booking status → `confirmed`
- [ ] Owner notification email received

### Google Calendar
- [ ] OAuth connection completed for each location (in portal → Calendar tab)
- [ ] Test booking creates event in Google Calendar
- [ ] Booking event appears with correct client name and treatment

### Stripe
- [ ] Webhook registered and active in Stripe Dashboard
- [ ] Test payment triggers webhook (`payment_intent.succeeded` logged)
- [ ] Booking status updates to `awaiting_forms` after payment

### Email
- [ ] Resend domain verified (DNS records active)
- [ ] Emails arrive from correct FROM address
- [ ] ICS attachment opens correctly in Apple Calendar / Google Calendar

### SEO
- [ ] `https://[domain]/sitemap.xml` returns 200
- [ ] `https://[domain]/robots.txt` returns 200
- [ ] `<title>` and meta description reflect new client

---

## Estimated Time Breakdown

| Step | Estimated time |
|---|---|
| Fork Replit | 15 min |
| New Supabase project + schema | 20 min |
| Environment variables | 20 min |
| Brand tokens + copy | 45 min |
| Client-specific data (treatments, UUIDs, media) | 60 min |
| Google Calendar | 30 min |
| Stripe | 20 min |
| Resend | 15 min |
| Domain | 20 min |
| Cron jobs | 15 min |
| Testing checklist | 45 min |
| **Total** | **~5.5 hours** |

> Faster on subsequent builds as you become familiar with the codebase structure and checklist.
