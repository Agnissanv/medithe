-- Diagnostic de sécurité MédiThé : LECTURE SEULE, ne modifie rien.
-- À exécuter dans l'éditeur SQL de Supabase, puis copier le résultat (une seule cellule de texte).
-- Il montre : les tables protégées, les règles d'accès, les droits, le code des fonctions et le nombre de comptes par rôle.
-- Il n'affiche aucune donnée client, aucun e-mail, aucun mot de passe et aucune clé.

select jsonb_pretty(jsonb_build_object(
  'tables', (
    select jsonb_agg(jsonb_build_object('table', c.relname, 'rls', c.relrowsecurity) order by c.relname)
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
  ),
  'regles', (
    select jsonb_agg(jsonb_build_object('table', tablename, 'nom', policyname, 'action', cmd, 'roles', roles, 'lecture', qual, 'ecriture', with_check) order by tablename, policyname)
    from pg_policies where schemaname = 'public'
  ),
  'droits', (
    select jsonb_agg(x order by x->>'table', x->>'role') from (
      select jsonb_build_object('table', table_name, 'role', grantee, 'droits', string_agg(privilege_type, ', ' order by privilege_type)) as x
      from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated')
      group by table_name, grantee
    ) d
  ),
  'droits_colonnes', (
    select jsonb_agg(x) from (
      select jsonb_build_object('table', table_name, 'role', grantee, 'droit', privilege_type, 'colonnes', string_agg(column_name, ', ' order by column_name)) as x
      from information_schema.column_privileges
      where table_schema = 'public' and grantee in ('anon', 'authenticated')
      group by table_name, grantee, privilege_type
    ) d
  ),
  'fonctions', (
    select jsonb_agg(jsonb_build_object(
      'nom', p.proname,
      'parametres', pg_get_function_identity_arguments(p.oid),
      'security_definer', p.prosecdef,
      'reglages', p.proconfig,
      'anon', has_function_privilege('anon', p.oid, 'execute'),
      'authenticated', has_function_privilege('authenticated', p.oid, 'execute'),
      'code', p.prosrc
    ) order by p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
  ),
  'declencheurs', (
    select jsonb_agg(jsonb_build_object('table', c.relname, 'nom', t.tgname, 'fonction', f.proname) order by c.relname, t.tgname)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    join pg_proc f on f.oid = t.tgfoid
    where n.nspname = 'public' and not t.tgisinternal
  ),
  'comptes_par_role', (select jsonb_object_agg(coalesce(role, 'sans role'), nb) from (select role, count(*) nb from public.profiles group by role) r),
  'comptes_auth_sans_profil', (select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id)),
  'commandes', (select jsonb_build_object('total', count(*), 'dernier_mois', count(*) filter (where date_heure > now() - interval '30 days')) from public.commandes)
)) as diagnostic;
