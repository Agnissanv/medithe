-- Correctif : permet à l'admin de retirer l'accès d'un closer ou d'un livreur (api/delete-user).
-- Sur ce projet, chaque rôle a besoin d'un GRANT explicite, y compris le rôle serveur.
-- À exécuter une fois dans l'éditeur SQL de Supabase. Peut être relancé sans risque.

grant delete on public.profiles to service_role;
