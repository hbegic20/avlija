# Database schema

Postgres on Supabase. Every table has RLS enabled. Migrations live in `supabase/migrations/` and are created in the order below. SQL in migrations must contain no comments (see CLAUDE.md).

## Overview

| Table | Purpose |
|---|---|
| `municipalities` | The 12 SBK municipalities, with slug and map centre. Seeded, read-only. |
| `profiles` | Public seller profile, 1:1 with `auth.users`. |
| `profile_contacts` | Phone, Viber, WhatsApp. Readable only by the owner (and admins); other users get a seller's number only through `get_seller_contact`. |
| `listings` | Property listings. |
| `listing_images` | Photos per listing, ordered. |
| `favorites` | Saved listings per user. |
| `reports` | Users reporting fake or wrong listings. |
| `listing_views` | One row per listing, visitor and day (`visitor_hash` is an HMAC of the user id, or of IP and user agent for guests). RLS on, no policies, no grants: only `increment_listing_view` writes it, and `prune_listing_views` deletes rows older than yesterday every night. |
| `contact_reveals` | Log of phone reveals, used only for rate limiting. RLS on, no policies, no grants: only `get_seller_contact` (security definer) reads and writes it. |
| `ai_suggestions` | Log of AI listing-text suggestions (`user_id`, `created_at`, random `release_token`), used only for the daily limit. RLS on, no policies, no grants: only `claim_ai_suggestion` (security definer) reads and writes it. |

Storage buckets: `listing-images` (public read), `avatars` (public read).

## Enums

```sql
create type user_role as enum ('user', 'admin');
create type property_type as enum ('stan', 'kuca', 'plac', 'poljoprivredno', 'vikendica', 'poslovni_prostor', 'garaza');
create type listing_status as enum ('draft', 'active', 'sold', 'archived', 'hidden');
create type heating_type as enum ('centralno', 'etazno', 'struja', 'drva', 'plin', 'toplotna_pumpa', 'nema');
create type property_condition as enum ('novogradnja', 'renovirano', 'useljivo', 'potrebna_adaptacija', 'roh_bau');
create type report_reason as enum ('lazni_oglas', 'prodano', 'netacni_podaci', 'neprimjereno', 'prevara', 'ostalo');
create type report_status as enum ('open', 'resolved', 'dismissed');
```

Display labels for every enum value live in `src/lib/i18n/bs.ts`, e.g. `kuca` → `Kuća`, `roh_bau` → `Roh-bau`.

## Tables

### municipalities

```sql
create table municipalities (
  id smallint primary key,
  slug text unique not null,
  name text not null,
  lat double precision not null,
  lng double precision not null
);
```

Seed with: Bugojno, Busovača, Dobretići, Donji Vakuf, Fojnica, Gornji Vakuf-Uskoplje, Jajce, Kiseljak, Kreševo, Novi Travnik, Travnik, Vitez. Slugs: `bugojno`, `busovaca`, `dobretici`, `donji-vakuf`, `fojnica`, `gornji-vakuf-uskoplje`, `jajce`, `kiseljak`, `kresevo`, `novi-travnik`, `travnik`, `vitez`. Look up each centre coordinate when writing the seed.

RLS: `select` for everyone, no insert/update/delete policies.

### profiles

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  avatar_url text,
  municipality_id smallint references municipalities,
  role user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

RLS:
- `select`: the user's own row, admins, and anyone for sellers who have at least one `active` or `sold` listing. A fully public table would let anyone list every registered user's name with one query (and the sign-up trigger falls back to the email's local part when no name is given).
- `update`: `auth.uid() = id`.
- The `role` column must not be changeable by the user. A column-level `revoke update (role)` does nothing while the table-level grant Supabase gives `authenticated` exists, so revoke the whole grant and give back only the editable columns:
  ```sql
  revoke update on profiles from authenticated, anon;
  grant update (full_name, avatar_url, municipality_id) on profiles to authenticated;
  ```
- No insert policy: rows are created by the `handle_new_user` trigger.

### profile_contacts

```sql
create table profile_contacts (
  profile_id uuid primary key references profiles on delete cascade,
  phone text check (phone ~ '^\+?[0-9 ]{6,20}$'),
  has_viber boolean not null default false,
  has_whatsapp boolean not null default false,
  updated_at timestamptz not null default now()
);
```

RLS:
- `select`: `auth.uid() = profile_id or is_admin()`. Other users never read this table directly; a seller's number is revealed one listing at a time through the `get_seller_contact` RPC, which requires a logged-in user and is the single place to rate-limit contact reveals. A broad `auth.uid() is not null` policy would let any account download every phone number with one query.
- `insert`, `update`: `auth.uid() = profile_id`.

### listings

```sql
create table listings (
  id uuid primary key default gen_random_uuid(),
  number serial unique,
  owner_id uuid not null references profiles on delete cascade,
  status listing_status not null default 'draft',
  type property_type not null,
  title text not null check (char_length(title) between 10 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  price_km integer check (price_km > 0),
  price_negotiable boolean not null default false,
  municipality_id smallint references municipalities,
  neighborhood text check (char_length(neighborhood) <= 80),
  address text check (char_length(address) <= 160),
  lat double precision,
  lng double precision,
  location_precise boolean not null default false,
  area_m2 numeric(8,2) check (area_m2 > 0),
  land_area_m2 numeric(10,2) check (land_area_m2 > 0),
  rooms numeric(3,1) check (rooms >= 0),
  bathrooms smallint check (bathrooms >= 0),
  floor smallint,
  total_floors smallint,
  year_built smallint check (year_built between 1800 and 2100),
  heating heating_type,
  condition property_condition,
  is_registered boolean,
  has_building_permit boolean,
  has_usage_permit boolean,
  features text[] not null default '{}',
  view_count integer not null default 0,
  published_at timestamptz,
  expires_at timestamptz,
  sold_at timestamptz,
  hidden_reason text,
  search tsvector generated always as (
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(title, ''))), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(neighborhood, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(description, ''))), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table listings add constraint listings_municipality_required_unless_draft
  check (status = 'draft' or municipality_id is not null);

create index listings_public_idx on listings (status, municipality_id, type, price_km);
create index listings_owner_idx on listings (owner_id);
create index listings_published_idx on listings (published_at desc);
create index listings_search_idx on listings using gin (search);
```

### Public location and derived columns

Generated columns (added in `public_location_and_search`):

- `public_lat`, `public_lng`: equal to `lat`/`lng` when `location_precise`, otherwise the exact point shifted by a fixed, per-listing pseudo-random offset (from `md5(location_seed)`) of up to about ±200 m and rounded to 5 decimals. Public maps draw the 300 m circle around this point, so the true location stays inside the circle but is never its centre. `location_seed` is a random uuid that is not granted to `anon` or `authenticated`; seeding from the public `id` would let anyone recompute the offset and recover the exact point.
- `public_address`: `address` only when `location_precise`, otherwise null.
- `main_area_m2`: `coalesce(area_m2, land_area_m2)`, used for the "Najveća površina" sort.
- `price_per_m2`: `price_km / main_area_m2`, null when there is no price or it is negotiable. Used for the "Cijena po m²" sort and display.

Column privileges: `anon` and `authenticated` can select every `listings` column **except** `lat`, `lng`, `address` and `location_seed`. `previous_price_km` and `price_reduced_at` were added to the grant in `listing_price_history`. The owner (or an admin) reads the exact point through `get_listing_private_location(target_listing_id)`. Any new `listings` column must be added to that `grant select (...)` list in its migration, otherwise the API cannot read it.

Search without diacritics: people type `cipuljic` and expect `Čipuljić`. `unaccent()` is not immutable, so it cannot be used in a generated column directly. Create this before the `listings` table and use it on both the column and the user's search text (`websearch_to_tsquery('simple', public.immutable_unaccent(:q))`):

```sql
create extension if not exists unaccent with schema extensions;

create function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, replace(replace(input, 'đ', 'dj'), 'Đ', 'Dj')) $$;
```

The two `replace` calls map `đ` to `dj`, the way people type it without diacritics, so `djurdjevak` matches `Đurđevak`.

`features` allowed values (validated in Zod, enforced by the `listings_features_known` check constraint, labels in i18n; adding a value needs a migration that replaces the constraint): `balkon`, `terasa`, `lift`, `parking`, `garaza`, `podrum`, `tavan`, `basta`, `bazen`, `klima`, `namjesteno`, `internet`, `alarm`, `pristup_asfaltu`, `struja_na_placu`, `voda_na_placu`, `kanalizacija`.

Field rules per type (enforced in Zod, not in SQL):
- `plac`, `poljoprivredno`: require `land_area_m2`; hide rooms, floor, heating, bathrooms.
- `stan`: require `area_m2`, `floor`; hide `land_area_m2`.
- `kuca`, `vikendica`: require `area_m2`; `land_area_m2` optional.
- `garaza`, `poslovni_prostor`: require `area_m2`.
- A listing can be published only with at least 1 image, a price or `price_negotiable = true`, and `lat`/`lng` set. Zod checks this for good error messages, and the `enforce_listing_publish_requirements` trigger enforces it in the database so the API cannot bypass it.

RLS:
- `select`: `status in ('active', 'sold') or owner_id = auth.uid() or is_admin()`.
- `insert`: `owner_id = auth.uid()` and `status = 'draft'`. A listing always starts as a draft (the wizard creates the draft on step 1) and becomes `active` through an update, which the publish-requirements trigger checks.
- `update` (owner): `using (owner_id = auth.uid() and status <> 'hidden') with check (owner_id = auth.uid() and status <> 'hidden')`. The `using` part is what stops an owner from un-hiding a listing an admin hid; a check alone would let them set it back to `active`.
- `update` (admin): `using (is_admin()) with check (is_admin())`.
- Owners must not be able to edit system columns through the API (e.g. set `expires_at` to 2099 or inflate `view_count`). See the `protect_listing_columns` trigger.
- `delete`: `owner_id = auth.uid() or is_admin()`.

### listing_images

```sql
create table listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (listing_id, position) deferrable initially deferred
);
```

Max 20 images per listing (trigger). Position `0` is the cover image.

RLS:
- `select`: allowed when the parent listing is visible (`exists` subquery with the same rule as listings select).
- `update` (only `position`), `delete`: the parent listing's `owner_id = auth.uid()`.
- `insert`: not granted to `anon` or `authenticated`. New rows go through the `add_listing_image` RPC so the position and the 20-image limit are decided under a lock.
- `authenticated` may update only `position`.
- `prevent_removing_last_active_image` (before delete) raises `LAST_IMAGE` when the row is the last image of an `active` listing. Cascading deletes from a removed listing are not affected.

### listing_price_history

```sql
create table listing_price_history (
  id bigint generated always as identity primary key,
  listing_id uuid not null references listings on delete cascade,
  old_price_km integer,
  new_price_km integer,
  changed_at timestamptz not null default now()
);
```

Written only by the `track_listing_price` trigger. RLS: `select` when the parent listing is visible (same rule as `listing_images`); no insert, update or delete for `anon` or `authenticated`.

### favorites

```sql
create table favorites (
  user_id uuid not null references profiles on delete cascade,
  listing_id uuid not null references listings on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
```

RLS: `select`, `insert`, `delete` only where `user_id = auth.uid()`.

### reports

```sql
create table reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings on delete cascade,
  reporter_id uuid references profiles on delete set null,
  reason report_reason not null,
  details text check (char_length(details) <= 1000),
  status report_status not null default 'open',
  resolved_by uuid references profiles,
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);
```

RLS:
- `insert`: `reporter_id = auth.uid()` (only logged-in users can report, one report per listing per user).
- `select`, `update`: `is_admin()`.

## Functions and triggers

| Name | Type | What it does |
|---|---|---|
| `is_admin()` | `security definer` function, `stable` | Returns true if `profiles.role = 'admin'` for `auth.uid()`. Set `search_path = ''` and use fully qualified names. |
| `set_user_role(target_user_id uuid, new_role user_role)` | `security definer` RPC, `authenticated` only | Admins only (`FORBIDDEN`). Raises `NOT_FOUND` for unknown users, `SELF_DEMOTION` when an admin demotes themselves, and `LISTED_ADMIN` when demoting an account whose email is in `admin_emails()`. The only way to change `profiles.role` through the API. |
| `admin_emails()` | `immutable` SQL function, not callable by `anon` or `authenticated` | Returns the list of emails that are promoted to admin automatically. Change it only with a new migration that replaces the function. |
| `promote_listed_admin()` | trigger `on_auth_user_promote_admin` on `auth.users` after insert or update of `email`, `email_confirmed_at` | `security definer`. Sets `profiles.role = 'admin'` when the email is confirmed and (case-insensitive) in `admin_emails()`. Runs after `on_auth_user_created` (trigger name order), so the profile exists. Never demotes. |
| `handle_new_user()` | trigger on `auth.users` after insert | Creates `profiles` row with `full_name` from `raw_user_meta_data->>'full_name'` (fallback: part of email before `@`) and an empty `profile_contacts` row. `security definer`, `search_path = ''`. |
| `set_updated_at()` | before update trigger | Sets `updated_at = now()` on profiles, profile_contacts, listings. |
| `protect_listing_columns()` | before insert/update trigger on listings, named `listings_10_protect` | Security invoker. Applies only when `current_user` is `authenticated` or `anon` (an API request) and the caller is not an admin, so trusted `security definer` functions (`renew_listing`, `increment_listing_view`) and the cron job can still write these columns. For API callers: on insert forces `view_count = 0`, `published_at`, `expires_at`, `sold_at`, `hidden_reason` to null; on update copies `id`, `number`, `owner_id`, `location_seed`, `view_count`, `published_at`, `expires_at`, `sold_at`, `hidden_reason`, `created_at` back from `OLD`, and allows only these status changes (else `STATUS_TRANSITION`): `draft`/`archived` → `active`, `active` → `sold`/`archived`. `authenticated` has insert privilege only on user-editable columns, so `number`, `id`, `location_seed` and timestamps cannot be chosen on insert. Postgres runs triggers on the same event in name order, so this runs before the lifecycle trigger. |
| `set_listing_lifecycle()` | before insert/update trigger on listings, named `listings_20_lifecycle` | When status changes to `active`: set `published_at = now()` if it is null, and `expires_at = now() + interval '90 days'` if it is null or already past. When status becomes `sold`: set `sold_at = now()`. |
| `enforce_listing_limits()` | before insert/update trigger on listings, named `listings_30_limits` | Max 10 listings with status `active` per non-admin owner. Raise a clear error code `LISTING_LIMIT`. |
| `enforce_listing_publish_requirements()` | before insert/update trigger on listings, named `listings_40_publish` | When status becomes `active`: requires at least 1 row in `listing_images`, `lat` and `lng` set, and `price_km` set or `price_negotiable = true` (raises `PUBLISH_REQUIREMENTS`), and a phone number in the owner's `profile_contacts` (raises `PHONE_REQUIRED`). |
| `enforce_image_limit()` | before insert trigger on listing_images | Max 20 images per listing, error `IMAGE_LIMIT`. |
| `add_listing_image(target_listing_id uuid, image_path text, image_width integer, image_height integer)` | `security definer` RPC, `authenticated` only | Locks the owner's listing row (`for update`), so parallel uploads are serialised. Requires `image_path` to match `<auth.uid()>/<listing_id>/<uuid>.webp` or `.jpg` and width/height between 1 and 10000 (raises `INVALID_IMAGE`), raises `NOT_FOUND` for listings the caller does not own, then inserts at `max(position) + 1` and returns the row. |
| `increment_listing_view(listing_id uuid, visitor_hash text)` | `security definer` RPC, `service_role` only | For active listings, records the visitor in `listing_views` and increments `view_count` only the first time that visitor is seen that day. Called by the `recordView` server action with the admin client; the hash comes from `src/lib/listings/visitor-hash.ts`. |
| `prune_listing_views()` | `security definer`, cron `prune-listing-views` at 01:30 | Deletes `listing_views` rows older than yesterday. |
| `renew_listing(listing_id uuid)` | `security definer` RPC | Owner only. Allowed when the listing is `archived`, or `active` with less than 14 days left. Sets `status = 'active'` and `expires_at = now() + interval '90 days'`. Respects the 10-active-listings limit. |
| `reorder_listing_images(target_listing_id uuid, ordered_image_ids uuid[])` | `security invoker` RPC | Owner only (RLS applies). Rewrites `position` for all images of the listing in one transaction so the deferred unique `(listing_id, position)` constraint is checked once. Position 0 is the cover. Raises `IMAGE_ORDER_MISMATCH` unless the array contains exactly the listing's images. |
| `get_listing_private_location(target_listing_id uuid)` | `security definer` RPC | Owner or admin only. Returns exact `lat`, `lng`, `address`, which are not selectable through the API. |
| `track_listing_price()` | before update trigger on listings, named `listings_25_price_history` | `security definer`. Runs when `price_km` changes on a listing that has been published (`published_at` not null). Inserts a `listing_price_history` row. The reference price is `old_price_km` of the earliest history row in the last 30 days, or the previous price when there is none. If the new price is lower, sets `previous_price_km` to the reference and `price_reduced_at = now()`, otherwise clears both. The app shows the reduction for 30 days after `price_reduced_at` and only when it is at least 1%. Both columns are reset by `protect_listing_columns` for API callers, so owners cannot set them. |
| `my_listing_stats()` | `security definer` RPC | Authenticated only. For each listing owned by the caller returns `favorite_count` (favourites by other users) and `contact_count` (distinct other users who revealed the phone, from `contact_reveals`). Owners cannot read `favorites` or `contact_reveals` directly. |
| `municipality_listing_counts()` | `security invoker` RPC | Active listing count per municipality, for the home map and municipality grid. |
| `get_seller_contact(listing_id uuid)` | `security definer` RPC | Returns phone, has_viber, has_whatsapp, full_name for an active listing's owner. Returns nothing if `auth.uid()` is null. Logs each reveal in `contact_reveals` and raises `RATE_LIMIT` after 30 reveals per user per hour. |
| `claim_ai_suggestion()` | `security definer` RPC, `authenticated` only | Called by the `suggestListingText` server action before each Gemini request. Takes a per-user advisory lock, raises `RATE_LIMIT` after 10 suggestions per user in the last 24 hours, otherwise logs one row in `ai_suggestions` and returns its `release_token`. Raises `NOT_AUTHENTICATED` without a user. |
| `release_ai_suggestion(token uuid)` | `security definer` RPC, `authenticated` only | Deletes the caller's own `ai_suggestions` row with that token if it is less than 10 minutes old, so a failed Gemini request does not count toward the limit. The token stays on the server, so a client cannot release successful suggestions. |
| `enforce_report_rate_limit()` | before insert trigger on reports | Raises `RATE_LIMIT` after 10 reports per user per day. |
| `archive_expired_listings()` | function run daily with `pg_cron` | Sets `status = 'archived'` where `status = 'active' and expires_at < now()`. |

## Storage

### `listing-images` bucket

- Public read.
- Object path: `{owner_id}/{listing_id}/{uuid}.webp`, or `.jpg` from browsers that cannot encode WebP (Safari on iOS and macOS).
- Insert and update (`with check`) require the full name to match `{auth.uid()}/{uuid}/{uuid}.webp` or `.jpg`; insert also requires the listing to belong to the caller. Delete requires `(storage.foldername(name))[1] = auth.uid()::text`.
- Max file size 2 MB, allowed MIME `image/webp` and `image/jpeg`. The client compresses to WebP when the browser can encode it, otherwise to JPEG (`src/lib/images/output-format.ts`), max 1920px long edge, quality 0.8, before upload. It checks the encoded type, because Safari silently returns PNG when asked for WebP. HEIC files are decoded only where the browser supports it (Safari); elsewhere the user gets a message to save the photo as JPG.
- When a listing is deleted, a server action removes its folder from storage.

### `avatars` bucket

- Public read. Insert and update only for the exact paths `{auth.uid()}/avatar.webp` and `{auth.uid()}/avatar.jpg` (same WebP/JPEG choice as listing images; `updateAvatar` removes the other one); delete within the caller's folder. Max 512 KB, allowed MIME `image/webp` and `image/jpeg`. Client crops to 256×256.

## Type generation

After each migration: `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`. All Supabase clients are typed with `Database` from that file.
