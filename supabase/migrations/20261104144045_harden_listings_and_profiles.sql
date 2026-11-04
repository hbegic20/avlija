alter table public.listings
  add column location_seed uuid not null default gen_random_uuid();

alter table public.listings
  drop column public_lat,
  drop column public_lng;

alter table public.listings
  add column public_lat double precision generated always as (
    case
      when lat is null then null
      when location_precise then lat
      else round(
        (lat + ((('x' || substr(md5(location_seed::text), 1, 7))::bit(28)::integer % 1000)::double precision / 1000 - 0.5) * 0.0036)::numeric,
        5
      )::double precision
    end
  ) stored,
  add column public_lng double precision generated always as (
    case
      when lng is null then null
      when location_precise then lng
      else round(
        (lng + ((('x' || substr(md5(location_seed::text), 9, 7))::bit(28)::integer % 1000)::double precision / 1000 - 0.5) * 0.005)::numeric,
        5
      )::double precision
    end
  ) stored;

grant select (public_lat, public_lng) on public.listings to anon, authenticated;

revoke insert on public.listings from authenticated;
grant insert (
  owner_id, status, type, title, description, price_km, price_negotiable,
  municipality_id, neighborhood, address, lat, lng, location_precise, area_m2, land_area_m2,
  rooms, bathrooms, floor, total_floors, year_built, heating, condition, is_registered,
  has_building_permit, has_usage_permit, features
) on public.listings to authenticated;

create or replace function public.protect_listing_columns()
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
    return new;
  end if;

  new.id := old.id;
  new.number := old.number;
  new.owner_id := old.owner_id;
  new.location_seed := old.location_seed;
  new.view_count := old.view_count;
  new.published_at := old.published_at;
  new.expires_at := old.expires_at;
  new.sold_at := old.sold_at;
  new.hidden_reason := old.hidden_reason;
  new.created_at := old.created_at;

  if new.status is distinct from old.status and not (
    (old.status in ('draft', 'archived') and new.status = 'active')
    or (old.status = 'active' and new.status in ('sold', 'archived'))
  ) then
    raise exception 'STATUS_TRANSITION' using hint = 'Owners can publish drafts or archived listings and mark active listings as sold or archived.';
  end if;

  return new;
end;
$$;

create or replace function public.set_listing_lifecycle()
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

  if status_changed and new.status = 'active' then
    if new.published_at is null then
      new.published_at := now();
    end if;
    if new.expires_at is null or new.expires_at <= now() then
      new.expires_at := now() + interval '90 days';
    end if;
  end if;

  if status_changed and new.status = 'sold' then
    new.sold_at := now();
  end if;

  return new;
end;
$$;

create function public.prevent_removing_last_active_image()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.listings where id = old.listing_id and status = 'active')
    and not exists (select 1 from public.listing_images where listing_id = old.listing_id and id <> old.id)
  then
    raise exception 'LAST_IMAGE' using hint = 'An active listing must keep at least one image.';
  end if;
  return old;
end;
$$;

create trigger listing_images_keep_last
  before delete on public.listing_images
  for each row
  execute function public.prevent_removing_last_active_image();

revoke update on public.listing_images from authenticated;
grant update (position) on public.listing_images to authenticated;

drop policy "Owners add images to their listings" on public.listing_images;

create policy "Owners add images from their own storage folder"
  on public.listing_images
  for insert
  to authenticated
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
    and storage_path ~ ('^' || (select auth.uid())::text || '/' || listing_id::text || '/[0-9a-f-]{36}\.webp$')
  );

drop policy "Profiles are readable by everyone" on public.profiles;

create policy "Sellers with public listings are readable, users read themselves, admins read all"
  on public.profiles
  for select
  to anon, authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or exists (
      select 1
      from public.listings l
      where l.owner_id = profiles.id
        and l.status in ('active', 'sold')
    )
  );
