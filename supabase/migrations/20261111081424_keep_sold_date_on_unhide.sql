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
    new.sold_at := null;
    if new.published_at is null then
      new.published_at := now();
    end if;
    if new.expires_at is null or new.expires_at <= now() then
      new.expires_at := now() + interval '90 days';
    end if;
  end if;

  if status_changed and new.status = 'sold' and new.sold_at is null then
    new.sold_at := now();
  end if;

  return new;
end;
$$;

update public.listings
set sold_at = null
where status = 'active'
  and sold_at is not null;
