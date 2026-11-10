# Avlija

Real estate listings for Bugojno and Srednjobosanski kanton. Next.js 16 (App Router), Tailwind CSS v4, Supabase.

Project rules and conventions are in [CLAUDE.md](CLAUDE.md). The build plan, schema and design system are in [docs/](docs/).

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values from Supabase → Project Settings → API Keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`)
   - `SUPABASE_SECRET_KEY` (`sb_secret_...`, server only)
   - `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` (optional): set to `true` only after the Google provider is enabled in Supabase (see `docs/PLAN.md`, Phase 3). Without it the "Nastavi s Google" button is hidden
3. Log in and link the Supabase CLI: `npx supabase login`, then `npx supabase link --project-ref <ref>`
4. Apply migrations: `npx supabase db push`
5. Start the dev server: `npm run dev`

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint plus the no-comments check (`scripts/check-comments.mjs`) |
| `npm run test:rls` | Row Level Security checks against the linked project (needs `SUPABASE_SECRET_KEY`; creates and deletes two test users) |
| `npx supabase db push` | Apply new migrations |
| `npx supabase config push` | Push auth settings from `supabase/config.toml` |
| `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts` | Regenerate database types after a schema change |

## Making an account admin

Admins can open `/admin` (reports queue, hiding listings, users). The `role` column cannot be changed through the API.

### Automatic: the admin email list

Emails in `public.admin_emails()` (migration `promote_listed_admins`) become admin automatically as soon as the account's email is confirmed, including on a fresh production database: deploy, register with that email, click the confirmation link, refresh. An unconfirmed account is never promoted, so registering someone else's email does not grant anything. The list only promotes; it never demotes.

To change the list, add a new migration that replaces the function (never edit an applied migration):

```sql
create or replace function public.admin_emails()
returns text[]
language sql
immutable
set search_path = ''
as $$ select array['prvi@primjer.ba', 'drugi@primjer.ba'] $$;
```

### From the admin area

An admin can open `/admin/korisnici` and use **Postavi za admina** or **Ukloni admina** on any other user (database function `set_user_role`). Admins cannot remove their own rights, and accounts on the admin email list cannot be demoted there. No SQL, migration or deploy is needed.

### Manual: one-off SQL

For an account not on the list, when nobody can log in as admin yet:

1. Register and confirm the account in the app.
2. In Supabase → SQL Editor, run (replace the email):

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'vas-email@primjer.ba');
```

3. Check it worked:

```sql
select p.full_name, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
```

4. Refresh the page. The account menu now shows **Administracija**.

To remove admin rights, run the same `update` with `role = 'user'`. If the email is on the admin list, also remove it from `admin_emails()` in a new migration, or the account is promoted again the next time its email is confirmed or changed.
