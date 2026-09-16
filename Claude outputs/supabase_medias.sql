-- =====================================================================
-- MédiThé — Bibliothèque de médias
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

create table if not exists public.medias (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  nom text not null default '',
  largeur integer,
  hauteur integer,
  taille_octets integer,
  created_at timestamptz not null default now()
);

alter table public.medias enable row level security;

-- Usage interne admin uniquement : pas besoin d'accès public sur cette table.
-- Les images qui doivent être publiques le sont déjà via les tables qui stockent
-- leur URL (produits.images, produits.sections...), pas via la médiathèque elle-même.
drop policy if exists "admin_gere_medias" on public.medias;
create policy "admin_gere_medias"
  on public.medias for all
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on public.medias to authenticated;
