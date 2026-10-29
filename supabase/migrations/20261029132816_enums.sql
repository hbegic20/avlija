create type public.user_role as enum ('user', 'admin');
create type public.property_type as enum ('stan', 'kuca', 'plac', 'poljoprivredno', 'vikendica', 'poslovni_prostor', 'garaza');
create type public.listing_status as enum ('draft', 'active', 'sold', 'archived', 'hidden');
create type public.heating_type as enum ('centralno', 'etazno', 'struja', 'drva', 'plin', 'toplotna_pumpa', 'nema');
create type public.property_condition as enum ('novogradnja', 'renovirano', 'useljivo', 'potrebna_adaptacija', 'roh_bau');
create type public.report_reason as enum ('lazni_oglas', 'prodano', 'netacni_podaci', 'neprimjereno', 'prevara', 'ostalo');
create type public.report_status as enum ('open', 'resolved', 'dismissed');
