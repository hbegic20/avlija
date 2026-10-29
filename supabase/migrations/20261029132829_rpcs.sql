create function public.increment_listing_view(listing_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.listings
  set view_count = view_count + 1
  where id = increment_listing_view.listing_id
    and status = 'active';
$$;

create function public.get_seller_contact(listing_id uuid)
returns table (
  full_name text,
  phone text,
  has_viber boolean,
  has_whatsapp boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name, c.phone, c.has_viber, c.has_whatsapp
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  join public.profile_contacts c on c.profile_id = l.owner_id
  where l.id = get_seller_contact.listing_id
    and l.status = 'active'
    and (select auth.uid()) is not null;
$$;

create function public.renew_listing(listing_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.listings%rowtype;
  new_expiry timestamptz := now() + interval '90 days';
begin
  select * into target
  from public.listings
  where id = renew_listing.listing_id
  for update;

  if not found or target.owner_id is distinct from (select auth.uid()) then
    raise exception 'NOT_FOUND';
  end if;

  if not (
    target.status = 'archived'
    or (target.status = 'active' and target.expires_at < now() + interval '14 days')
  ) then
    raise exception 'RENEW_NOT_ALLOWED' using hint = 'Only archived listings or active listings with less than 14 days left can be renewed.';
  end if;

  update public.listings
  set status = 'active',
      expires_at = new_expiry
  where id = target.id;

  return new_expiry;
end;
$$;

revoke execute on function public.increment_listing_view(uuid) from public;
grant execute on function public.increment_listing_view(uuid) to anon, authenticated;

revoke execute on function public.get_seller_contact(uuid) from public, anon;
grant execute on function public.get_seller_contact(uuid) to authenticated;

revoke execute on function public.renew_listing(uuid) from public, anon;
grant execute on function public.renew_listing(uuid) to authenticated;
