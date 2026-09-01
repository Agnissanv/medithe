/**
 * Insère les paramètres de transformation Cloudinary (format et qualité automatiques)
 * dans une URL déjà uploadée, sans avoir à ré-uploader quoi que ce soit.
 * Réduit le poids des images téléchargées, donc accélère le LCP sur connexion lente.
 */
export function optimiserImageCloudinary(url) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}