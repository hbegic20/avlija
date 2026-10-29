create or replace function public.enforce_listing_publish_requirements()
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

  if not exists (
    select 1
    from public.profile_contacts
    where profile_id = new.owner_id
      and phone is not null
  ) then
    raise exception 'PHONE_REQUIRED' using hint = 'The owner must set a phone number before publishing.';
  end if;

  return new;
end;
$$;
