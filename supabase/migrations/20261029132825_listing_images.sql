create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  unique (listing_id, position) deferrable initially deferred
);

create function public.enforce_image_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.listing_images where listing_id = new.listing_id) >= 20 then
    raise exception 'IMAGE_LIMIT' using hint = 'A listing can have at most 20 images.';
  end if;
  return new;
end;
$$;

create trigger listing_images_limit
  before insert on public.listing_images
  for each row
  execute function public.enforce_image_limit();

alter table public.listing_images enable row level security;

create policy "Images are readable when their listing is visible"
  on public.listing_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and (
          l.status in ('active', 'sold')
          or l.owner_id = (select auth.uid())
          or (select public.is_admin())
        )
    )
  );

create policy "Owners add images to their listings"
  on public.listing_images
  for insert
  to authenticated
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
  );

create policy "Owners update images of their listings"
  on public.listing_images
  for update
  to authenticated
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
  );

create policy "Owners delete images of their listings"
  on public.listing_images
  for delete
  to authenticated
  using (
    exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = (select auth.uid()))
  );

revoke insert, update, delete on public.listing_images from anon;
