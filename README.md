# Avlija

Real estate listings for Bugojno and Srednjobosanski kanton. Next.js 16 (App Router), Tailwind CSS v4, Supabase.

Project rules and conventions are in [CLAUDE.md](CLAUDE.md). The build plan, schema and design system are in [docs/](docs/).

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values from Supabase → Project Settings → API Keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`)
   - `SUPABASE_SECRET_KEY` (`sb_secret_...`, server only)
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

Admins can open `/admin` (reports queue, hiding listings, users). The `role` column cannot be changed through the API, so promote an account once with SQL.

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

4. Log out and back in. The account menu now shows **Administracija**.

To remove admin rights, run the same `update` with `role = 'user'`.
