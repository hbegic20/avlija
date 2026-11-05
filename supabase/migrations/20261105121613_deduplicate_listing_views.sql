create table public.listing_views (
  listing_id uuid not null references public.listings on delete cascade,
  visitor_hash text not null check (char_length(visitor_hash) = 64),
  viewed_on date not null default current_date,
  primary key (listing_id, visitor_hash, viewed_on)
);

create index listing_views_viewed_on_idx on public.listing_views (viewed_on);

alter table public.listing_views enable row level security;

revoke all on public.listing_views from anon, authenticated;

drop function public.increment_listing_view(uuid);

create function public.increment_listing_view(listing_id uuid, visitor_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.listings l
    where l.id = increment_listing_view.listing_id
      and l.status = 'active'
  ) then
    return;
  end if;

  insert into public.listing_views (listing_id, visitor_hash)
  values (increment_listing_view.listing_id, increment_listing_view.visitor_hash)
  on conflict do nothing;

  if found then
    update public.listings
    set view_count = view_count + 1
    where id = increment_listing_view.listing_id;
  end if;
end;
$$;

revoke execute on function public.increment_listing_view(uuid, text) from public, anon, authenticated;
grant execute on function public.increment_listing_view(uuid, text) to service_role;

create function public.prune_listing_views()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  pruned_count integer;
begin
  delete from public.listing_views
  where viewed_on < current_date - 1;

  get diagnostics pruned_count = row_count;
  return pruned_count;
end;
$$;

revoke execute on function public.prune_listing_views() from public, anon, authenticated;

select cron.schedule(
  'prune-listing-views',
  '30 1 * * *',
  $$ select public.prune_listing_views(); $$
);
