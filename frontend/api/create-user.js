import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { email, password, nom, role, accessToken } = req.body;

  if (!accessToken) return res.status(401).json({ error: 'Aucun jeton de connexion reçu' });

  const supabasePublic = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
  const { data: { user: appelant }, error: erreurAuth } = await supabasePublic.auth.getUser(accessToken);
  if (erreurAuth || !appelant) {
    return res.status(401).json({ error: 'Non authentifié : ' + (erreurAuth?.message || 'utilisateur introuvable') });
  }

  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: profilAppelant, error: erreurProfilAppelant } = await supabaseAdmin
    .from('profiles').select('role').eq('id', appelant.id).single();

  if (erreurProfilAppelant) {
    return res.status(500).json({ error: 'Erreur lecture profil : ' + erreurProfilAppelant.message });
  }
  if (profilAppelant?.role !== 'admin') {
    return res.status(403).json({ error: `Réservé aux administrateurs (rôle détecté : ${profilAppelant?.role || 'aucun'})` });
  }

  const { data: nouveau, error: erreurCreation } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (erreurCreation) return res.status(400).json({ error: erreurCreation.message });

  const { error: erreurProfil } = await supabaseAdmin.from('profiles').insert({
    id: nouveau.user.id, nom, role,
  });
  if (erreurProfil) return res.status(400).json({ error: erreurProfil.message });

  res.status(200).json({ success: true });
}