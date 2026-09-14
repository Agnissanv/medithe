-- Correctif : la table parametres_api_conversion existe bien, mais l'admin connecté
-- n'a pas encore le droit d'y accéder (permission denied silencieuse côté app).

-- 1. Les GRANT de base manquaient (une policy RLS seule ne suffit jamais sur ce projet)
grant select, insert, update on public.parametres_api_conversion to authenticated;

-- 2. On remplace la policy par une version qui réutilise is_admin() (déjà utilisée
--    partout ailleurs sur MédiThé), plutôt que la sous-requête sur profiles écrite avant
drop policy if exists "admin_gere_api_conversion" on public.parametres_api_conversion;

create policy "admin_gere_api_conversion"
  on public.parametres_api_conversion
  for all
  using (is_admin())
  with check (is_admin());
