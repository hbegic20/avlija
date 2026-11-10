# Avlija

Real estate listings for Bugojno and Srednjobosanski kanton. Next.js 16 (App Router), Tailwind CSS v4, Supabase.

Project rules and conventions are in [CLAUDE.md](CLAUDE.md). The build plan, schema and design system are in [docs/](docs/).

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values from Supabase → Project Settings → API Keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_...`)
   - `SUPABASE_SECRET_KEY` (`sb_secret_...`, server only)
   - `NEXT_PUBLIC_ALLOW_INDEXING` (optional): `true` only on the real domain at launch, see [Search engine indexing](#search-engine-indexing)
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

## Auth on a hosted project (demo or production)

`supabase/config.toml` holds the dev settings and has `site_url = "http://localhost:3000"`, so never run `npx supabase config push` against a demo or production project: every email link would point to localhost. Set these by hand in that project's dashboard instead.

**Authentication → URL Configuration**
- Site URL: the public address, e.g. `https://<app>.vercel.app`
- Redirect URLs: `https://<app>.vercel.app/**` (every auth email returns to `/auth/callback?next=…`; without this entry Supabase falls back to the Site URL and the email links break)

**Authentication → Sign In / Providers → Email**
- Confirm email: on
- Secure email change: on
- Minimum password length: `8`, password requirements: letters and digits

**Authentication → Emails → SMTP Settings** (the built-in sender only delivers to members of the Supabase team, 2 emails per hour)
- Without a domain (demo): a dedicated Gmail account with 2-Step Verification and an app password. Host `smtp.gmail.com`, port `465`, username and sender = the Gmail address, password = the app password, sender name `Avlija`. Gmail allows about 500 emails per day
- With a domain: Resend (`smtp.resend.com`, port `465`, username `resend`, password = an API key with sending access), sender `noreply@<domain>`, domain verified with its DKIM, SPF and DMARC records

**Authentication → Emails → Templates** (only editable once custom SMTP is saved): paste the whole HTML file into each template

| Template | Subject | File |
|---|---|---|
| Confirm signup | `Avlija: potvrdite email adresu` | `supabase/templates/confirmation.html` |
| Reset password | `Avlija: postavite novu lozinku` | `supabase/templates/recovery.html` |
| Change email address | `Avlija: potvrdite novu email adresu` | `supabase/templates/email-change.html` |

**Authentication → Rate Limits**
- Emails sent per hour: `30`

**Test:** register with an address that is not on the Supabase team, confirm from the email (check it is not in spam), then try "Zaboravljena lozinka" and an email change in Profil.

## Search engine indexing

`NEXT_PUBLIC_ALLOW_INDEXING` controls whether search engines may index the site. Without it (local, demo on `*.vercel.app`) `robots.txt` disallows everything and every response carries `X-Robots-Tag: noindex, nofollow`, so test listings never end up in Google. Set it to `true` only on the real domain at launch, then submit `sitemap.xml` in Google Search Console. It is read at build time, so redeploy after changing it.

## GitHub Actions

Three workflows in `.github/workflows/`:

| Workflow | When | What |
|---|---|---|
| `ci.yml` | every push and pull request to `main` | `next typegen`, `npm run typecheck`, `npm run lint` (Vercel builds but does not lint) |
| `database-backup.yml` | daily 02:23 UTC, or by hand (Actions → Run workflow) | dumps roles, schema and data (`public`, `auth`, `storage` metadata) of the hosted project, encrypts the archive and keeps it as an artifact for 30 days |
| `keep-alive.yml` | daily 06:41 UTC, or by hand | reads one municipality through the API so the free Supabase project is not paused after 7 idle days |

Repository secrets (Settings → Secrets and variables → Actions), all for the hosted demo or production project, never dev:

- `SUPABASE_DB_URL`: Connect → **Session pooler** connection string (GitHub runners have no IPv6, the direct connection does not work), with the database password filled in and percent-encoded
- `BACKUP_PASSPHRASE`: a long random passphrase. Keep it in a password manager: without it the backups cannot be opened
- `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`: the project URL and publishable key

The repository is public, and artifacts of a public repository can be downloaded by any signed-in GitHub user, so the dump is only uploaded encrypted (AES-256, PBKDF2). GitHub disables scheduled workflows in a public repository after 60 days without commits and sends an email; re-enable them under Actions.

Photos in Storage are not part of the backup, only their metadata rows.

### Restoring a backup

1. Actions → Database backup → a run → download the artifact and unzip it
2. Decrypt and unpack (asks for `BACKUP_PASSPHRASE`):
   ```
   mkdir restore
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -md sha256 -in avlija-db-YYYY-MM-DD.tar.gz.enc | tar -xzf - -C restore
   ```
3. Restore into an empty Supabase project with `psql` (`brew install libpq`):
   ```
   cd restore
   psql --single-transaction --variable ON_ERROR_STOP=1 --file roles.sql --file schema.sql --command 'SET session_replication_role = replica' --file data.sql --dbname "<session pooler connection string>"
   ```

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
