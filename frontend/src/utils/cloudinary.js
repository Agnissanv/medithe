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

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );

  if (blob.size > MAX_SIZE_BYTES) {
    throw new Error("L'image reste trop lourde après compression (max ~2 Mo). Essayez une image plus petite.");
  }

  return blob;
}

/**
 * Compresse puis envoie une image vers Cloudinary. Retourne l'URL sécurisée.
 */
export async function uploadImageToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary non configuré (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET manquants)');
  }

  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', UPLOAD_PRESET);

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
