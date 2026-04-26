# 02 — Tech Stack

## Why This Stack Was Chosen

- **React + Vite** — fast HMR in development, optimal bundle for a content-heavy public site.
- **Express 5** — mature, minimal, excellent TypeScript support; chosen over Next.js to keep frontend and backend fully separated.
- **Supabase** — managed Postgres with RLS, built-in Storage (CDN), and instant REST/realtime — avoids running a separate DB server.
- **Stripe** — industry-standard payment processing; excellent webhook + Elements SDK.
- **Resend** — developer-friendly transactional email; clean React Email API; domain verification simple.
- **Google Calendar API** — client request; direct OAuth2 integration rather than a third-party wrapper.
- **pnpm monorepo** — single repo for frontend, backend, and shared packages; workspace protocol for internal references.

---

## Frontend (`artifacts/dermadoll`)

| Package | Version | Role in this project |
|---|---|---|
| `react` | catalog (^18) | UI rendering |
| `react-dom` | catalog (^18) | DOM mounting |
| `vite` | catalog (^5) | Build tool and dev server |
| `@vitejs/plugin-react` | catalog | React Fast Refresh for Vite |
| `tailwindcss` | catalog (^4) | Utility-first CSS; custom palette tokens |
| `@tailwindcss/vite` | catalog | Tailwind v4 Vite plugin |
| `@tailwindcss/typography` | ^0.5.15 | Prose styles for text content |
| `tw-animate-css` | ^1.4.0 | Animation utility classes |
| `wouter` | ^3.3.5 | Lightweight client-side routing (replaces React Router) |
| `@tanstack/react-query` | catalog | API data fetching, caching, and refetching |
| `framer-motion` | catalog | Page and component animations |
| `@stripe/stripe-js` | ^9.1.0 | Stripe Elements for client-side deposit payment |
| `react-hook-form` | ^7.55.0 | Form state management |
| `@hookform/resolvers` | ^3.10.0 | Connects react-hook-form to Zod validation |
| `zod` | catalog | Schema validation (shared with backend) |
| `recharts` | ^2.15.2 | Finance charts in the admin portal |
| `date-fns` | ^3.6.0 | Date formatting utilities |
| `sonner` | ^2.0.7 | Toast notifications |
| `lucide-react` | catalog | Icon library |
| `react-icons` | ^5.4.0 | Extended icon set |
| `@radix-ui/*` (22 packages) | various | Accessible UI primitives (dialog, dropdown, accordion, etc.) |
| `class-variance-authority` | catalog | Variant-based class building for UI components |
| `clsx` | catalog | Conditional class name utility |
| `tailwind-merge` | catalog | Merge Tailwind classes without conflicts |
| `cmdk` | ^1.1.1 | Command palette component |
| `embla-carousel-react` | ^8.6.0 | Touch-friendly carousel (GalleryReel) |
| `next-themes` | ^0.4.6 | Dark mode theme management |
| `react-day-picker` | ^9.11.1 | Calendar date picker |
| `react-resizable-panels` | ^2.1.7 | Resizable panel layouts |
| `vaul` | ^1.1.2 | Drawer component (mobile sheets) |
| `input-otp` | ^1.4.2 | OTP input field |
| `@workspace/api-client-react` | workspace:* | Internal typed API client (React Query wrappers) |

---

## Backend (`artifacts/api-server`)

| Package | Version | Role in this project |
|---|---|---|
| `express` | ^5 | HTTP server framework |
| `helmet` | ^8.1.0 | Security headers including CSP |
| `cors` | ^2 | CORS allowlist (production domains + Replit dev) |
| `express-rate-limit` | ^8.3.2 | Per-endpoint rate limiting |
| `cookie-parser` | ^1.4.7 | Cookie parsing middleware |
| `pino` | ^9 | Structured JSON logging |
| `pino-http` | ^10 | HTTP request logging via Pino |
| `pino-pretty` | ^13 | Human-readable log output in dev |
| `@supabase/supabase-js` | ^2.104.0 | Supabase client (anon + service_role) |
| `bcryptjs` | ^3.0.3 | Password hashing for admin auth |
| `jsonwebtoken` | ^9.0.3 | JWT signing and verification for admin sessions |
| `multer` | ^2.1.1 | Multipart file uploads for media management |
| `@google-cloud/storage` | ^7.19.0 | Google Cloud Storage for media files |
| `google-auth-library` | ^10.6.2 | Google OAuth2 client |
| `googleapis` | ^171.4.0 | Google Calendar API |
| `stripe` | ^22.0.0 | Stripe server SDK (payment intents + webhooks) |
| `resend` | ^6.10.0 | Transactional email sending |
| `drizzle-orm` | catalog | ORM (schema definitions; Supabase used for runtime) |
| `pg` | ^8.20.0 | PostgreSQL client |
| `esbuild` | ^0.27.3 | Bundles TypeScript to `dist/index.mjs` |
| `esbuild-plugin-pino` | ^2.3.3 | Pino transport compatibility with esbuild |
| `@workspace/api-zod` | workspace:* | Shared Zod schemas |
| `@workspace/db` | workspace:* | Drizzle ORM schema |

---

## Database

| Service | Details |
|---|---|
| **Supabase** | Managed PostgreSQL; project ID `tithmarxgkafwgqonhfb` |
| Connection | `@supabase/supabase-js` with anon key (public reads) and service_role key (all writes) |
| RLS | Enabled on all tables; service_role bypasses automatically |
| Storage | Supabase Storage bucket `media` — hero/result videos at `starr/hero/` |

---

## Auth

| Package | Role |
|---|---|
| `bcryptjs` | bcrypt password hashing with 12 rounds |
| `jsonwebtoken` | HS256 JWT; 8-hour expiry; signed with `SESSION_SECRET` |

---

## Payments

| Service | Package | Role |
|---|---|---|
| **Stripe** | `stripe` (server) + `@stripe/stripe-js` (client) | Fixed deposit payment intents; webhook for booking status updates |

---

## Email

| Service | Package | Role |
|---|---|---|
| **Resend** | `resend` ^6.10.0 | All transactional emails — booking confirmations, form links, reminders, owner notifications |
| Sender | `hello@starrbeautyy.co.uk` | Must be a verified Resend domain |

---

## External Services

| Service | Purpose | Notes |
|---|---|---|
| **Supabase** | Database + Storage CDN | Project `tithmarxgkafwgqonhfb`; RLS enabled |
| **Stripe** | Deposit payments | Webhook endpoint registered at `/api/stripe/webhook` |
| **Resend** | Transactional email | Domain `starrbeautyy.co.uk` must be DNS-verified |
| **Google Calendar** | Two-way calendar sync | OAuth2 per location; app currently in **Testing mode** (7-day refresh token limit) |
| **Google Cloud Storage** | Media file storage | Used for images/videos uploaded via admin portal |
| **Klarna** | TODO: needs manual review — referenced in spec but not confirmed wired |

---

## Build & Tooling

| Tool | Role |
|---|---|
| `pnpm` workspaces | Monorepo dependency management |
| `esbuild` | Bundles API server to `dist/index.mjs` (ESM, Node platform) |
| `TypeScript` | Full type coverage on both frontend and backend |
| Replit Secrets | All environment variables (no `.env` files in repo) |
