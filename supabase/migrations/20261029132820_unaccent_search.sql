create extension if not exists unaccent with schema extensions;

create function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, replace(replace(input, 'đ', 'dj'), 'Đ', 'Dj')) $$;
