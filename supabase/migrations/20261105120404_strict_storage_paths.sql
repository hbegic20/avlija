update storage.buckets
set allowed_mime_types = array['image/webp']
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
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$')
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
    and name ~ ('^' || (select auth.uid())::text || '/[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$')
  );

create policy "Users upload their own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name = (select auth.uid())::text || '/avatar.webp'
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
    and name = (select auth.uid())::text || '/avatar.webp'
  );
