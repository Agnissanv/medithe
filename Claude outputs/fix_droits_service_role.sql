-- Correctif : les fonctions serveur (api/track-event, api/create-user, api/delete-media) se connectent
-- avec la clé secrète (rôle service_role). Sur ce projet, chaque rôle a besoin d'un GRANT explicite :
-- sans lui, Supabase répond « permission denied » même avec la clé secrète.
-- À exécuter une fois dans l'éditeur SQL de Supabase. Peut être relancé sans risque.

grant usage on schema public to service_role;

-- Envoi des événements à Meta, TikTok et Google (api/track-event)
grant select on public.parametres_api_conversion to service_role;
grant select on public.parametres_pixels to service_role;

-- Création des comptes closers et livreurs, vérification du rôle admin (api/create-user, api/delete-media)
grant select, insert on public.profiles to service_role;
