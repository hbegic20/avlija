create function public.admin_emails()
returns text[]
language sql
immutable
set search_path = ''
as $$ select array['haremagare96@gmail.com'] $$;

create function public.promote_listed_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) = any (public.admin_emails()) then
    update public.profiles
    set role = 'admin'
    where id = new.id
      and role <> 'admin';
  end if;
  return new;
end;
$$;

revoke execute on function public.admin_emails() from public, anon, authenticated;
revoke execute on function public.promote_listed_admin() from public, anon, authenticated;

create trigger on_auth_user_promote_admin
  after insert or update of email, email_confirmed_at on auth.users
  for each row
  execute function public.promote_listed_admin();

update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and u.email_confirmed_at is not null
  and lower(u.email) = any (public.admin_emails())
  and p.role <> 'admin';
