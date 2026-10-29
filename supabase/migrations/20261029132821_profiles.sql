create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  avatar_url text,
  municipality_id smallint references public.municipalities,
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_contacts (
  profile_id uuid primary key references public.profiles on delete cascade,
  phone text check (phone ~ '^\+?[0-9 ]{6,20}$'),
  has_viber boolean not null default false,
  has_whatsapp boolean not null default false,
  updated_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text;
begin
  display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    ),
    80
  );

  if display_name is null or char_length(display_name) < 2 then
    display_name := 'Korisnik';
  end if;

  insert into public.profiles (id, full_name) values (new.id, display_name);
  insert into public.profile_contacts (profile_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create trigger profile_contacts_set_updated_at
  before update on public.profile_contacts
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;

create policy "Profiles are readable by everyone"
  on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy "Users update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, municipality_id) on public.profiles to authenticated;

create policy "Users read their own contacts, admins read all"
  on public.profile_contacts
  for select
  to authenticated
  using ((select auth.uid()) = profile_id or (select public.is_admin()));

create policy "Users insert their own contacts"
  on public.profile_contacts
  for insert
  to authenticated
  with check ((select auth.uid()) = profile_id);

create policy "Users update their own contacts"
  on public.profile_contacts
  for update
  to authenticated
  using ((select auth.uid()) = profile_id)
  with check ((select auth.uid()) = profile_id);

revoke insert, update, delete on public.profile_contacts from anon;
revoke update on public.profile_contacts from authenticated;
grant update (phone, has_viber, has_whatsapp) on public.profile_contacts to authenticated;
