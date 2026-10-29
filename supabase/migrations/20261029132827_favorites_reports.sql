create table public.favorites (
  user_id uuid not null references public.profiles on delete cascade,
  listing_id uuid not null references public.listings on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index favorites_listing_idx on public.favorites (listing_id);

alter table public.favorites enable row level security;

create policy "Users read their own favorites"
  on public.favorites
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users add their own favorites"
  on public.favorites
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users remove their own favorites"
  on public.favorites
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

revoke insert, update, delete on public.favorites from anon;
revoke update on public.favorites from authenticated;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete cascade,
  reporter_id uuid references public.profiles on delete set null,
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles on delete set null,
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

create index reports_status_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

create policy "Logged-in users report listings as themselves"
  on public.reports
  for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and resolved_by is null
  );

create policy "Admins read reports"
  on public.reports
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins update reports"
  on public.reports
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke insert, update, delete on public.reports from anon;
revoke delete on public.reports from authenticated;
