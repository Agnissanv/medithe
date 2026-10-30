import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ROLES_AUTORISES = ['closer', 'livreur'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { email, password, nom, role, accessToken } = req.body || {};

  if (!accessToken) return res.status(401).json({ error: 'Aucun jeton de connexion reçu' });
  if (!ROLES_AUTORISES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  if (!nom?.trim() || !email || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Nom, e-mail et mot de passe de 8 caractères minimum requis' });
  }
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Serveur non configuré : variables Supabase absentes sur Vercel' });
  }

  const supabasePublic = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data: { user: appelant }, error: erreurAuth } = await supabasePublic.auth.getUser(accessToken);
  if (erreurAuth || !appelant) {
    return res.status(401).json({ error: 'Session expirée : reconnectez-vous.' });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profilAppelant, error: erreurProfilAppelant } = await supabaseAdmin
    .from('profiles').select('role').eq('id', appelant.id).single();

  if (erreurProfilAppelant) {
    console.error('Lecture du profil :', erreurProfilAppelant.message);
    return res.status(500).json({ error: 'Vérification du compte impossible pour le moment.' });
  }
  if (profilAppelant?.role !== 'admin') {
    return res.status(403).json({ error: 'Réservé aux administrateurs' });
  }

  const { data: nouveau, error: erreurCreation } = await supabaseAdmin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (erreurCreation) return res.status(400).json({ error: erreurCreation.message });

  const { error: erreurProfil } = await supabaseAdmin.from('profiles').insert({
    id: nouveau.user.id, nom, role,
  });
  if (erreurProfil) {
    console.error('Création du profil :', erreurProfil.message);
    await supabaseAdmin.auth.admin.deleteUser(nouveau.user.id); // pas de compte de connexion sans profil
    return res.status(500).json({ error: 'Création du compte impossible pour le moment.' });
  }

  res.status(200).json({ success: true });
}