create table public.municipalities (
  id smallint primary key,
  slug text unique not null,
  name text not null,
  lat double precision not null,
  lng double precision not null
);

alter table public.municipalities enable row level security;

create policy "Municipalities are readable by everyone"
  on public.municipalities
  for select
  to anon, authenticated
  using (true);

insert into public.municipalities (id, slug, name, lat, lng) values
  (1, 'bugojno', 'Bugojno', 44.0559, 17.4509),
  (2, 'busovaca', 'Busovača', 44.0985, 17.8791),
  (3, 'dobretici', 'Dobretići', 44.3753, 17.4166),
  (4, 'donji-vakuf', 'Donji Vakuf', 44.1445, 17.3950),
  (5, 'fojnica', 'Fojnica', 43.9634, 17.8990),
  (6, 'gornji-vakuf-uskoplje', 'Gornji Vakuf-Uskoplje', 43.9386, 17.5853),
  (7, 'jajce', 'Jajce', 44.3397, 17.2712),
  (8, 'kiseljak', 'Kiseljak', 43.9432, 18.0775),
  (9, 'kresevo', 'Kreševo', 43.8657, 18.0422),
  (10, 'novi-travnik', 'Novi Travnik', 44.1708, 17.6577),
  (11, 'travnik', 'Travnik', 44.2259, 17.6662),
  (12, 'vitez', 'Vitez', 44.1508, 17.7915);
