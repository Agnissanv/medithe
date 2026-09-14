-- =====================================================================
-- MédiThé — Ajout de l'API de conversion (tracking côté serveur)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

-- Nouvelle table : jetons secrets par plateforme, jamais lisible par un visiteur.
-- Séparée de "parametres_pixels" (qui, elle, est lue par le navigateur des visiteurs
-- pour charger les pixels, et doit donc rester publique).
create table if not exists public.parametres_api_conversion (
  id uuid primary key default gen_random_uuid(),
  plateforme text not null unique check (plateforme in ('facebook', 'tiktok', 'google')),
  access_token text,          -- Meta : jeton d'accès CAPI (System User). TikTok : jeton Events API.
  test_event_code text,       -- Meta uniquement : code de test (Events Manager > Test Events)
  ga4_measurement_id text,    -- Google uniquement : ID de mesure GA4 (ex : G-XXXXXXX)
  ga4_api_secret text,        -- Google uniquement : clé API secrète (GA4 > Admin > Flux de données > Measurement Protocol)
  actif boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.parametres_api_conversion enable row level security;

-- Aucune policy pour les visiteurs anonymes : par défaut, RLS bloque tout accès.
-- Seuls deux chemins peuvent lire/écrire cette table :
--   1. Un admin connecté (via cette policy, exactement comme les autres tables admin)
--   2. La fonction serveur /api/track-event, qui utilise la clé "service role"
--      (celle-ci contourne RLS entièrement — c'est la même clé déjà utilisée par create-user.js)
create policy "admin_gere_api_conversion"
  on public.parametres_api_conversion
  for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Une ligne de départ par plateforme (à remplir depuis l'interface admin ensuite)
insert into public.parametres_api_conversion (plateforme, actif)
values ('facebook', false), ('tiktok', false), ('google', false)
on conflict (plateforme) do nothing;
