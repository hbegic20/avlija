alter table public.ai_suggestions
  add column release_token uuid not null default gen_random_uuid();

drop function public.claim_ai_suggestion();

create function public.claim_ai_suggestion()
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  token uuid;
begin
  if caller is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  perform pg_advisory_xact_lock(hashtext('ai_suggestions:' || caller::text));

  if (
    select count(*)
    from public.ai_suggestions s
    where s.user_id = caller
      and s.created_at > now() - interval '1 day'
  ) >= 10 then
    raise exception 'RATE_LIMIT' using hint = 'At most 10 AI suggestions per day.';
  end if;

  insert into public.ai_suggestions (user_id) values (caller)
  returning release_token into token;

  return token;
end;
$$;

revoke execute on function public.claim_ai_suggestion() from public, anon;
grant execute on function public.claim_ai_suggestion() to authenticated;

create function public.release_ai_suggestion(token uuid)
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  delete from public.ai_suggestions
  where user_id = (select auth.uid())
    and release_token = token
    and created_at > now() - interval '10 minutes';
$$;

revoke execute on function public.release_ai_suggestion(uuid) from public, anon;
grant execute on function public.release_ai_suggestion(uuid) to authenticated;
