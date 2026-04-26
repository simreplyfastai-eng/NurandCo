# 07 — Brand Tokens

**Change the files listed in this document → the entire site rebrands.**

---

## Colour Palette

| Token | Hex | Usage |
|---|---|---|
| Burgundy | `#5C1A1A` | Primary brand colour — headings, logo text, borders, accents |
| Gold | `#C9A96E` | Secondary accent — subheadings, dividers, ticker text, hover states |
| Cream | `#FAF7F4` | Page background; also referenced as `#F5F0EB` (slightly warmer, used in footer) |
| Dark gold | `#A87B3B` | Hover state on gold elements |
| Neutral grey | `#737373` | Body text, secondary labels |
| Off-white border | `#E2DDD5` | Subtle borders and dividers |
| Red accent | `#A80000` | "AESTHETIX" brand link in footer |

### Where colours are defined

| File | What it controls |
|---|---|
| `artifacts/dermadoll/src/index.css` | **Master source** — all CSS custom properties and utility classes used throughout the React SPA |
| `artifacts/dermadoll/public/portal.html` | Hardcoded inline styles and CSS variables for the admin portal (separate from React) |
| `artifacts/dermadoll/src/components/Navbar.tsx` | Logo text colour (`#5C1A1A`), gold subheading (`#C9A96E`) |
| `artifacts/dermadoll/src/components/Footer.tsx` | Footer background (`#F5F0EB`), all text colours |
| `artifacts/dermadoll/src/components/Hero.tsx` | Hero text colours |
| `artifacts/dermadoll/index.html` | No colours — but controls OG image and brand name in `<title>` |

### CSS custom properties (defined in `index.css`)

```css
/* [Client] brand palette — line ~60 of index.css */
--app-font-sans: 'Inter', sans-serif;
--app-font-serif: 'Cormorant Garamond', serif;

/* Colours are used inline in components, not as CSS vars.
   The Tailwind theme is extended with these in tailwind.config
   (currently not explicitly configured — colours applied inline). */
```

> **Note:** This project applies brand colours primarily as **inline styles and hardcoded hex values** within components rather than as Tailwind config tokens. To make rebranding faster for future builds, move all colour constants to a `src/lib/theme.ts` file and import from there.

---

## Typography

| Font | Weight / Style | Applied to |
|---|---|---|
| **Cormorant Garamond** | 300, 400, 600, 700 (+ italic variants) | All headings, logo "[CLIENT]", section titles, pull quotes |
| **Inter** | 300, 400, 500 | All body copy, labels, buttons, navigation links |

### Where fonts are loaded

1. **Google Fonts import** in `artifacts/dermadoll/index.html` (lines 20–21) — `<link>` preconnect + stylesheet.
2. **CSS import** at line 1 of `artifacts/dermadoll/src/index.css`:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Inter:wght@300;400;500&display=swap');
   ```
3. **CSS variable** in `index.css` line 60:
   ```css
   --font-sans: var(--app-font-sans);
   ```

### Font pairing rule

- Headings / display text → `fontFamily: "'Cormorant Garamond', serif"`
- UI text / body / labels → `fontFamily: "'Inter', sans-serif"`

---

## Logo

| Asset | Path | Notes |
|---|---|---|
| SVG favicon / logo | `artifacts/dermadoll/public/favicon.svg` | Used in browser tab and as base for in-app logo |
| Logo text (wordmark) | Rendered in code — `artifacts/dermadoll/src/components/Navbar.tsx` and `Footer.tsx` | "[CLIENT]" in Cormorant Garamond 700, "BEAUTY" in Inter 400 with wide letter-spacing |

**To rebrand logo:** Replace `favicon.svg` AND update the text in `Navbar.tsx` and `Footer.tsx`.

---

## Hero Media

| Asset | Source | Notes |
|---|---|---|
| Hero background image | `artifacts/dermadoll/public/eva-hero.jpg` | Used in `Hero.tsx` |
| Hero videos (results) | Supabase CDN: `https://[SUPABASE_PROJECT_REF].supabase.co/storage/v1/object/public/media/[client-slug]/hero/video1.mp4` (video2, video3) | Loaded in `ResultsVideos.tsx` with hardcoded CDN URLs |
| About section image | `artifacts/dermadoll/public/eva-about.jpg` | Used in `About.tsx` |
| Chair/clinic image | `artifacts/dermadoll/public/eva-chair.jpg` | Used in multiple sections |
| Practitioner photo | `artifacts/dermadoll/public/niamh-practitioner.jpg` | Used in team section |
| Clinic room | `artifacts/dermadoll/public/hero-room.jpg` | Background/section image |
| Gallery images | `artifacts/dermadoll/public/gallery-1.jpg` through `gallery-7.jpg` | `GalleryReel.tsx` carousel |
| Before/after results | `artifacts/dermadoll/public/result-1.jpg` through `result-4.jpg` | `BeforeAfter.tsx` slider |
| OG share image | `artifacts/dermadoll/public/opengraph.jpg` | 1200×630 for social sharing |
| Training section | `artifacts/dermadoll/src/assets/training-pathway.jpg` | Used in `Training.tsx` |

---

## Button Styles

Primary CTA button (used throughout):
```css
background: #5C1A1A;  /* burgundy */
color: white;
fontFamily: 'Inter', sans-serif;
letterSpacing: 0.15em;
textTransform: uppercase;
fontSize: 11px;
fontWeight: 500;
padding: 14px 32px;
border: none;
cursor: pointer;
transition: background 0.2s, opacity 0.2s;

/* Hover: */
background: #7A2424;  /* slightly lighter burgundy */
```

Secondary / ghost button:
```css
background: transparent;
border: 1px solid #5C1A1A;
color: #5C1A1A;

/* Hover: */
background: #5C1A1A;
color: white;
```

Gold text link:
```css
color: #C9A96E;
textDecoration: none;
letterSpacing: 0.08em;
fontSize: 11px;
textTransform: uppercase;
```

---

## Card & Section Styles

Section background: `#FAF7F4` (cream)
Divider: `1px solid #E2DDD5`
Card background: `white`
Card border: `1px solid #E2DDD5`
Border radius: `0px` (no rounded corners — clean, editorial aesthetic)
Box shadow on hover: `0 8px 32px rgba(92,26,26,0.08)` (subtle burgundy tint)

---

## Social Media Handles ([Client]-specific)

| Platform | Handles |
|---|---|
| Instagram | @[Client]Facess, @[ClientName]s, @[Client]Suitess, @[Client]Nailedd |
| TikTok | @[Client]Facess, @[ClientName]s, @[Client]Suitess, @[Client]Nailedd |

Defined in `artifacts/dermadoll/src/components/Footer.tsx` lines 3–16.

---

## Rebrand Checklist

To fully rebrand for a new client, change these files **in this order**:

| Step | File | What to change |
|---|---|---|
| 1 | `artifacts/dermadoll/index.html` | `<title>`, meta description, OG tags, JSON-LD schema, phone, email, social handles |
| 2 | `artifacts/dermadoll/public/favicon.svg` | Replace with new client's logo |
| 3 | `artifacts/dermadoll/public/opengraph.jpg` | Replace with new client's OG image |
| 4 | `artifacts/dermadoll/src/index.css` | Update font imports, any CSS variables |
| 5 | `artifacts/dermadoll/src/components/Navbar.tsx` | Brand name, logo text, colours |
| 6 | `artifacts/dermadoll/src/components/Footer.tsx` | Brand name, social handles, email, colours |
| 7 | `artifacts/dermadoll/src/components/Hero.tsx` | Hero copy, images |
| 8 | `artifacts/dermadoll/src/components/About.tsx` | Bio copy, practitioner name |
| 9 | `artifacts/dermadoll/src/components/Locations.tsx` | Clinic addresses |
| 10 | `artifacts/dermadoll/src/components/ResultsVideos.tsx` | Supabase CDN URLs for new client's videos |
| 11 | `artifacts/dermadoll/public/portal.html` | Brand colours at top of file, any hardcoded copy |
| 12 | `artifacts/api-server/src/lib/email.ts` | FROM address, email copy, WhatsApp number |
| 13 | `artifacts/api-server/src/app.ts` | CORS allowlist — replace `[CLIENT_NAME]y.co.uk` |
| 14 | All `public/*.jpg` images | Replace with new client's photos |
