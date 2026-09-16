import { createClient } from '@supabase/supabase-js';

// Supprime un ou plusieurs fichiers sur Cloudinary via leur API Admin, qui exige la
// clé secrète (jamais exposable côté navigateur) — d'où le passage par une fonction
// serveur, même principe que create-user.js / track-event.js.
//
// Appelée par la médiathèque admin (supabaseApi.js → _supprimerFichiersCloudinary),
// en plus — jamais à la place — de la suppression de la ligne dans la table `medias`.
// Corps attendu : { publicIds: string[], accessToken }. Réservé aux admins connectés.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { publicIds, accessToken } = req.body || {};
  if (!Array.isArray(publicIds) || !publicIds.length) {
    return res.status(400).json({ error: 'publicIds manquant' });
  }
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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      error: 'Cloudinary non configuré côté serveur (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET manquants dans les variables d\'environnement Vercel)',
    });
  }

  // Endpoint de suppression groupée (jusqu'à 100 public_ids par appel), authentifié
  // par Basic Auth (api_key:api_secret) plutôt que par signature — plus simple à
  // implémenter côté serveur, pas besoin de calculer un hash à la main.
  const params = new URLSearchParams();
  publicIds.slice(0, 100).forEach((id) => params.append('public_ids[]', id));
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

  try {
    const resp = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${params.toString()}`,
      { method: 'DELETE', headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.error?.message || 'Échec de suppression Cloudinary' });
    }
    return res.status(200).json({ success: true, deleted: data.deleted || {} });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
