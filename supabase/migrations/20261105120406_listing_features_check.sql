alter table public.listings
  add constraint listings_features_known
  check (
    features <@ array[
      'balkon', 'terasa', 'lift', 'parking', 'garaza', 'podrum', 'tavan', 'basta', 'bazen', 'klima',
      'namjesteno', 'internet', 'alarm', 'pristup_asfaltu', 'struja_na_placu', 'voda_na_placu', 'kanalizacija'
    ]::text[]
  );
