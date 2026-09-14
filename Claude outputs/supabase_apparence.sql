-- =====================================================================
-- MédiThé — Apparence personnalisable (palette de couleurs)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

create table if not exists public.parametres_apparence (
  id text primary key default 'principal',
  couleur_principale text not null default '#0B4D1E',
  couleur_accent text not null default '#C99A2E',
  couleur_fond text not null default '#EAF6EC',
  updated_at timestamptz not null default now()
);

-- Une seule ligne, initialisée avec les couleurs MédiThé actuelles : rien ne
-- change visuellement tant que personne ne touche à l'admin > Apparence.
insert into public.parametres_apparence (id, couleur_principale, couleur_accent, couleur_fond)
values ('principal', '#0B4D1E', '#C99A2E', '#EAF6EC')
on conflict (id) do nothing;

alter table public.parametres_apparence enable row level security;

-- Lecture PUBLIQUE (contrairement à parametres_api_conversion) : tout visiteur,
-- même anonyme, doit pouvoir charger la palette pour que le site s'affiche
-- avec les bonnes couleurs. Ce ne sont pas des secrets.
drop policy if exists "lecture_publique_apparence" on public.parametres_apparence;
create policy "lecture_publique_apparence"
  on public.parametres_apparence for select
  using (true);

-- Écriture réservée à l'admin
drop policy if exists "admin_modifie_apparence" on public.parametres_apparence;
create policy "admin_modifie_apparence"
  on public.parametres_apparence for update
  using (is_admin())
  with check (is_admin());

-- GRANT de base (indispensables en plus des policies, comme d'habitude sur ce projet)
grant select on public.parametres_apparence to anon, authenticated;
grant update on public.parametres_apparence to authenticated;
