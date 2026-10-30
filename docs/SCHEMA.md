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
- `select`: everyone.
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

- `public_lat`, `public_lng`: equal to `lat`/`lng` when `location_precise`, otherwise the exact point shifted by a fixed, per-listing pseudo-random offset (from `md5(id)`) of up to about ±200 m and rounded to 5 decimals. Public maps draw the 300 m circle around this point, so the true location stays inside the circle but is never its centre.
- `public_address`: `address` only when `location_precise`, otherwise null.
- `main_area_m2`: `coalesce(area_m2, land_area_m2)`, used for the "Najveća površina" sort.
- `price_per_m2`: `price_km / main_area_m2`, null when there is no price or it is negotiable. Used for the "Cijena po m²" sort and display.

Column privileges: `anon` and `authenticated` can select every `listings` column **except** `lat`, `lng` and `address`. The owner (or an admin) reads the exact point through `get_listing_private_location(target_listing_id)`. Any new `listings` column must be added to that `grant select (...)` list in its migration, otherwise the API cannot read it.

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

`features` allowed values (validated in Zod, labels in i18n): `balkon`, `terasa`, `lift`, `parking`, `garaza`, `podrum`, `tavan`, `basta`, `bazen`, `klima`, `namjesteno`, `internet`, `alarm`, `pristup_asfaltu`, `struja_na_placu`, `voda_na_placu`, `kanalizacija`.

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
- `insert`, `update`, `delete`: the parent listing's `owner_id = auth.uid()`.

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
| `handle_new_user()` | trigger on `auth.users` after insert | Creates `profiles` row with `full_name` from `raw_user_meta_data->>'full_name'` (fallback: part of email before `@`) and an empty `profile_contacts` row. `security definer`, `search_path = ''`. |
| `set_updated_at()` | before update trigger | Sets `updated_at = now()` on profiles, profile_contacts, listings. |
| `protect_listing_columns()` | before insert/update trigger on listings, named `listings_10_protect` | Security invoker. Applies only when `current_user` is `authenticated` or `anon` (an API request) and the caller is not an admin, so trusted `security definer` functions (`renew_listing`, `increment_listing_view`) and the cron job can still write these columns. For API callers: on insert forces `view_count = 0`, `published_at`, `expires_at`, `sold_at`, `hidden_reason` to null; on update copies `number`, `owner_id`, `view_count`, `published_at`, `expires_at`, `sold_at`, `hidden_reason` back from `OLD`. Postgres runs triggers on the same event in name order, so this runs before the lifecycle trigger. |
| `set_listing_lifecycle()` | before insert/update trigger on listings, named `listings_20_lifecycle` | When status changes to `active` and `published_at` is null: set `published_at = now()`, `expires_at = now() + interval '90 days'`. When status becomes `sold`: set `sold_at = now()`. |
| `enforce_listing_limits()` | before insert/update trigger on listings, named `listings_30_limits` | Max 10 listings with status `active` per non-admin owner. Raise a clear error code `LISTING_LIMIT`. |
| `enforce_listing_publish_requirements()` | before insert/update trigger on listings, named `listings_40_publish` | When status becomes `active`: requires at least 1 row in `listing_images`, `lat` and `lng` set, and `price_km` set or `price_negotiable = true` (raises `PUBLISH_REQUIREMENTS`), and a phone number in the owner's `profile_contacts` (raises `PHONE_REQUIRED`). |
| `enforce_image_limit()` | before insert trigger on listing_images | Max 20 images per listing, error `IMAGE_LIMIT`. |
| `increment_listing_view(listing_id uuid)` | `security definer` RPC | Increments `view_count` for active listings. Called once per session per listing from the detail page. |
| `renew_listing(listing_id uuid)` | `security definer` RPC | Owner only. Allowed when the listing is `archived`, or `active` with less than 14 days left. Sets `status = 'active'` and `expires_at = now() + interval '90 days'`. Respects the 10-active-listings limit. |
| `reorder_listing_images(target_listing_id uuid, ordered_image_ids uuid[])` | `security invoker` RPC | Owner only (RLS applies). Rewrites `position` for all images of the listing in one transaction so the deferred unique `(listing_id, position)` constraint is checked once. Position 0 is the cover. Raises `IMAGE_ORDER_MISMATCH` unless the array contains exactly the listing's images. |
| `get_listing_private_location(target_listing_id uuid)` | `security definer` RPC | Owner or admin only. Returns exact `lat`, `lng`, `address`, which are not selectable through the API. |
| `municipality_listing_counts()` | `security invoker` RPC | Active listing count per municipality, for the home map and municipality grid. |
| `get_seller_contact(listing_id uuid)` | `security definer` RPC | Returns phone, has_viber, has_whatsapp, full_name for an active listing's owner. Returns nothing if `auth.uid()` is null. |
| `archive_expired_listings()` | function run daily with `pg_cron` | Sets `status = 'archived'` where `status = 'active' and expires_at < now()`. |

## Storage

### `listing-images` bucket

- Public read.
- Object path: `{owner_id}/{listing_id}/{uuid}.webp`.
- Insert/update/delete policy: `(storage.foldername(name))[1] = auth.uid()::text`.
- Max file size 2 MB, allowed MIME `image/webp`, `image/jpeg`. The client compresses to WebP, max 1920px long edge, quality 0.8, before upload.
- When a listing is deleted, a server action removes its folder from storage.

### `avatars` bucket

- Public read. Path `{user_id}/avatar.webp`. Same owner policy. Max 512 KB. Client crops to 256×256.

## Type generation

After each migration: `npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts`. All Supabase clients are typed with `Database` from that file.
