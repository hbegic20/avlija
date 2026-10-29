create table public.listings (
  id uuid primary key default gen_random_uuid(),
  number serial unique,
  owner_id uuid not null references public.profiles on delete cascade,
  status public.listing_status not null default 'draft',
  type public.property_type not null,
  title text not null check (char_length(title) between 10 and 120),
  description text not null default '' check (char_length(description) <= 5000),
  price_km integer check (price_km > 0),
  price_negotiable boolean not null default false,
  municipality_id smallint not null references public.municipalities,
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
  heating public.heating_type,
  condition public.property_condition,
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

create index listings_public_idx on public.listings (status, municipality_id, type, price_km);
create index listings_owner_idx on public.listings (owner_id);
create index listings_published_idx on public.listings (published_at desc);
create index listings_search_idx on public.listings using gin (search);

create function public.protect_listing_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user not in ('authenticated', 'anon') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.view_count := 0;
    new.published_at := null;
    new.expires_at := null;
    new.sold_at := null;
    new.hidden_reason := null;
  else
    new.number := old.number;
    new.owner_id := old.owner_id;
    new.view_count := old.view_count;
    new.published_at := old.published_at;
    new.expires_at := old.expires_at;
    new.sold_at := old.sold_at;
    new.hidden_reason := old.hidden_reason;
  end if;

  return new;
end;
$$;

create function public.set_listing_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  previous_status public.listing_status;
  status_changed boolean;
begin
  if tg_op = 'UPDATE' then
    previous_status := old.status;
  end if;
  status_changed := new.status is distinct from previous_status;

  if status_changed and new.status = 'active' and new.published_at is null then
    new.published_at := now();
    new.expires_at := now() + interval '90 days';
  end if;

  if status_changed and new.status = 'sold' then
    new.sold_at := now();
  end if;

  return new;
end;
$$;

create function public.enforce_listing_limits()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  previous_status public.listing_status;
  active_count integer;
begin
  if tg_op = 'UPDATE' then
    previous_status := old.status;
  end if;

  if new.status <> 'active' or previous_status = 'active' then
    return new;
  end if;

  if exists (select 1 from public.profiles where id = new.owner_id and role = 'admin') then
    return new;
  end if;

  select count(*) into active_count
  from public.listings
  where owner_id = new.owner_id
    and status = 'active'
    and id <> new.id;

  if active_count >= 10 then
    raise exception 'LISTING_LIMIT' using hint = 'A user can have at most 10 active listings.';
  end if;

  return new;
end;
$$;

create function public.enforce_listing_publish_requirements()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  previous_status public.listing_status;
begin
  if tg_op = 'UPDATE' then
    previous_status := old.status;
  end if;

  if new.status <> 'active' or previous_status = 'active' then
    return new;
  end if;

  if new.lat is null
    or new.lng is null
    or (new.price_km is null and not new.price_negotiable)
    or not exists (select 1 from public.listing_images where listing_id = new.id)
  then
    raise exception 'PUBLISH_REQUIREMENTS' using hint = 'An active listing needs at least one image, a location and a price or price_negotiable.';
  end if;

  return new;
end;
$$;

create trigger listings_10_protect
  before insert or update on public.listings
  for each row
  execute function public.protect_listing_columns();

create trigger listings_20_lifecycle
  before insert or update on public.listings
  for each row
  execute function public.set_listing_lifecycle();

create trigger listings_30_limits
  before insert or update on public.listings
  for each row
  execute function public.enforce_listing_limits();

create trigger listings_40_publish
  before insert or update on public.listings
  for each row
  execute function public.enforce_listing_publish_requirements();

create trigger listings_50_updated_at
  before update on public.listings
  for each row
  when (old.view_count = new.view_count)
  execute function public.set_updated_at();

alter table public.listings enable row level security;

create policy "Public listings are readable, owners and admins see all of theirs"
  on public.listings
  for select
  to anon, authenticated
  using (
    status in ('active', 'sold')
    or owner_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "Users create draft listings for themselves"
  on public.listings
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()) and status = 'draft');

create policy "Owners update their listings unless hidden"
  on public.listings
  for update
  to authenticated
  using (owner_id = (select auth.uid()) and status <> 'hidden')
  with check (owner_id = (select auth.uid()) and status <> 'hidden');

create policy "Admins update any listing"
  on public.listings
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Owners and admins delete listings"
  on public.listings
  for delete
  to authenticated
  using (owner_id = (select auth.uid()) or (select public.is_admin()));

revoke insert, update, delete on public.listings from anon;
