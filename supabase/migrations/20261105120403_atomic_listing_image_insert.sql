create function public.add_listing_image(
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

  if image_path !~ ('^' || caller::text || '/' || target_listing_id::text || '/[0-9a-f-]{36}\.webp$')
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

drop policy "Owners add images from their own storage folder" on public.listing_images;
revoke insert on public.listing_images from authenticated;
