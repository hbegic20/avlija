create table public.contact_reveals (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  listing_id uuid not null references public.listings on delete cascade,
  created_at timestamptz not null default now()
);

create index contact_reveals_user_time_idx on public.contact_reveals (user_id, created_at desc);

alter table public.contact_reveals enable row level security;

revoke all on public.contact_reveals from anon, authenticated;

create or replace function public.get_seller_contact(listing_id uuid)
returns table (
  full_name text,
  phone text,
  has_viber boolean,
  has_whatsapp boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  caller uuid := (select auth.uid());
  recent_reveals integer;
begin
  if caller is null then
    return;
  end if;

  if not exists (
    select 1
    from public.listings l
    where l.id = get_seller_contact.listing_id
      and l.status = 'active'
  ) then
    return;
  end if;

  select count(*) into recent_reveals
  from public.contact_reveals r
  where r.user_id = caller
    and r.created_at > now() - interval '1 hour';

  if recent_reveals >= 30 then
    raise exception 'RATE_LIMIT' using hint = 'At most 30 phone reveals per hour.';
  end if;

  insert into public.contact_reveals (user_id, listing_id) values (caller, get_seller_contact.listing_id);

  return query
  select p.full_name, c.phone, c.has_viber, c.has_whatsapp
  from public.listings l
  join public.profiles p on p.id = l.owner_id
  join public.profile_contacts c on c.profile_id = l.owner_id
  where l.id = get_seller_contact.listing_id;
end;
$$;

create function public.enforce_report_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (
    select count(*)
    from public.reports r
    where r.reporter_id = new.reporter_id
      and r.created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'RATE_LIMIT' using hint = 'At most 10 reports per day.';
  end if;
  return new;
end;
$$;

create trigger reports_rate_limit
  before insert on public.reports
  for each row
  execute function public.enforce_report_rate_limit();
