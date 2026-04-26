# 09 — Client-Specific Data

This is the **search-and-replace checklist** for forking this project for a new client. Every item listed here contains hardcoded [Client]-specific data that must be swapped out.

---

## Identity

| Value | Where to find it | Notes |
|---|---|---|
| `[CLIENT_NAME]` | `index.html`, `Navbar.tsx`, `Footer.tsx`, `email.ts`, `portal.html`, `sitemap.xml`, JSON-LD | Brand name — replace everywhere |
| `[Client Name]` | `PROJECT_SPEC.md`, JSON-LD, `About.tsx`, `Training.tsx` | Legal/trading name |
| `Eva` | `About.tsx`, `Hero.tsx`, `Training.tsx`, email templates in `email.ts` | Operator name |
| `[CLIENT_NAME]y.co.uk` | `index.html`, `app.ts` (CORS), `email.ts`, `sitemap.xml`, `robots.txt`, `confirmed.html` | Domain — replace throughout |
| `[CLIENT_NAME]yltd@gmail.com` | `index.html` (JSON-LD), `Footer.tsx`, `Contact.tsx` | Storefront email |
| `simrandeepssangha@icloud.com` | `PROJECT_SPEC.md` only | Owner personal email — not in public codebase |
| `+447701298985` | `index.html` (JSON-LD), `email.ts` (WhatsApp links + ICS) | Business / WhatsApp number |
| `hello@[CLIENT_NAME]y.co.uk` | `artifacts/api-server/src/lib/email.ts` line 4 (FROM address) | Resend sender address — must be a verified domain |
| `https://aesthetix-systems.co.uk` | `Footer.tsx` ("Powered By AESTHETIX" link) | Agency backlink — keep or replace |

---

## Location Data

| Value | Where used | UUID |
|---|---|---|
| **[LOCATION_1]** (name) | `Locations.tsx`, `portal.html`, `supabase-migration.sql`, `seed.ts` | `[LOCATION_1_UUID]` |
| **[LOCATION_2]** (name) | `Locations.tsx`, `portal.html`, `supabase-migration.sql`, `seed.ts` | `[LOCATION_2_UUID]` |
| **[LOCATION_1], Essex RM11** | `supabase-migration.sql` (seed address), `index.html` (JSON-LD) | — |
| **[LOCATION_2], London W1G** | `supabase-migration.sql` (seed address), `index.html` (JSON-LD) | — |

### Files containing location UUIDs

```
artifacts/api-server/src/lib/seed.ts
  → LOCATION_IDS constant or hardcoded UUIDs in treatment seed rows

artifacts/dermadoll/public/portal.html
  → LOCATION_IDS or inline UUID references in JS

PROJECT_SPEC.md
  → Scratchpad reference only

docs/ (this file)
  → Documentation only
```

**Important:** When forking to a new Supabase project, the location UUIDs will be different (new `gen_random_uuid()` values). After running the schema migration and seeding locations, query the new UUIDs:
```sql
SELECT id, slug FROM locations;
```
Then update every hardcoded UUID reference listed above.

---

## Brand Strings

| Value | File | Line / Context |
|---|---|---|
| `"[CLIENT]"` (wordmark) | `Navbar.tsx`, `Footer.tsx` | `<span>` text — Cormorant Garamond display |
| `"BEAUTY"` (submark) | `Navbar.tsx`, `Footer.tsx` | `<span>` text — Inter uppercase |
| `"Beauty Redefined"` (tagline) | `Footer.tsx` | Italic serif tagline |
| `"Precision Aesthetics. Confident Results."` | `index.html` `<title>` | SEO page title |
| `"Premium aesthetic treatments in [LOCATION_1], Essex and [LOCATION_2], London"` | `index.html` meta description | SEO description |
| `"NaturalèLips™"` | `index.html`, `Hero.tsx`, `Services.tsx` | Signature treatment name — replace with new client's hero treatment |
| `"[LOCATION_1] & [LOCATION_2]"` | `Hero.tsx` | Location eyebrow text |
| `"Essex & London"` | `Hero.tsx` | Location subheading |
| `"Booked via: [CLIENT_NAME] website"` | `googleCalendar.ts` line 106 | Calendar event description |

---

## Social Handles

| Platform | Handles | File |
|---|---|---|
| Instagram | @[Client]Facess, @[ClientName]s, @[Client]Suitess, @[Client]Nailedd | `Footer.tsx` lines 3–9, `index.html` JSON-LD sameAs |
| TikTok | @[Client]Facess, @[ClientName]s, @[Client]Suitess, @[Client]Nailedd | `Footer.tsx` lines 10–16 |

---

## Treatment Seed Data

**File:** `artifacts/api-server/src/lib/seed.ts`

Contains the full list of 77 treatments hardcoded for [Client]:
- 66 [LOCATION_1] treatments across: Aesthetics (fillers, SPMU, anti-wrinkle, consultation, fat dissolving, skin boosters), Lashes & Brows, Facials, Nails
- 11 [LOCATION_2] treatments (Aesthetics + Lashes & Brows)

**Replace with:** New client's treatment catalogue. Maintain the same data structure:
```typescript
{
  location_id: [LOCATION_1]_ID,
  name: "Treatment Name",
  category: "Category Name",
  duration_minutes: 60,
  price: 150,
  deposit_amount: 10,   // £20 for injectables, £10 for others
  deposit_type: 'fixed',
  active: true,
}
```

---

## Portal Built-In Treatments

**File:** `artifacts/api-server/src/routes/portal.ts`

Contains a separate `BUILT_IN_TREATMENTS` array used for the public-facing catalog endpoint. This is a divergent list from the Supabase seed data and must also be updated per client.

---

## Media URLs (Supabase CDN)

**File:** `artifacts/dermadoll/src/components/ResultsVideos.tsx`

```typescript
// Hardcoded [Client] CDN video URLs:
https://[SUPABASE_PROJECT_REF].supabase.co/storage/v1/object/public/media/[client-slug]/hero/video1.mp4
https://[SUPABASE_PROJECT_REF].supabase.co/storage/v1/object/public/media/[client-slug]/hero/video2.mp4
https://[SUPABASE_PROJECT_REF].supabase.co/storage/v1/object/public/media/[client-slug]/hero/video3.mp4
```

Replace with new client's Supabase project ID and bucket path.

---

## CORS Allowlist

**File:** `artifacts/api-server/src/app.ts`

```typescript
const allowedOrigins = [
  'https://[CLIENT_NAME]y.co.uk',
  'https://www.[CLIENT_NAME]y.co.uk',
  ...
];
```

Replace with new client's domain(s).

---

## Email From Address & WhatsApp

**File:** `artifacts/api-server/src/lib/email.ts`

```typescript
const FROM = "[CLIENT_NAME] <hello@[CLIENT_NAME]y.co.uk>";   // line 4
// WhatsApp: +447701298985 (appears in email templates and ICS description)
```

---

## Sitemap & Robots

**File:** `artifacts/dermadoll/public/sitemap.xml`

```xml
<loc>https://[CLIENT_NAME]y.co.uk/</loc>
<loc>https://[CLIENT_NAME]y.co.uk/book</loc>
```

**File:** `artifacts/dermadoll/public/robots.txt`

```
Sitemap: https://[CLIENT_NAME]y.co.uk/sitemap.xml
```

---

## Complete Search-and-Replace List

Run these searches across the entire codebase when forking:

| Search for | Replace with |
|---|---|
| `[CLIENT_NAME]y.co.uk` | `newclientdomain.co.uk` |
| `[CLIENT_NAME]` | `NewClientBrandName` |
| `[Client Name]` | `New Client Legal Name` |
| `[client-slug]` (in bucket paths) | `newclient` |
| `[SUPABASE_PROJECT_REF]` | New Supabase project ID |
| `[LOCATION_1_UUID]` | New [LOCATION_1]/Location1 UUID |
| `[LOCATION_2_UUID]` | New [LOCATION_2]/Location2 UUID |
| `[LOCATION_1]` | New Location 1 name |
| `[LOCATION_2]` | New Location 2 name |
| `hello@[CLIENT_NAME]y.co.uk` | `hello@newclientdomain.co.uk` |
| `[CLIENT_NAME]yltd@gmail.com` | New client storefront email |
| `+447701298985` | New client WhatsApp number |
| `@[Client]Facess` (and other handles) | New client social handles |
| `Eva` | New client practitioner name |
| `NaturalèLips™` | New client signature treatment |
