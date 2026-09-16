-- =====================================================================
-- MédiThé — Formulaire de commande : paliers de quantité, code promo
-- optionnel et compte à rebours par produit
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

-- Jusqu'à 3 paliers de quantité personnalisés par produit (ex: "1 unité",
-- "2 Unités -20%", "3+1 offert"), chacun avec son propre prix final tapé
-- par le vendeur. Tableau vide = formulaire garde l'ancien sélecteur +/-.
alter table public.produits
  add column if not exists offres_quantite jsonb not null default '[]'::jsonb;

-- Affiche ou masque le champ "Code promo" sur le formulaire de CE produit.
-- Par défaut à true pour ne rien changer au comportement des fiches existantes.
alter table public.produits
  add column if not exists code_promo_actif boolean not null default true;

-- Compte à rebours optionnel avec une vraie échéance (même heure pour tous
-- les visiteurs), affiché en haut du formulaire de commande.
alter table public.produits
  add column if not exists compte_a_rebours_actif boolean not null default false;

alter table public.produits
  add column if not exists compte_a_rebours_echeance timestamptz;

alter table public.produits
  add column if not exists compte_a_rebours_texte text;
