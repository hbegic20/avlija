create table public.ai_suggestions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_suggestions_user_time_idx on public.ai_suggestions (user_id, created_at desc);

alter table public.ai_suggestions enable row level security;

revoke all on public.ai_suggestions from anon, authenticated;

create function public.claim_ai_suggestion()
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
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

  insert into public.ai_suggestions (user_id) values (caller);
end;
$$;

revoke execute on function public.claim_ai_suggestion() from public, anon;
grant execute on function public.claim_ai_suggestion() to authenticated;
