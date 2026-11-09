update storage.buckets
set allowed_mime_types = array['image/webp', 'image/jpeg']
where id in ('listing-images', 'avatars');

drop policy "Owners upload images to their own listings" on storage.objects;
drop policy "Owners update their listing image files" on storage.objects;
drop policy "Users upload their own avatar" on storage.objects;
drop policy "Users update their own avatar" on storage.objects;

create policy "Owners upload images to their own listings"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'listing-images'
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$')
    and exists (
      select 1
      from public.listings l
      where l.id::text = (storage.foldername(name))[2]
        and l.owner_id = (select auth.uid())
    )
  );

create policy "Owners update their listing image files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'listing-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'listing-images'
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg)$')
  );

create policy "Users upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name in ((select auth.uid())::text || '/avatar.webp', (select auth.uid())::text || '/avatar.jpg')
  );

create policy "Users update their own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and name in ((select auth.uid())::text || '/avatar.webp', (select auth.uid())::text || '/avatar.jpg')
  );

create or replace function public.add_listing_image(
  target_listing_id uuid,
  image_path text,
  image_width integer,
  image_height integer
)
returns public.listing_images
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := (select auth.uid());
  next_position smallint;
  inserted public.listing_images;
begin
  perform 1
  from public.listings
  where id = target_listing_id
    and owner_id = caller
  for update;

  if not found then
    raise exception 'NOT_FOUND';
  end if;

  if image_path !~ ('^' || caller::text || '/' || target_listing_id::text || '/[0-9a-f-]{36}\.(webp|jpg)$')
    or image_width not between 1 and 10000
    or image_height not between 1 and 10000
  then
    raise exception 'INVALID_IMAGE';
  end if;

  select coalesce(max(position) + 1, 0) into next_position
  from public.listing_images
  where listing_id = target_listing_id;

  insert into public.listing_images (listing_id, storage_path, position, width, height)
  values (target_listing_id, image_path, next_position, image_width, image_height)
  returning * into inserted;

  return inserted;
end;
$$;

revoke execute on function public.add_listing_image(uuid, text, integer, integer) from public, anon;
grant execute on function public.add_listing_image(uuid, text, integer, integer) to authenticated;
