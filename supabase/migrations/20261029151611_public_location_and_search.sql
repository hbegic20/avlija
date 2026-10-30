alter table public.listings
  add column public_lat double precision generated always as (
    case
      when lat is null then null
      when location_precise then lat
      else round(
        (lat + ((('x' || substr(md5(id::text), 1, 7))::bit(28)::integer % 1000)::double precision / 1000 - 0.5) * 0.0036)::numeric,
        5
      )::double precision
    end
  ) stored,
  add column public_lng double precision generated always as (
    case
      when lng is null then null
      when location_precise then lng
      else round(
        (lng + ((('x' || substr(md5(id::text), 9, 7))::bit(28)::integer % 1000)::double precision / 1000 - 0.5) * 0.005)::numeric,
        5
      )::double precision
    end
  ) stored,
  add column public_address text generated always as (
    case when location_precise then address end
  ) stored,
  add column main_area_m2 numeric(10,2) generated always as (coalesce(area_m2, land_area_m2)) stored,
  add column price_per_m2 numeric(12,2) generated always as (
    case
      when price_km is null or price_negotiable then null
      else round(price_km / nullif(coalesce(area_m2, land_area_m2), 0), 2)
    end
  ) stored;

create index listings_price_per_m2_idx on public.listings (price_per_m2);
create index listings_main_area_idx on public.listings (main_area_m2);

revoke select on public.listings from anon, authenticated;
grant select (
  id, number, owner_id, status, type, title, description, price_km, price_negotiable,
  municipality_id, neighborhood, location_precise, area_m2, land_area_m2, rooms, bathrooms,
  floor, total_floors, year_built, heating, condition, is_registered, has_building_permit,
  has_usage_permit, features, view_count, published_at, expires_at, sold_at, hidden_reason,
  search, created_at, updated_at, public_lat, public_lng, public_address, main_area_m2, price_per_m2
) on public.listings to anon, authenticated;

create function public.get_listing_private_location(target_listing_id uuid)
returns table (lat double precision, lng double precision, address text)
language sql
stable
security definer
set search_path = ''
as $$
  select l.lat, l.lng, l.address
  from public.listings l
  where l.id = target_listing_id
    and (l.owner_id = (select auth.uid()) or (select public.is_admin()));
$$;

revoke execute on function public.get_listing_private_location(uuid) from public, anon;
grant execute on function public.get_listing_private_location(uuid) to authenticated;

create function public.municipality_listing_counts()
returns table (municipality_id smallint, active_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.municipality_id, count(*)
  from public.listings l
  where l.status = 'active'
    and l.municipality_id is not null
  group by l.municipality_id;
$$;

revoke execute on function public.municipality_listing_counts() from public;
grant execute on function public.municipality_listing_counts() to anon, authenticated;
