create table public.listing_price_history (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings on delete cascade,
  old_price_km integer,
  new_price_km integer,
  changed_at timestamptz not null default now()
);

create index listing_price_history_listing_time_idx on public.listing_price_history (listing_id, changed_at);

alter table public.listing_price_history enable row level security;

create policy "Price history is readable when its listing is visible"
  on public.listing_price_history
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and (
          l.status in ('active', 'sold')
          or l.owner_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

revoke insert, update, delete on public.listing_price_history from anon, authenticated;

alter table public.listings
  add column previous_price_km integer,
  add column price_reduced_at timestamptz;

grant select (previous_price_km, price_reduced_at) on public.listings to anon, authenticated;

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
    new.previous_price_km := null;
    new.price_reduced_at := null;
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
  new.previous_price_km := old.previous_price_km;
  new.price_reduced_at := old.price_reduced_at;

  if new.status is distinct from old.status and not (
    (old.status in ('draft', 'archived') and new.status = 'active')
    or (old.status = 'active' and new.status in ('sold', 'archived'))
  ) then
    raise exception 'STATUS_TRANSITION' using hint = 'Owners can publish drafts or archived listings and mark active listings as sold or archived.';
  end if;

  return new;
end;
$$;

create function public.track_listing_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reference_price integer;
begin
  if old.published_at is null or new.price_km is not distinct from old.price_km then
    return new;
  end if;

  select h.old_price_km into reference_price
  from public.listing_price_history h
  where h.listing_id = new.id
    and h.changed_at > now() - interval '30 days'
  order by h.changed_at
  limit 1;

  if not found then
    reference_price := old.price_km;
  end if;

  insert into public.listing_price_history (listing_id, old_price_km, new_price_km)
  values (new.id, old.price_km, new.price_km);

  if new.price_km is not null and reference_price is not null and new.price_km < reference_price then
    new.previous_price_km := reference_price;
    new.price_reduced_at := now();
  else
    new.previous_price_km := null;
    new.price_reduced_at := null;
  end if;

  return new;
end;
$$;

create trigger listings_25_price_history
  before update on public.listings
  for each row
  execute function public.track_listing_price();
