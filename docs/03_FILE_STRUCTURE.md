# 03 — File Structure

Tags:
- `[CORE]` — generic infrastructure; safe to reuse unchanged across builds
- `[CLIENT-SPECIFIC]` — must be swapped out for each new client
- `[CONFIG]` — environment / settings file
- `★ HARDCODED` — contains hardcoded Starr-specific data (highlighted below)

---

```
workspace/
├── PROJECT_SPEC.md                          [CLIENT-SPECIFIC] ★ Master technical reference for Starr build
├── pnpm-workspace.yaml                      [CORE]            pnpm monorepo workspace configuration
├── package.json                             [CORE]            Root workspace package
│
├── docs/                                    [CLIENT-SPECIFIC] This documentation pack
│
├── artifacts/
│   │
│   ├── dermadoll/                           ← Public marketing site + static admin pages
│   │   ├── index.html                       [CLIENT-SPECIFIC] ★ SEO meta, OG tags, JSON-LD schema, canonical URL — all Starr-specific
│   │   ├── vite.config.ts                   [CONFIG]          Vite build config; BASE_URL, port, proxy rules
│   │   ├── tsconfig.json                    [CORE]            TypeScript config for frontend
│   │   ├── package.json                     [CORE]            Frontend dependencies
│   │   ├── components.json                  [CORE]            shadcn/ui config
│   │   │
│   │   ├── public/
│   │   │   ├── portal.html                  [CLIENT-SPECIFIC] ★ Admin SPA (~6000 lines vanilla JS); brand colours, KV keys, location UUIDs hardcoded
│   │   │   ├── forms.html                   [CORE]            Medical/consent forms page (token-gated); mostly generic
│   │   │   ├── confirmed.html               [CLIENT-SPECIFIC] ★ Post-booking confirmation page; brand copy hardcoded
│   │   │   ├── sitemap.xml                  [CLIENT-SPECIFIC] ★ Starr domain and URL structure
│   │   │   ├── robots.txt                   [CLIENT-SPECIFIC] ★ Starr domain in sitemap reference
│   │   │   ├── favicon.svg                  [CLIENT-SPECIFIC] ★ Starr brand logo
│   │   │   ├── opengraph.jpg                [CLIENT-SPECIFIC] ★ OG image for social sharing
│   │   │   ├── hero.mp4                     [CLIENT-SPECIFIC] ★ Legacy hero video (currently unused; Hero.tsx fetches from API)
│   │   │   ├── eva-hero.jpg                 [CLIENT-SPECIFIC] ★ Eva hero portrait
│   │   │   ├── eva-about.jpg                [CLIENT-SPECIFIC] ★ Eva about section portrait
│   │   │   ├── eva-chair.jpg                [CLIENT-SPECIFIC] ★ Eva chair photo
│   │   │   ├── niamh-practitioner.jpg       [CLIENT-SPECIFIC] ★ Niamh practitioner photo
│   │   │   ├── hero-room.jpg                [CLIENT-SPECIFIC] ★ Clinic room photo
│   │   │   ├── gallery-1.jpg → gallery-7.jpg[CLIENT-SPECIFIC] ★ Gallery images
│   │   │   ├── result-1.jpg → result-4.jpg  [CLIENT-SPECIFIC] ★ Before/after result images
│   │   │   └── portal.html.bak              [CLIENT-SPECIFIC]  Backup of portal.html
│   │   │
│   │   └── src/
│   │       ├── main.tsx                     [CORE]            React app entry point
│   │       ├── App.tsx                      [CLIENT-SPECIFIC] ★ Route definitions; wraps all pages
│   │       ├── index.css                    [CLIENT-SPECIFIC] ★ Global CSS; Starr brand palette, fonts (Cormorant Garamond, Inter)
│   │       │
│   │       ├── assets/
│   │       │   └── training-pathway.jpg     [CLIENT-SPECIFIC] ★ Training section image
│   │       │
│   │       ├── components/
│   │       │   ├── Navbar.tsx               [CLIENT-SPECIFIC] ★ Starr logo, nav links, brand colours
│   │       │   ├── Hero.tsx                 [CLIENT-SPECIFIC] ★ Hero copy, eva-hero.jpg, video from API
│   │       │   ├── About.tsx                [CLIENT-SPECIFIC] ★ Eva bio copy, photos
│   │       │   ├── Services.tsx             [CLIENT-SPECIFIC] ★ Service cards pulled from /api/portal/catalog
│   │       │   ├── Pricing.tsx              [CLIENT-SPECIFIC] ★ Pricing section; pulls from API
│   │       │   ├── Packages.tsx             [CLIENT-SPECIFIC] ★ Package deals copy
│   │       │   ├── Locations.tsx            [CLIENT-SPECIFIC] ★ Hardcodes Hornchurch/Marylebone addresses and maps
│   │       │   ├── BookingModal.tsx         [CORE]            ★ Booking flow UI (treatment → slot → Stripe); location UUIDs passed via props
│   │       │   ├── BookNow.tsx              [CLIENT-SPECIFIC] ★ Book Now section CTA
│   │       │   ├── BeforeAfter.tsx          [CLIENT-SPECIFIC] ★ Before/after slider; uses result-*.jpg
│   │       │   ├── GalleryReel.tsx          [CLIENT-SPECIFIC] ★ Gallery carousel; uses gallery-*.jpg
│   │       │   ├── ResultsVideos.tsx        [CLIENT-SPECIFIC] ★ Result videos; hardcodes Supabase CDN URLs for Starr bucket
│   │       │   ├── FacesGallery.tsx         [CLIENT-SPECIFIC] ★ Faces gallery
│   │       │   ├── Reviews.tsx              [CLIENT-SPECIFIC] ★ Client review testimonials (hardcoded copy)
│   │       │   ├── Training.tsx             [CLIENT-SPECIFIC] ★ Training section; training-pathway.jpg; course enquiry form
│   │       │   ├── FAQ.tsx                  [CLIENT-SPECIFIC] ★ FAQ copy (treatment-specific)
│   │       │   ├── Contact.tsx              [CLIENT-SPECIFIC] ★ Contact details; links to starrbeautyyltd@gmail.com
│   │       │   ├── Footer.tsx               [CLIENT-SPECIFIC] ★ Brand name "STARR BEAUTY", social handles, email, nav links
│   │       │   ├── InstagramSection.tsx     [CLIENT-SPECIFIC] ★ Instagram embeds/links for Starr accounts
│   │       │   ├── TrustTicker.tsx          [CORE]            Scrolling trust badge ticker
│   │       │   ├── SectionDivider.tsx       [CORE]            Decorative divider
│   │       │   ├── CTABanner.tsx            [CLIENT-SPECIFIC] ★ CTA copy
│   │       │   ├── PopupBanner.tsx          [CLIENT-SPECIFIC] ★ Popup/announcement copy
│   │       │   ├── ConsultationModal.tsx    [CORE]            Consultation booking modal
│   │       │   └── ui/                      [CORE]            shadcn/ui component library (40+ files)
│   │       │
│   │       ├── pages/
│   │       │   ├── Home.tsx                 [CLIENT-SPECIFIC] ★ Assembles all homepage sections
│   │       │   ├── Book.tsx                 [CORE]            Booking page; passes locationId via query param
│   │       │   └── not-found.tsx            [CORE]            404 page
│   │       │
│   │       ├── hooks/
│   │       │   ├── use-mobile.tsx           [CORE]            Mobile breakpoint hook
│   │       │   └── use-toast.ts             [CORE]            Toast hook
│   │       │
│   │       └── lib/
│   │           ├── utils.ts                 [CORE]            clsx + tailwind-merge utility
│   │           ├── treatments.ts            [CLIENT-SPECIFIC] ★ Treatment list used in booking UI
│   │           └── nextSlot.ts              [CORE]            Next available slot calculator
│   │
│   ├── api-server/                          ← Express 5 API backend
│   │   ├── package.json                     [CORE]            Backend dependencies
│   │   ├── tsconfig.json                    [CORE]            TypeScript config
│   │   ├── build.mjs                        [CORE]            esbuild bundler config
│   │   ├── supabase-migration.sql           [CLIENT-SPECIFIC] ★ SQL migration for Starr; seeds locations with Starr addresses
│   │   ├── test_payment_flow.mjs            [CORE]            Manual Stripe payment flow test script
│   │   │
│   │   └── src/
│   │       ├── index.ts                     [CORE]            Server entry; sets TZ=Europe/London, binds to $PORT
│   │       ├── app.ts                       [CLIENT-SPECIFIC] ★ CORS allowlist includes starrbeautyy.co.uk; CSP config
│   │       ├── googleCalendar.ts            [CORE]            Google Calendar OAuth2, event CRUD, busy range reads
│   │       │
│   │       ├── routes/
│   │       │   ├── index.ts                 [CORE]            Route aggregator
│   │       │   ├── health.ts                [CORE]            GET /api/healthz
│   │       │   ├── auth.ts                  [CORE]            Login, verify, change-password
│   │       │   ├── bookings.ts              [CORE]            Booking CRUD, auto-complete, forms trigger
│   │       │   ├── clients.ts               [CORE]            Client CRUD, dedup, IDOR guard
│   │       │   ├── availability.ts          [CORE]            Slot availability engine
│   │       │   ├── treatments-route.ts      [CORE]            GET/POST/PUT/DELETE /api/treatments
│   │       │   ├── portal.ts                [CLIENT-SPECIFIC] ★ BUILT_IN_TREATMENTS hardcoded for Starr; KV store
│   │       │   ├── forms.ts                 [CORE]            Token-gated medical/consent submission
│   │       │   ├── stripe.ts                [CORE]            Payment intent + webhook
│   │       │   ├── finance.ts               [CORE]            Monthly revenue summary + chart data
│   │       │   ├── enquiries.ts             [CORE]            Public enquiry form
│   │       │   ├── admin.ts                 [CORE]            Admin utility endpoints
│   │       │   ├── locations.ts             [CORE]            GET /api/locations
│   │       │   ├── media.ts                 [CORE]            GCS upload/list/delete + range-request streaming
│   │       │   ├── calendar.ts              [CORE]            ICS file download
│   │       │   ├── cron.ts                  [CORE]            Auto-complete, reminders, forms-reminders
│   │       │   └── google.ts                [CORE]            Google OAuth2 callback for Calendar
│   │       │
│   │       └── lib/
│   │           ├── supabase.ts              [CORE]            Supabase anon + service_role clients
│   │           ├── auth.ts                  [CORE]            requireAuth() middleware
│   │           ├── seed.ts                  [CLIENT-SPECIFIC] ★ 77 Starr treatments; Hornchurch/Marylebone UUIDs
│   │           ├── treatments.ts            [CLIENT-SPECIFIC] ★ Injectable keyword list; legacy TREATMENT_PRICES fallback
│   │           ├── email.ts                 [CLIENT-SPECIFIC] ★ FROM address starrbeautyy.co.uk; WhatsApp number; email copy
│   │           ├── tz.ts                    [CORE]            BST/GMT boundary helpers
│   │           ├── sanitize.ts              [CORE]            XSS sanitisation helper
│   │           ├── objectStorage.ts         [CORE]            GCS helper (upload/download/delete)
│   │           ├── objectAcl.ts             [CORE]            GCS ACL helpers
│   │           └── logger.ts               [CORE]            Pino logger instance
│   │
│   └── mockup-sandbox/                      [CORE]            Canvas/design component preview server (Vite)
│
└── packages/
    ├── api-zod/                             [CORE]            Shared Zod validation schemas
    ├── api-client-react/                    [CORE]            Typed React Query API client hooks
    └── db/                                  [CORE]            Drizzle ORM schema definitions
```

---

## Files with the Most Hardcoded Starr Data

| File | Hardcoded content |
|---|---|
| `artifacts/dermadoll/index.html` | Domain, OG image, JSON-LD schema, phone, email, social handles |
| `artifacts/dermadoll/public/portal.html` | Brand colours, BUILT_IN_TREATMENTS list, location UUIDs, Eva's details |
| `artifacts/api-server/src/lib/seed.ts` | All 77 treatments, Hornchurch/Marylebone UUIDs, categories, prices |
| `artifacts/api-server/src/lib/email.ts` | FROM address, WhatsApp number, booking copy |
| `artifacts/api-server/src/app.ts` | CORS allowlist with starrbeautyy.co.uk |
| `artifacts/dermadoll/src/components/Footer.tsx` | "STARR BEAUTY", social handles, email |
| `artifacts/dermadoll/src/components/Locations.tsx` | Clinic addresses, map links |
| `artifacts/api-server/supabase-migration.sql` | Hornchurch/Marylebone addresses seeded into DB |
