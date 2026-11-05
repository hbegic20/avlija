create function public.set_user_role(target_user_id uuid, new_role public.user_role)
returns public.user_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  target_email text;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select u.email into target_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.id = target_user_id;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if new_role <> 'admin' and target_user_id = caller then
    raise exception 'SELF_DEMOTION';
  end if;

  if new_role <> 'admin' and lower(target_email) = any (public.admin_emails()) then
    raise exception 'LISTED_ADMIN';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id;

  return new_role;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
