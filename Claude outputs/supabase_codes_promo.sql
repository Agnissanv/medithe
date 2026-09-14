-- =====================================================================
-- MédiThé — Codes promo
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

create table if not exists public.codes_promo (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  type_reduction text not null check (type_reduction in ('pourcentage', 'montant')),
  valeur numeric not null check (valeur > 0),
  date_expiration timestamptz,
  utilisation_max integer,
  utilisation_actuelle integer not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.codes_promo enable row level security;

-- Pas de lecture publique directe sur la table : ça permettrait de lister/deviner
-- tous les codes actifs depuis le navigateur. Seule la RPC valider_code_promo()
-- ci-dessous expose ce qu'il faut, un code à la fois.
drop policy if exists "admin_gere_codes_promo" on public.codes_promo;
create policy "admin_gere_codes_promo"
  on public.codes_promo for all
  using (is_admin())
  with check (is_admin());

grant select, insert, update, delete on public.codes_promo to authenticated;

-- Colonnes sur commandes pour tracer le code utilisé (nullable, n'affecte pas
-- creer_commande() qui n'est pas modifiée : ce sont de nouvelles colonnes vides
-- par défaut, remplies séparément par enregistrer_utilisation_code_promo()).
alter table public.commandes add column if not exists code_promo text;
alter table public.commandes add column if not exists reduction_promo numeric;

-- Validation d'un code (appelée quand le client tape son code, avant de commander).
-- Ne révèle jamais la liste des codes existants — seulement si CELUI tapé est valide.
create or replace function public.valider_code_promo(p_code text, p_montant numeric)
returns table(valide boolean, message text, reduction numeric, nouveau_total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code record;
  v_reduction numeric;
begin
  select * into v_code from codes_promo where upper(code) = upper(trim(p_code));

  if not found then
    return query select false, 'Ce code n''existe pas.', 0::numeric, p_montant;
    return;
  end if;
  if not v_code.actif then
    return query select false, 'Ce code n''est plus actif.', 0::numeric, p_montant;
    return;
  end if;
  if v_code.date_expiration is not null and v_code.date_expiration < now() then
    return query select false, 'Ce code a expiré.', 0::numeric, p_montant;
    return;
  end if;
  if v_code.utilisation_max is not null and v_code.utilisation_actuelle >= v_code.utilisation_max then
    return query select false, 'Ce code a atteint sa limite d''utilisation.', 0::numeric, p_montant;
    return;
  end if;

  if v_code.type_reduction = 'pourcentage' then
    v_reduction := round(p_montant * v_code.valeur / 100);
  else
    v_reduction := v_code.valeur;
  end if;
  if v_reduction > p_montant then v_reduction := p_montant; end if;

  return query select true, 'Code appliqué.', v_reduction, (p_montant - v_reduction);
end;
$$;

grant execute on function public.valider_code_promo(text, numeric) to anon, authenticated;

-- Enregistrement de l'utilisation (appelée juste après la création de la commande,
-- ne bloque jamais la commande elle-même si ça échoue — la commande est déjà passée).
-- Revalide tout au cas où le code serait devenu invalide entre les deux appels
-- (ex: quelqu'un d'autre vient d'épuiser le nombre d'utilisations).
create or replace function public.enregistrer_utilisation_code_promo(p_numero_commande text, p_code text, p_reduction numeric)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code record;
begin
  select * into v_code from codes_promo where upper(code) = upper(trim(p_code)) for update;
  if not found or not v_code.actif then return; end if;
  if v_code.date_expiration is not null and v_code.date_expiration < now() then return; end if;
  if v_code.utilisation_max is not null and v_code.utilisation_actuelle >= v_code.utilisation_max then return; end if;

  update codes_promo set utilisation_actuelle = utilisation_actuelle + 1 where id = v_code.id;
  update commandes set code_promo = upper(trim(p_code)), reduction_promo = p_reduction where numero_commande = p_numero_commande;
end;
$$;

grant execute on function public.enregistrer_utilisation_code_promo(text, text, numeric) to anon, authenticated;
