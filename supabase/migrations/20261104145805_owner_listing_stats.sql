create index contact_reveals_listing_idx on public.contact_reveals (listing_id, user_id);

create function public.my_listing_stats()
returns table (listing_id uuid, favorite_count bigint, contact_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    l.id,
    (select count(*) from public.favorites f where f.listing_id = l.id and f.user_id <> l.owner_id),
    (select count(distinct r.user_id) from public.contact_reveals r where r.listing_id = l.id and r.user_id <> l.owner_id)
  from public.listings l
  where l.owner_id = (select auth.uid());
$$;

revoke execute on function public.my_listing_stats() from public, anon;
grant execute on function public.my_listing_stats() to authenticated;
