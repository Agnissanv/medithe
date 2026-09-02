/**
 * Synchronise le catalogue produits vers Cloudinary, sous deux formes :
 * - un catalogue LÉGER (medithe-catalogue.json) pour la page d'accueil / listing,
 *   qui ne grossit jamais avec le contenu riche des fiches produit ;
 * - un fichier DÉTAILLÉ par produit (medithe-produit-{id}.json), contenant tout
 *   son contenu (sections, offres, témoignages...), téléchargé uniquement quand
 *   on visite CE produit précis.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CATALOG_PRESET = import.meta.env.VITE_CLOUDINARY_CATALOG_PRESET;
const CATALOG_PUBLIC_ID = 'medithe-catalogue';

function getCatalogUrl() {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/${CATALOG_PUBLIC_ID}.json`;
}

function getProduitDetailUrl(id) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/raw/upload/medithe-produit-${id}.json`;
}

/** Ne garde que les champs nécessaires à l'affichage en liste (accueil, cartes produit). */
function allegerProduit(p) {
  return {
    ID: p.ID,
    Nom: p.Nom,
    Prix: p.Prix,
    PrixBarre: p.PrixBarre,
    Categorie: p.Categorie,
    Stock: p.Stock,
    Disponible: p.Disponible,
    Images: p.Images?.slice(0, 1) || [],
    DateAjout: p.DateAjout,
  };
}

async function uploadJsonToCloudinary(publicId, data) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const formData = new FormData();
  formData.append('file', blob);
  formData.append('upload_preset', CATALOG_PRESET);
  formData.append('public_id', publicId);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Échec de la synchronisation');
  }
}

/** Envoie le catalogue ALLÉGÉ (liste de tous les produits, champs minimaux). */
export async function syncCatalogToCloudinary(produits) {
  if (!CLOUD_NAME || !CATALOG_PRESET) {
    throw new Error('Synchronisation catalogue non configurée');
  }
  await uploadJsonToCloudinary(CATALOG_PUBLIC_ID, produits.map(allegerProduit));
}

/** Envoie le détail COMPLET d'un seul produit, dans son propre fichier. */
export async function syncProductDetailToCloudinary(produit) {
  if (!CLOUD_NAME || !CATALOG_PRESET) {
    throw new Error('Synchronisation produit non configurée');
  }
  await uploadJsonToCloudinary(`medithe-produit-${produit.ID}`, produit);
}

/** Lit le catalogue allégé depuis le CDN (page d'accueil / listing). */
export async function fetchCatalogFromCdn() {
  const res = await fetch(getCatalogUrl());
  if (!res.ok) throw new Error('Catalogue CDN indisponible');
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Catalogue CDN invalide');
  return data;
}

/** Lit le détail complet d'UN SEUL produit depuis le CDN (fiche produit). */
export async function fetchProductFromCdn(id) {
  const res = await fetch(getProduitDetailUrl(id));
  if (!res.ok) throw new Error('Produit CDN indisponible');
  const data = await res.json();
  if (!data || !data.ID) throw new Error('Produit CDN invalide');
  return data;
}