# Avlija — nekretnine Bugojno i SBK

Real estate listing web app for Bugojno and Središnja Bosna Canton (12 municipalities). Private sellers post properties for sale; buyers browse, filter, view on a map and contact the seller directly.

Working name: **Avlija**. Replace everywhere if the name changes.

## Hard rules (never break these)

1. **NEVER commit, push or change git state.** No `git commit`, `git push`, `git merge`, `git rebase`, `git reset`, `git stash`, `git checkout <branch>`, `git switch`, no new branches. Read-only git (`git status`, `git diff`, `git log`) is fine. The owner reviews and commits everything by hand. When a piece of work is done, stop and summarize the changed files instead.
2. **NO comments in code.** No `//`, no `/* */`, no `{/* */}` in JSX, no JSDoc, no `--` in SQL, no commented-out code, no TODO notes. This applies to every file type except Markdown. Make code self-explanatory with clear names, small functions and precise types instead. If something truly needs explaining, put it in the relevant `docs/` file.
3. **Never expose secrets.** `SUPABASE_SECRET_KEY` (`sb_secret_...`) is only used in server-only files that import `server-only`. Never read or print `.env*` files. Client code uses only `NEXT_PUBLIC_*` variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Do not use the legacy `anon` / `service_role` key names.
4. **Every table has Row Level Security.** A migration that creates a table must also `enable row level security` and add its policies. No table is ever left open.
5. **Design comes only from `docs/DESIGN.md`.** Use only the tokens defined there. No new colors, fonts, shadows, gradients or border radii. If a design need is not covered, ask before inventing.

## Stack

- Next.js 16 or newer, App Router, TypeScript `strict`. Request interception lives in `src/proxy.ts` exporting `proxy`. Never create `middleware.ts`: it is deprecated since Next.js 16.
- Tailwind CSS v4 with tokens defined in `src/app/globals.css` via `@theme`
- Supabase: Postgres, Auth, Storage, accessed through `@supabase/ssr`
- Zod for every form and server action input, `react-hook-form` for forms
- `react-leaflet` + OpenStreetMap tiles for maps
- `browser-image-compression` before every photo upload
- Hosting: Vercel. Package manager: npm

## Commands

- `npm run dev` — local server
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run build` — production build
- `npx supabase migration new <name>` — new migration file
- `npx supabase db push` — apply migrations
- `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts` — regenerate types after every schema change

After finishing any task, run `npm run typecheck` and `npm run lint` and fix all errors before reporting done.

## Project structure

```
src/
  proxy.ts               session refresh and route guards
  app/
    (public)/            home, listings, listing detail, municipality pages, seller pages
    (auth)/              prijava, registracija, zaboravljena-lozinka, nova-lozinka
    (dashboard)/moj-racun/  my listings, new listing, edit listing, favorites, profile
    admin/               moderation (admin role only)
    auth/callback/       Supabase auth code exchange route
  components/
    ui/                  design system primitives (Button, Input, Stamp, DataRow, ...)
    listings/            listing-specific components
    map/                 Leaflet components (client only, dynamic import, ssr: false)
  lib/
    supabase/            client.ts, server.ts, admin.ts, session.ts, database.types.ts
    validation/          Zod schemas, one file per domain
    format/              formatKM, formatArea, formatDate
    i18n/bs.ts           all user-facing strings
  actions/               server actions, one file per domain
supabase/migrations/     SQL migrations
docs/                    PLAN.md, DESIGN.md, SCHEMA.md
docs/mockups/            screen mockups (PNG), the visual target for each page
```

## Conventions

- Server Components by default. Add `"use client"` only for interactivity, maps, and forms.
- Mutations go through Server Actions in `src/actions/`. Every action validates input with Zod, checks the user with `supabase.auth.getClaims()`, and returns `{ ok: true, data } | { ok: false, error }`. Never throw to the client.
- Read data in Server Components with the server Supabase client. No client-side fetching for initial page data.
- Filter and sort state lives in URL search params so results are shareable and indexable.
- Protect pages, actions and the proxy with `supabase.auth.getClaims()`. Never trust `getSession()` in server code. Use `getUser()` only when a fresh user record is needed (e.g. current email on the profile page).
- Prices are stored as integers in KM. Always display them with `formatKM`.
- File names: kebab-case. Components: PascalCase named exports. No default exports except Next.js route files.
- Code identifiers in English. User-facing text in Bosnian, ijekavica, Latin script, kept in `src/lib/i18n/bs.ts`, never hardcoded inline.
- Route segments in Bosnian (`/nekretnine`, `/moj-racun`, `/prijava`) for SEO.
- Never edit an existing migration. Create a new one.
- Ask before adding a dependency not listed under Stack.

## Workflow

- Work through `docs/PLAN.md` one phase at a time, in order.
- Before starting a phase, read its section plus the parts of `docs/SCHEMA.md` and `docs/DESIGN.md` it touches, and look at the matching image in `docs/mockups/` if one exists.
- Never run `git init`. The owner manages the repository.
- Tick checkboxes in `docs/PLAN.md` as items are completed.
- At the end of a phase: run checks, list changed files, describe how to test it manually, then stop and wait. Do not commit.

## Reference docs

- `docs/PLAN.md` — every feature, phase by phase, with acceptance criteria
- `docs/SCHEMA.md` — database tables, RLS policies, storage, triggers
- `docs/DESIGN.md` — the "Katastar" design system: tokens, type, components, anti-patterns
- `docs/mockups/` — approved screen mockups. Match their layout; when a mockup and DESIGN.md disagree, DESIGN.md wins.
