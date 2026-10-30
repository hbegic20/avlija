# Build plan

Work one phase at a time, top to bottom. Tick boxes as items are done. At the end of each phase: run `npm run typecheck` and `npm run lint`, list changed files, explain how to test manually, then stop. Never commit.

## Route map

| Route | Access | Purpose |
|---|---|---|
| `/` | public | Home: canton map illustration, search form, latest listings, municipality links |
| `/nekretnine` | public | All listings with filters, sort, pagination, grid/map toggle |
| `/nekretnine/[opcina]` | public | Same list pre-filtered by municipality, own SEO title |
| `/oglas/[number]-[slug]` | public | Listing detail |
| `/prodavac/[id]` | public | Seller's public profile and their active listings |
| `/prijava` | guest | Log in |
| `/registracija` | guest | Register |
| `/zaboravljena-lozinka` | guest | Request password reset email |
| `/nova-lozinka` | via email link | Set new password |
| `/auth/callback` | system | Exchanges auth code for session, then redirects |
| `/moj-racun` | user | Dashboard overview |
| `/moj-racun/oglasi` | user | My listings |
| `/moj-racun/oglasi/novi` | user | New listing wizard |
| `/moj-racun/oglasi/[id]/uredi` | owner | Edit listing |
| `/moj-racun/sacuvano` | user | Favourites |
| `/moj-racun/profil` | user | Profile, contact info, password, delete account |
| `/admin` | admin | Moderation overview |
| `/admin/prijave` | admin | Reports queue |
| `/admin/oglasi` | admin | All listings, hide/unhide |
| `/uslovi-koristenja`, `/privatnost`, `/kontakt` | public | Legal and contact |

---

## Phase 0 — Project setup

- [x] Scaffold Next.js in a temporary folder, because `create-next-app` refuses a folder that already has CLAUDE.md and docs: `npx create-next-app@latest avlija-tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --disable-git --yes`. `--disable-git` is required, otherwise it creates a commit. Move everything from `avlija-tmp` (including dotfiles) into the project root without overwriting existing files, then ask the owner to delete the empty `avlija-tmp` folder
- [x] Confirm `.gitignore` contains `.env*` and `!.env.example`
- [x] Add scripts `typecheck` (`tsc --noEmit`) to package.json
- [x] Install: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `leaflet`, `react-leaflet`, `@types/leaflet`, `browser-image-compression`, `server-only`
- [x] Install Supabase CLI as dev dependency, run `npx supabase init`
- [x] Link to the project: owner runs `npx supabase login`, then `npx supabase link --project-ref <ref>`
- [x] Create `.env.example`
- [ ] Create `.env.local` from `.env.example` (owner fills in values from Supabase → Project Settings → API Keys: the publishable key and a secret key)
- [x] Create folder structure from CLAUDE.md
- [x] Add ESLint rules `no-warning-comments` (error) and `react/jsx-no-comment-textnodes` (error)
- [x] Add `scripts/check-comments.mjs` that scans `src/`, `scripts/`, root config files and `supabase/migrations/` and fails on any comment: `//` and `/* */` (including JSX `{/* */}`) in TS/JS via the TypeScript parser, `/* */` in CSS, `--` and `/* */` in SQL. Strings, URLs, regexes, CSS custom properties (`--color-*`) and `i--` are not flagged. The generated `database.types.ts` is skipped. Added to `npm run lint`

Done when: `npm run dev` shows a blank page with no errors, typecheck and lint pass.

## Phase 1 — Design system foundation

- [x] Load Fraunces, Schibsted Grotesk, JetBrains Mono via `next/font/google` with `latin-ext`, expose as CSS variables
- [x] Put tokens from DESIGN.md §10 into `globals.css`, set body `bg-papir text-tinta font-sans`
- [x] Build primitives in `src/components/ui/`: Button, Input, Textarea, Select, Checkbox, Radio, SegmentedControl, Tag, Stamp, DataRow, Ledger, PriceTag, Dialog, Toast (with provider), Skeleton, EmptyState, Pagination, Stepper
- [x] `src/lib/format/`: `formatKM`, `formatArea`, `formatDate`, `formatListingNumber` using `bs-BA` locale
- [x] `src/lib/i18n/bs.ts` with base strings and all enum labels
- [x] Theme: light/dark tokens and `@custom-variant dark` from DESIGN.md §10; an inline `<head>` script reads the `theme` cookie before first paint and sets `data-theme` on `<html>` (reading `cookies()` in the root layout would make every route dynamic under `cacheComponents`); `ThemeSwitcher` (Svijetla / Tamna; follows the device until the user chooses) writes the cookie and switches instantly
- [x] Layout shell: header (coordinates strip, logo wordmark in Fraunces, nav: Nekretnine, Prijava / account menu, ThemeSwitcher, Objavi oglas), footer (municipality links, legal links); on mobile the ThemeSwitcher sits in the menu sheet
- [x] Dev-only page `/dizajn` showing every component in every state (removed from production via `notFound()` when `NODE_ENV === 'production'`)

Done when: `/dizajn` matches `docs/design-preview.html` in spirit, both theme choices work and survive a reload with no flash of the wrong theme, keyboard focus is visible everywhere.

## Phase 2 — Database

- [x] Migration: enums
- [x] Migration: `municipalities` + seed of 12 rows
- [x] Migration: `unaccent` extension and `immutable_unaccent()` (must exist before `listings`)
- [x] Migration: `profiles`, `profile_contacts`, `is_admin()`, `handle_new_user()` trigger, `set_updated_at()`
- [x] Migration: `listings` + indexes + triggers `listings_10_protect` (`protect_listing_columns`), `listings_20_lifecycle` (`set_listing_lifecycle`), `enforce_listing_limits`, `set_updated_at`
- [x] Migration: `listing_images` + image limit trigger
- [x] Migration: `favorites`, `reports`
- [x] Migration: RPCs `increment_listing_view`, `get_seller_contact`, `renew_listing`
- [x] Migration: storage buckets and policies
- [x] Migration: `pg_cron` job for `archive_expired_listings`
- [x] Generate types
- [x] Supabase clients: `lib/supabase/client.ts` (browser, publishable key), `server.ts` (server components and actions, cookie-based), `admin.ts` (secret key, `server-only`), `session.ts` (session refresh helper called from `src/proxy.ts`)

Done when: all migrations apply cleanly, a manual SQL test confirms an anonymous user cannot read drafts, cannot read `profile_contacts`, and cannot write anything.

## Phase 3 — Authentication

Supabase Auth with email + password and Google OAuth.

- [x] `src/proxy.ts` (Next.js 16 replacement for middleware, export named `proxy`): refreshes session on every request with `getClaims()`, redirects guests from `/moj-racun/*` and `/admin/*` to `/prijava?next=<path>`, redirects logged-in users away from `/prijava` and `/registracija`
- [x] `/registracija`: fields Ime i prezime, Email, Lozinka (min 8, at least one number), Potvrda lozinke, checkbox "Prihvatam uslove korištenja i politiku privatnosti" (links). Server action `signUp` with `full_name` in user metadata and `emailRedirectTo` `/auth/callback?next=/moj-racun`
- [x] After sign-up: screen "Provjerite email" showing the address, with a "Pošalji ponovo" button (60s cooldown)
- [x] `/auth/callback` route handler: `exchangeCodeForSession`, then redirect to a safe `next` (only relative paths allowed)
- [x] `/prijava`: email + password, "Zapamti me" not needed (Supabase persists), link to registration and forgotten password, "Nastavi s Google" button, preserves `next`
- [x] Clear error messages in Bosnian for: wrong credentials, email not confirmed (offer resend), too many attempts, network error
- [x] `/zaboravljena-lozinka`: email field, always shows the same success message whether or not the email exists
- [x] `/nova-lozinka`: new password + confirm, then sign out other sessions and redirect to `/prijava` with success toast
- [ ] Google OAuth: `signInWithOAuth` with redirect to `/auth/callback`; full name taken from Google metadata
- [x] Logout action in account menu
- [x] Header shows account menu with avatar initials when logged in
- [x] Configure Supabase via `supabase/config.toml` + `npx supabase config push`: site URL, localhost redirect URLs, min 8 chars with letters and digits, confirmations on, 60s resend interval
- [ ] Google OAuth: owner creates OAuth client in Google Cloud, enables the Google provider in Supabase (Authentication → Sign In / Providers) with redirect `https://<ref>.supabase.co/auth/v1/callback`
- [ ] Bosnian email templates (`supabase/templates/`, token-hash links to `/auth/callback`): blocked on the free plan until custom SMTP is set up in Phase 13; add the `[auth.email.template.*]` blocks back to `config.toml` then and push

Done when: full flows work end to end — register → confirm email → land on dashboard; login with wrong password shows error; reset password works; Google login works; protected routes redirect and return to the original page after login.

## Phase 4 — Profile

- [x] `/moj-racun/profil` with three sections in a Ledger style layout:
  - Osnovni podaci: full name, municipality, avatar upload (crop to square, compress)
  - Kontakt: phone, "Imam Viber", "Imam WhatsApp". Helper text: "Broj je vidljiv samo prijavljenim korisnicima."
  - Sigurnost: change password (current + new), change email (sends confirmation)
- [x] Delete account: Dialog requiring the user to type `OBRIŠI`; server action deletes storage folders and the auth user via admin client
- [x] Publishing a listing is blocked until a phone number is set: enforced by the publish trigger (`PHONE_REQUIRED`), `hasPhone()` helper and `PhoneRequiredNotice` (links to `/moj-racun/profil#kontakt`) ready for the Phase 5 publish step

Done when: profile edits persist, avatar shows in header, deleted account removes all their data and listings.

## Phase 5 — Create and edit listing

Wizard at `/moj-racun/oglasi/novi` using Stepper. A draft row is created on step 1 so progress is saved; every step saves on "Dalje".

- [x] Step 01 Osnovno: property type (SegmentedControl with icons), title, price in KM with "Cijena po dogovoru" checkbox, description (counter 0/5000)
- [x] Step 02 Lokacija: municipality select, naselje, address (optional), checkbox "Prikaži tačnu lokaciju" (otherwise shown as approximate circle of ~300m). `LocationPicker` map component:
  - Centres on the chosen municipality and re-centres when it changes
  - Click or tap places the square pin; the pin is draggable; arrow keys move it when focused
  - "Koristi moju lokaciju" button (browser geolocation, only on click, with a clear error if denied)
  - Coordinates shown live in mono under the map (`44.0612° N · 17.4467° E`)
  - Rejects a point outside the chosen municipality's area with an inline error (real OSM boundaries from `src/lib/geo/sbk-boundaries.ts`, 150 m border tolerance, checked again in the server action)
  - Saves `lat` / `lng` with the step; required to publish
- [x] Step 03 Detalji: fields shown depend on type (see SCHEMA field rules): area, land area, rooms, bathrooms, floor / total floors, year built, heating, condition, Uknjiženo da/ne, građevinska / upotrebna dozvola, features checklist grouped
- [x] Step 04 Fotografije: drag-and-drop and mobile camera input, client compression to WebP, parallel upload with per-file progress, reorder by drag (plus move/cover buttons for keyboard and touch), set cover, delete; min 1, max 20
- [x] Step 05 Pregled: renders the listing exactly as the public detail page will look, with "Objavi oglas" and "Sačuvaj kao nacrt"
- [x] Zod schema per step plus a full `publishListingSchema` (discriminated by type) used on publish
- [x] Edit page reuses the wizard with all steps unlocked
- [x] Unsaved-changes warning on leaving the page

Done when: a user can create, publish and edit each property type; validation rules per type work; images upload, reorder and appear in the right order.

## Phase 6 — Browse and search

- [x] Home page `/`: hero with search form, interactive canton map, latest 8 listings, municipality grid with listing counts, "Kako objaviti oglas" and seller call-to-action
- [x] `CantonMap` (interactive SVG, not Leaflet):
  - Municipality outlines from real OpenStreetMap boundaries: already generated in Phase 5 by `scripts/generate-municipality-boundaries.mjs` into `src/lib/geo/sbk-boundaries.ts` (lng/lat polygons); derive the SVG paths from those
  - Each municipality is an `<a>` to `/nekretnine/[opcina]` with `aria-label="Bugojno, 86 oglasa"`, reachable with Tab
  - Hover or focus fills it with `crijep` at low opacity and shows the name and active listing count in a small mono label
  - Changing the hero form's municipality highlights it on the map, and clicking the map sets the form's municipality
  - Counts come from one cached query (revalidated every 10 minutes)
  - On mobile it is smaller, below the search form, and a tap goes straight to the municipality page
- [x] `/nekretnine` server-rendered list, 24 per page
- [x] Filters (in URL params): municipality (multi), type (multi), price from/to, area from/to, land area from/to, rooms min, Uknjiženo only, features, text search (uses `search` tsvector; pass the query through `immutable_unaccent` so `cipuljic` finds `Čipuljić`), "Samo s fotografijama" is implicit
- [x] Sort: Najnovije, Najjeftinije, Najskuplje, Cijena po m², Najveća površina
- [x] Results header: count in mono, active filter Tags with remove, "Očisti sve"
- [x] Grid view (sheet grid of ListingCards) and Map view (split: list left, muted Leaflet map right with square pins, clustering when zoomed out, hovering a row highlights its pin). Clustering is a small built-in grid clusterer, no extra dependency
- [x] Mobile: filter sheet, map view full screen with bottom carousel
- [x] `/nekretnine/[opcina]` pages with municipality name in title and intro line
- [x] Empty state with suggestion to widen filters
- [x] Sold listings excluded by default, toggle "Prikaži i prodane"

Done when: every filter combination produces correct results, URL can be shared and reproduces the same view, pages load fast on mobile.

## Phase 7 — Listing detail

- [x] `/oglas/[number]-[slug]` with canonical URL redirect if slug differs (real 308, and real 404 for missing listings via `export const instant = false`), plus public seller page `/prodavac/[id]`
- [x] Gallery with lightbox
- [x] Header block: parcel number, location line, title, PriceTag with price per m², Stamp (UKNJIŽENO / PRODANO / NOVO for first 7 days)
- [x] Ledger sections: Osnovni podaci, Zgrada i stanje, Dokumentacija, Opremljenost
- [x] Description with preserved line breaks
- [x] Location map (pin or approximate circle): pan and zoom allowed, scroll-wheel zoom only after a click so the page still scrolls, "Otvori u Google Maps" link (only for exact locations)
- [x] Seller box: name, avatar, "Član od", link to seller page. "Prikaži broj telefona" button: guests are sent to login; logged-in users get number via `get_seller_contact`, plus "Pozovi", "Viber", "WhatsApp" deep links (`tel:`, `viber://chat?number=`, `https://wa.me/`) with a prefilled message containing the listing number
- [x] Favourite toggle, Share (native share on mobile, copy link on desktop). Guests are sent to login; adding the favourite after login is Phase 9
- [x] "Prijavi oglas" Dialog with reason radios and details
- [x] Views counter incremented once per browser session
- [x] Slični oglasi: same municipality and type, closest price, 4 items
- [x] Owner sees an owner bar: Uredi, Označi kao prodano, Arhiviraj

Done when: detail page is complete for every type, contact reveal works only when logged in, reports are saved.

## Phase 8 — My listings dashboard

- [x] `/moj-racun` overview: counts by status, total views, prompt to complete profile
- [x] `/moj-racun/oglasi`: tabs Aktivni, Nacrti, Prodani, Arhivirani, Skriveni; ListingRow with views, published date, expiry ("Ističe za 12 dana" with ISTIČE stamp under 7 days)
- [x] Actions: Uredi, Označi kao prodano, Arhiviraj, Obnovi (calls the `renew_listing` RPC: extends expiry by 90 days, allowed in last 14 days or when archived), Obriši (confirm dialog, deletes images)
- [x] Hidden listings show the admin's `hidden_reason`

Done when: all lifecycle transitions work and respect limits (10 active).

## Phase 9 — Favourites

- [x] Heart toggle on cards and detail page with optimistic update; guests are sent to login and the favourite is added after login
- [x] `/moj-racun/sacuvano` grid, sold listings shown with PRODANO stamp, removed listings disappear

## Phase 10 — Admin and moderation

- [x] `/admin` guarded by `is_admin()` server-side check
- [x] Reports queue: listing preview, reason, details, reporter, actions Sakrij oglas (with reason, sets `hidden`), Odbaci prijavu, Riješeno
- [x] All listings table with search by number or title, filter by status, hide/unhide
- [x] Users list with listing counts, ability to hide all listings of a user
- [x] Make the owner's account admin via a one-off SQL statement documented in README (README rewritten with setup, commands and the admin SQL)

## Phase 11 — SEO and sharing

- [x] `generateMetadata` for all public pages, Bosnian titles like `Kuća, 140 m², Bugojno — 185.000 KM | Avlija`
- [x] Dynamic Open Graph image per listing (`opengraph-image.tsx`) in Katastar style: parcel number, title, price, facts, stamp, municipality outline with pin. Site-wide OG image with the canton map
- [ ] Cover photo in the listing OG image: Satori cannot decode WebP, needs `sharp` (already installed by Next) added as a direct dependency to convert the cover to PNG/JPEG
- [x] `sitemap.ts` with active listings and municipality pages, `robots.ts`
- [x] JSON-LD `RealEstateListing` / `Offer` on detail pages
- [x] Sold listings keep their URL with PRODANO stamp for 30 days, then return 410 (checked in `src/proxy.ts`)

## Phase 12 — Trust, legal and polish

- [x] `/uslovi-koristenja`, `/privatnost` (BiH Zakon o zaštiti ličnih podataka), `/kontakt`. Operator name and email from `NEXT_PUBLIC_OPERATOR_NAME` / `NEXT_PUBLIC_CONTACT_EMAIL`; texts are a draft for legal review
- [x] Minimal cookie notice only if analytics are added (no analytics, only necessary cookies: not needed)
- [x] `not-found.tsx` "Parcela nije pronađena", `error.tsx` + `global-error.tsx`, loading states with hatch skeletons on every route
- [x] Accessibility pass: labels, focus order, skip link, alt text (generated from type + municipality), contrast in both themes (two token issues reported: `upozorenje` text 3.56:1 and `tinta-3` 2.95:1 in light)
- [x] Performance pass: `next/image` everywhere with `sizes` (Next optimizer; Supabase image transformations need a paid plan), detail map loaded only when near the viewport
- [x] Rate limiting on sign-up (Supabase `sign_in_sign_ups` 30 per 5 min per IP), reports (10 per day) and contact reveal (30 per hour) via database counters

## Status and open items (2026-10-30)

Phases 0–12 are built. Phase 13 (deploy) has not started. Before deploying, work through this list top to bottom.

### Before deploy
- [ ] Add `SUPABASE_SECRET_KEY` to `.env.local`, then run `npm run test:rls` (never run yet) and a full logged-in walk: profile setup, listing wizard, dashboard, favourites, admin. Logged-in pages have only been tested by the owner by hand
- [ ] Migration: block deleting the last image of an active listing (today the publish rule is only checked when a listing becomes active)
- [ ] Migration: limit `increment_listing_view` so views cannot be inflated by calling the RPC repeatedly
- [ ] Set `NEXT_PUBLIC_OPERATOR_NAME` and `NEXT_PUBLIC_CONTACT_EMAIL`; legal review of `/uslovi-koristenja` and `/privatnost` texts (`src/lib/i18n/legal-bs.ts`)

### Soon after
- [ ] Daily cleanup job: delete drafts untouched for 60 days and their images; remove orphaned files in `listing-images` without a `listing_images` row
- [ ] Cache the 410 lookup in `src/lib/listings/gone-response.ts` (one REST query per `/oglas/...` request today)

### Owner decisions pending
- [ ] Darker `upozorenje` for text contrast (3.56:1 on `papir`; suggested `#8A6114`), and `tinta-3` (2.95:1, placeholders only)
- [ ] Stamp border: 2px as in DESIGN.md (renders solid) or 3px (renders double)
- [ ] Add `sharp` as a direct dependency for the cover photo in listing OG images (Satori cannot decode WebP)
- [ ] Google OAuth: create the Google Cloud client and enable the provider in Supabase
- [ ] Production plan: Supabase Pro (free plan pauses after a week idle, no backups), error monitoring (e.g. Sentry), unit tests (e.g. Vitest); each needs approval

## Phase 13 — Deploy

- [ ] Separate Supabase project for production, apply migrations
- [ ] Custom SMTP for auth emails (e.g. Resend) since Supabase's built-in email is rate-limited; then push the Bosnian templates from `supabase/templates/` (see Phase 3)
- [ ] Vercel project, env vars, custom domain, update Supabase redirect URLs and Google OAuth origins
- [ ] Smoke test all flows on production

## Later (not now)

- Saved searches with email alerts for new matching listings
- In-app messaging between buyer and seller
- Rentals (`najam`) as a second offer type
- Agency accounts with multiple agents
- Price history and "cijena snižena" badge
- Expanding to neighbouring cantons
