-- =====================================================================
-- MédiThé — Compte à rebours : second type "minuteur en boucle" (durée
-- fixe qui redémarre tout seul), en plus de l'échéance réelle existante
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

-- 'echeance' (existant, valeur par défaut) = vraie date/heure, identique
-- pour tous les visiteurs. 'boucle' = minuteur de durée fixe qui redémarre
-- tout seul à chaque fois qu'il atteint 0 (propre à chaque visite).
alter table public.produits
  add column if not exists compte_a_rebours_type text not null default 'echeance';

alter table public.produits
  add column if not exists compte_a_rebours_duree_minutes integer;
