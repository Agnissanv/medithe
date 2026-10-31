-- Correctif : les fiches produits ne s'enregistrent plus depuis le 13 octobre 2026.
-- La colonne offres_quantite est un nombre entier en base, alors que le site y envoie une liste d'offres :
-- la base refuse tout l'enregistrement (offres, photos, prix, stock), et aussi la création d'un produit.
-- La colonne contient seulement des 0 : aucune offre n'est perdue.
-- À exécuter une fois dans l'éditeur SQL de Supabase. Peut être relancé sans risque : il ne fait rien si c'est déjà corrigé.

do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'produits' and column_name = 'offres_quantite') <> 'jsonb' then
    alter table public.produits alter column offres_quantite drop default;
    alter table public.produits alter column offres_quantite type jsonb using '[]'::jsonb;
    alter table public.produits alter column offres_quantite set default '[]'::jsonb;
    alter table public.produits alter column offres_quantite set not null;
  end if;
end $$;
