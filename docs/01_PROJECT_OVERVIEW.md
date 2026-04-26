# 01 — Project Overview

## Project Name
**[CLIENT_NAME] / Starr Aesthetics Clinic Platform**

## Client
**Starr Aesthetics** (trading as [CLIENT_NAME]) — a two-location premium aesthetics clinic operated by Eva.

## Live URL
`https://[CLIENT_NAME]y.co.uk`

## Status
**Live (deployed via Replit). In active development — Stripe deposit, Resend emails, and Google Calendar sync are wired; polish and feature additions ongoing.**

## Date Built / Last Updated
Built: early 2025. Last audited and updated: **April 2026**.

---

## High-Level Architecture

| Layer | Technology | Role |
|---|---|---|
| Public site | React 18 + Vite 5 (SPA) | Marketing pages, service catalogue, booking flow, Stripe deposit |
| Admin portal | Vanilla JS SPA (`portal.html`) | Full clinic management for Eva |
| API server | Express 5 + TypeScript, Node.js ESM | All backend logic, database writes, payment, email, calendar |
| Database | Supabase (PostgreSQL) | Single cloud DB; service_role key for all writes |
| Payments | Stripe | Fixed-amount deposits (£20 / £10) |
| Email | Resend | Booking confirmations, form links, reminders, owner notifications |
| Calendar | Google Calendar API (OAuth2) | Two-way sync — creates and reads events per location |
| Media | Supabase Storage (CDN) | Hero videos, result videos (bucket: `media`, path: `starr/`) |
| Hosting | Replit + custom domain | pnpm monorepo; two workflow artifacts |

---

## Major Features Delivered

1. **Public booking flow** — treatment picker → location selector → date/time slot → Stripe deposit payment → confirmation page + ICS email.
2. **Deposit collection** — fixed £20 (injectables) / £10 (all other) via Stripe Elements; webhook wires success to booking status.
3. **Admin portal** (`/portal.html`) — Dashboard, Bookings, Clients, Treatments, Availability, Finance charts, Media, Settings, Enquiries, Google Calendar connect/disconnect.
4. **Medical & consent forms system** — token-gated forms page; single-use 256-bit tokens; 7-day expiry; auto-sent after deposit.
5. **Google Calendar two-way sync** — per-location OAuth2; `createCalendarEvent()` on booking confirmed; `getGoogleCalendarBusyRanges()` reads calendar events to block availability slots.
6. **Email automation** — booking confirmation + ICS, forms link, 24h reminder, forms 48h reminder, owner notifications via Resend.
7. **Multi-location isolation** — Hornchurch (Essex) and Marylebone (London) are fully isolated at DB, API, and UI level.
8. **SEO / health audit** — `sitemap.xml`, `robots.txt`, JSON-LD BeautySalon schema, canonical URL, lazy-loading, CDN range-request streaming.
9. **Cron jobs** — auto-complete past bookings, 24h appointment reminders, 48h forms reminders.
10. **Security hardening** — Helmet CSP, rate limits per endpoint, CORS allowlist, IDOR guard on client updates, XSS escaping in portal.

---

## Locations

| Location | UUID (production) | Address |
|---|---|---|
| Hornchurch | `ccb325d5-6b17-4218-b97d-1a1a0383410a` | Hornchurch, Essex RM11 |
| Marylebone | `5b3d890a-bf6f-4e87-af43-5db0726a46ce` | Marylebone, London W1G |

---

## Key Contacts (Client-Specific)

| Role | Name / Detail |
|---|---|
| Operator / owner | Eva |
| Owner email | simrandeepssangha@icloud.com |
| Storefront email | [CLIENT_NAME]yltd@gmail.com |
| Business phone / WhatsApp | +447701298985 |
| Domain | [CLIENT_NAME]y.co.uk |
