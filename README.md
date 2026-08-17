# RAVE.LK

Website and content management system for Rave.LK — Sri Lanka's electronic
music event brand.

Built with Next.js 16 (App Router), TypeScript, Tailwind v4, MySQL on Clever
Cloud, and Cloudinary for media.

---

## Getting started

```bash
npm install
npm run db:setup   # creates tables + seeds starter content (safe to re-run)
npm run dev        # http://localhost:3000
```

### Admin

| | |
|---|---|
| URL | `/admin` |
| Email | `admin@rave.lk` |
| Password | `RaveLK@2026` |

**Change the password immediately** from *Site settings → Your password*.

---

## What the CMS controls

| Section | What you can do |
|---|---|
| **Dashboard** | Live counts, latest bookings, next events |
| **Events** | Create/edit/delete events, posters, lineups, status, featured pick |
| **Ticket tiers** | Per-event pricing, perks, stock limits (inside each event) |
| **Gallery** | Multi-upload photos, captions, categories, link to events, homepage picks |
| **Bookings** | View, filter, search, confirm payment, export CSV |
| **Messages** | Contact-form enquiries, mark handled |
| **Subscribers** | Mailing list, copy emails, export CSV |
| **Site settings** | Hero copy, about text, contact details, social links |
| **Payments** | Gateway credentials, sandbox toggle, bank transfer details |

Nothing on the public site is hard-coded — every headline, image and price
comes from the database.

---

## Payments

Ships in **manual mode**: customers book, get a reference, and you confirm
payment by hand from *Bookings*. Marking a booking paid updates tier stock
automatically.

To go live with online payments:

1. Go to **Admin → Payments**
2. Choose **PayHere**, enter your Merchant ID and Secret
3. In your PayHere dashboard, whitelist your domain and set the notify URL to
   `https://yourdomain.com/api/payments/payhere/notify`
4. Tick **Take payments online**, test with **Sandbox** on, then turn sandbox off

Bookings are only marked paid by PayHere's signed server-to-server callback —
never by the browser redirect — and the amount is re-checked against the
stored total before confirming.

Stripe fields are present and stored, but the redirect isn't implemented; with
Stripe selected, checkout falls back to the manual flow.

---

## Configuration

**This repository is public, so no secret is committed.** Everything is read
from environment variables via `src/config.ts`.

Locally, copy `.env.example` to `.env.local` and fill it in (`.env*` is
gitignored). Then verify:

```bash
npm run check    # checks every variable, then connects to the database
```

| Variable | Required | Notes |
|---|---|---|
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | yes | MySQL connection |
| `DB_SSL` | no | `true` by default; managed providers need TLS |
| `AUTH_SECRET` | yes | 32+ random chars. Changing it signs all admins out |
| `CLOUDINARY_CLOUD_NAME` `CLOUDINARY_API_KEY` `CLOUDINARY_API_SECRET` | for uploads | Image hosting |
| `NEXT_PUBLIC_SITE_URL` | production | Your real domain. Payment return URLs are built from it |

Generate an auth secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Deploying to Vercel

Add every required variable in **Settings → Environment Variables** (for
Production, Preview and Development), then deploy. The build fails fast with a
clear message if the database variables are missing.

If public pages render empty, the database was unreachable at build time —
reads fall back to empty content rather than failing the deploy. Run
`npm run check` locally to confirm the credentials.

## Keeping the database awake

Managed MySQL plans suspend the service when idle, and waking it costs the
first visitor several seconds. Two layers prevent that:

- **In-process timer** — pings every 5s while the server runs
  (`src/lib/keepalive.ts`, started from `src/instrumentation.ts`). Effective on
  a long-running server; on serverless the process freezes between requests.
- **Browser pinger** — `src/components/site/KeepAlive.tsx` calls
  `/api/keepalive` every 5s from any open tab, pausing when the tab is hidden.
  This is what actually works on Vercel.

With nobody on the site, neither layer runs. If the service still idles out,
point a free uptime monitor (UptimeRobot, Better Stack) at
`https://your-domain/api/keepalive` every 5 minutes.

---

## Design system

- **Palette** — void `#050507`, bone `#F2F0EB`, acid lime `#C8FF00`,
  ultraviolet `#6B2BFF`, smoke `#8A8694`
- **Type** — Chakra Petch (display, echoes the logo's clipped corners),
  Archivo (body), Space Mono (data/labels)
- **Signature** — the scroll "frequency spine" on the right edge: fill tracks
  progress, bar amplitude tracks scroll velocity

Tokens live in `src/app/globals.css` under `@theme`.

## Motion

Reusable primitives in `src/components/motion/`:

`SmoothScroll` (Lenis) · `RevealProvider` (one IntersectionObserver for all
scroll reveals) · `Cursor` · `Magnetic` · `Parallax` · `TiltCard` · `Marquee` ·
`Counter` · `ScrollSpine` · `Preloader`

Add a scroll reveal to anything with `data-reveal="up|fade|left|right|scale"`.
Wrap a group in `data-reveal-group data-stagger="90"` to cascade its children.

Mobile keeps the full animation set — reveals, parallax, marquees, the menu
sequence. Only pointer-specific effects (custom cursor, magnetic pull, 3D tilt)
are desktop-only, since they have no touch equivalent.
`prefers-reduced-motion` disables motion everywhere.

---

## Scripts

```bash
npm run dev        # dev server
npm run build      # production build
npm run start      # serve the build
npm run lint       # eslint
npm run db:setup   # apply schema + seed
npm run check      # verify config can reach the database
```

---

Developed by **LankaNova Digital Solutions**
