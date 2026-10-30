import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const FORMATS_ACCEPTES = 'jpg,png,webp';

// Signature Cloudinary : paramètres triés par nom, puis secret, le tout en SHA-1.
export function signerParametres(parametres, secret) {
  const chaine = Object.keys(parametres).sort().map((cle) => `${cle}=${parametres[cle]}`).join('&');
  return crypto.createHash('sha1').update(chaine + secret).digest('hex');
}

// Autorise UN envoi d'image vers Cloudinary pour un admin connecté. Le secret reste ici, sur le serveur :
// sans cette signature, personne ne peut déposer de fichier sur le compte Cloudinary (formats limités, pas d'écrasement).
// Corps attendu : { accessToken, dossier?, nomPersonnalise? }.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { accessToken, dossier, nomPersonnalise } = req.body || {};
  if (!accessToken) return res.status(401).json({ error: 'Aucun jeton de connexion reçu' });
  if (dossier && !/^[a-zA-Z0-9_/-]{1,60}$/.test(dossier)) return res.status(400).json({ error: 'Dossier invalide' });
  if (nomPersonnalise && !/^[a-zA-Z0-9_-]{1,100}$/.test(nomPersonnalise)) return res.status(400).json({ error: 'Nom de fichier invalide' });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY || !SUPABASE_SERVICE_ROLE_KEY || !cloudName || !apiKey || !apiSecret) {
    console.error('sign-upload : variables manquantes sur Vercel');
    return res.status(500).json({ error: "L'envoi d'images n'est pas configuré sur le serveur." });
  }

  const supabasePublic = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data: { user: appelant }, error: erreurAuth } = await supabasePublic.auth.getUser(accessToken);
  if (erreurAuth || !appelant) return res.status(401).json({ error: 'Session expirée : reconnectez-vous.' });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profil, error: erreurProfil } = await supabaseAdmin
    .from('profiles').select('role').eq('id', appelant.id).single();
  if (erreurProfil) {
    console.error('sign-upload : lecture du profil', erreurProfil.message);
    return res.status(500).json({ error: 'Vérification du compte impossible pour le moment.' });
  }
  if (profil?.role !== 'admin') return res.status(403).json({ error: 'Réservé aux administrateurs' });

  const parametres = {
    allowed_formats: FORMATS_ACCEPTES,
    overwrite: 'false',
    timestamp: String(Math.floor(Date.now() / 1000)),
    ...(dossier ? { folder: dossier } : {}),
    ...(nomPersonnalise ? { public_id: nomPersonnalise } : {}),
  };

  res.status(200).json({ cloudName, apiKey, parametres, signature: signerParametres(parametres, apiSecret) });
}
