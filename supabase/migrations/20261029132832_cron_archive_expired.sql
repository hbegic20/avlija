create extension if not exists pg_cron with schema pg_catalog;

create function public.archive_expired_listings()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  archived_count integer;
begin
  update public.listings
  set status = 'archived'
  where status = 'active'
    and expires_at < now();

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;

revoke execute on function public.archive_expired_listings() from public, anon, authenticated;

select cron.schedule(
  'archive-expired-listings',
  '15 1 * * *',
  $$ select public.archive_expired_listings(); $$
);
