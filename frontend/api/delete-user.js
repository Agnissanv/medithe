import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Retire définitivement l'accès d'un closer ou d'un livreur : profil ET identifiant de connexion.
// Supprimer le seul profil laisserait la personne capable de se connecter.
// Corps attendu : { userId, accessToken }. Réservé aux admins connectés.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { userId, accessToken } = req.body || {};
  if (!accessToken) return res.status(401).json({ error: 'Aucun jeton de connexion reçu' });
  if (!/^[0-9a-f-]{36}$/i.test(userId || '')) return res.status(400).json({ error: 'Compte invalide' });
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('delete-user : variables Supabase manquantes sur Vercel');
    return res.status(500).json({ error: "Le serveur n'est pas configuré pour cette action." });
  }

  const supabasePublic = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data: { user: appelant }, error: erreurAuth } = await supabasePublic.auth.getUser(accessToken);
  if (erreurAuth || !appelant) return res.status(401).json({ error: 'Session expirée : reconnectez-vous.' });
  if (appelant.id === userId) return res.status(400).json({ error: 'Vous ne pouvez pas retirer votre propre compte.' });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profils, error: erreurProfils } = await supabaseAdmin
    .from('profiles').select('id, role').in('id', [appelant.id, userId]);
  if (erreurProfils) {
    console.error('delete-user : lecture des profils', erreurProfils.message);
    return res.status(500).json({ error: 'Vérification du compte impossible pour le moment.' });
  }
  if (profils.find((p) => p.id === appelant.id)?.role !== 'admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });
  if (profils.find((p) => p.id === userId)?.role === 'admin') return res.status(403).json({ error: 'Un compte administrateur ne se retire pas ici.' });

  const { error: erreurProfil } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
  if (erreurProfil) {
    console.error('delete-user : suppression du profil', erreurProfil.message);
    return res.status(500).json({ error: 'Suppression du compte impossible pour le moment.' });
  }
  const { error: erreurCompte } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (erreurCompte) {
    console.error('delete-user : suppression de la connexion', erreurCompte.message);
    return res.status(500).json({ error: "Le profil est retiré, mais pas l'identifiant de connexion. Réessayez." });
  }

  res.status(200).json({ success: true });
}
