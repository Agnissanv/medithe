/**
 * Upload direct vers Cloudinary depuis le navigateur, sans passer par un backend,
 * via un upload preset non signé. Compression côté client avant envoi pour
 * limiter la consommation du quota Cloudinary (cahier des charges §5).
 *
 * Config nécessaire dans .env :
 *   VITE_CLOUDINARY_CLOUD_NAME=xxxxx
 *   VITE_CLOUDINARY_UPLOAD_PRESET=xxxxx (preset non signé, avec limite de taille
 *     imposée côté Cloudinary — voir docs/GUIDE_APPS_SCRIPT.md et la console Cloudinary)
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const MAX_DIMENSION = 1600; // px, largeur/hauteur max après compression
const JPEG_QUALITY = 0.75;
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // ~2 Mo, garde-fou côté formulaire (voir cahier des charges §5)
const FORMATS_ACCEPTES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Redimensionne et compresse une image dans le navigateur via <canvas>.
 * Retourne un Blob JPEG prêt à être envoyé.
 */
export async function compressImage(file) {
  if (!FORMATS_ACCEPTES.includes(file.type)) {
    throw new Error('Format non accepté. Utilisez JPG, PNG ou WebP.');
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Compression progressive : on réduit la qualité par paliers tant que le fichier
  // est trop lourd, plutôt que d'abandonner après un seul essai. On ne renonce
  // qu'en dernier recours, si même une qualité très basse ne suffit pas.
  const paliersQualite = [0.75, 0.6, 0.45, 0.3];

  for (const qualite of paliersQualite) {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', qualite)
    );
    if (blob.size <= MAX_SIZE_BYTES) return blob;
  }

  // Dernier recours : on réduit aussi les dimensions en plus de la qualité minimale
  const facteurReduction = 0.7;
  canvas.width = Math.round(width * facteurReduction);
  canvas.height = Math.round(height * facteurReduction);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blobFinal = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.3)
  );

  if (blobFinal.size > MAX_SIZE_BYTES) {
    throw new Error("Cette image est exceptionnellement lourde même après compression maximale. Essayez une photo prise directement (pas une capture d'écran ou un scan haute résolution).");
  }

  return blobFinal;
}

/**
 * Transforme un texte libre en identifiant lisible pour une URL/un nom de fichier :
 * enlève les accents, met en minuscule, remplace tout ce qui n'est pas alphanumérique
 * par des tirets. Utilisé pour donner un lien Cloudinary lisible plutôt que
 * l'identifiant aléatoire généré par défaut (ex: "a8f3k2j9").
 */
export function slugifier(texte) {
  return (texte || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // enlève les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'image';
}

/**
 * Compresse puis envoie une image vers Cloudinary. Retourne l'URL sécurisée.
 *
 * @param {File} file
 * @param {{ nomPersonnalise?: string, dossier?: string }} [options]
 *   nomPersonnalise : remplace l'identifiant aléatoire par ce nom dans le lien final
 *     (ex: "mon-logo-a1b2" → .../upload/v.../mon-logo-a1b2.jpg au lieu de .../a8f3k2j9.jpg).
 *     Un court suffixe doit y être inclus par l'appelant pour éviter les collisions
 *     entre deux uploads du même nom (Cloudinary refuse ou écrase sinon selon la config
 *     du preset, qu'on ne contrôle pas ici).
 *   dossier : range l'image dans ce dossier Cloudinary (ex: "medithe/medias") plutôt
 *     qu'à la racine.
 */
export async function uploadImageToCloudinary(file, options = {}) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary non configuré (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET manquants)');
  }

  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', UPLOAD_PRESET);
  if (options.nomPersonnalise) formData.append('public_id', options.nomPersonnalise);
  if (options.dossier) formData.append('folder', options.dossier);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Échec de l'upload vers Cloudinary");
  }

  const data = await res.json();
  return data.secure_url;
}

export const MAX_IMAGES_PAR_PRODUIT = 6;
