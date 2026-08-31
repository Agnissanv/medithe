/**
 * Synchronise le catalogue produits vers un fichier JSON statique sur Cloudinary,
 * pour que le site public le lise depuis un CDN plutôt que via Apps Script à
 * chaque visite (Apps Script ajoute une redirection incompressible ~1-2s).
 *
 * Apps Script reste la source de vérité pour l'écriture (Sheet) ; ce fichier
 * n'est qu'une copie de lecture rapide, régénérée à chaque modif produit.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CATALOG_PRESET = import.meta.env.VITE_CLOUDINARY_CATALOG_PRESET;
const CATALOG_PUBLIC_ID = 'medithe-catalogue';

function getCatalogUrl() {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${CATALOG_PUBLIC_ID}.json`;
}

/** Envoie la liste de produits actuelle vers Cloudinary (écrase la version précédente). */
export async function syncCatalogToCloudinary(produits) {
  if (!CLOUD_NAME || !CATALOG_PRESET) {
    throw new Error('Synchronisation catalogue non configurée (variables Cloudinary manquantes)');
  }

  const blob = new Blob([JSON.stringify(produits)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CATALOG_PRESET);
  formData.append('public_id', CATALOG_PUBLIC_ID);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Échec de la synchronisation du catalogue');
  }
}

/**
 * Lit le catalogue depuis le CDN. Pas de cache-busting : on laisse le réseau CDN
 * servir une copie mise en cache près du visiteur pour un chargement instantané.
 * Cloudinary invalide sa copie automatiquement dès qu'un admin resynchronise le fichier
 * (upload avec overwrite), donc un léger délai de propagation (quelques minutes max)
 * est un compromis largement préférable à forcer un aller-retour réseau à chaque visite.
 */
export async function fetchCatalogFromCdn() {
  const res = await fetch(getCatalogUrl());
  if (!res.ok) throw new Error('Catalogue CDN indisponible');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Catalogue CDN invalide');
  return data;
}