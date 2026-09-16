-- =====================================================================
-- MédiThé — Médiathèque : colonne public_id (nécessaire pour la suppression
-- côté Cloudinary, pas juste de la ligne en base)
-- À exécuter dans Supabase : SQL Editor > New query > coller > Run
-- =====================================================================

alter table public.medias add column if not exists public_id text;
