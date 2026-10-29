alter table public.listings
  alter column municipality_id drop not null;

alter table public.listings
  add constraint listings_municipality_required_unless_draft
  check (status = 'draft' or municipality_id is not null);

create function public.reorder_listing_images(target_listing_id uuid, ordered_image_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owned_image_count integer;
begin
  if not exists (
    select 1
    from public.listings
    where id = target_listing_id
      and owner_id = (select auth.uid())
  ) then
    raise exception 'NOT_FOUND';
  end if;

  select count(*) into owned_image_count
  from public.listing_images
  where listing_id = target_listing_id;

  if owned_image_count <> coalesce(array_length(ordered_image_ids, 1), 0)
    or exists (
      select 1
      from unnest(ordered_image_ids) as requested(image_id)
      where not exists (
        select 1
        from public.listing_images li
        where li.id = requested.image_id
          and li.listing_id = target_listing_id
      )
    )
  then
    raise exception 'IMAGE_ORDER_MISMATCH';
  end if;

  update public.listing_images li
  set position = ordering.new_position - 1
  from unnest(ordered_image_ids) with ordinality as ordering(image_id, new_position)
  where li.id = ordering.image_id
    and li.listing_id = target_listing_id;
end;
$$;

revoke execute on function public.reorder_listing_images(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_listing_images(uuid, uuid[]) to authenticated;
