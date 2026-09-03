import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { email, password, nom, role, accessToken } = req.body;

  // Vérifie que celui qui appelle est bien connecté
  const supabasePublic = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);
  const { data: { user: appelant }, error: erreurAuth } = await supabasePublic.auth.getUser(accessToken);
  if (erreurAuth || !appelant) return res.status(401).json({ error: 'Non authentifié' });

  // Vérifie que c'est bien un admin (seul rôle autorisé à créer des comptes)
  const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: profilAppelant } = await supabaseAdmin.from('profiles').select('role').eq('id', appelant.id).single();
  if (profilAppelant?.role !== 'admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });

  // Crée le compte
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