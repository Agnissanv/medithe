/**
 * Client de l'API MEDITHE (Google Apps Script).
 *
 * Config : définir VITE_API_URL dans un fichier .env à la racine du projet
 *   VITE_API_URL=https://script.google.com/macros/s/XXXXX/exec
 *
 * Note CORS : les requêtes POST utilisent Content-Type: text/plain pour
 * éviter le préflight OPTIONS qu'Apps Script ne gère pas. Voir
 * docs/GUIDE_APPS_SCRIPT.md pour le détail.
 */

const API_URL = import.meta.env.VITE_API_URL || '';

async function apiGet(action, params = {}) {
  if (!API_URL) throw new Error('VITE_API_URL non configurée');
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${API_URL}?${query}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erreur API');
  return json.data;
}

async function apiPost(action, payload = {}) {
  if (!API_URL) throw new Error('VITE_API_URL non configurée');
  const res = await fetch(API_URL, {
    method: 'POST',
    // IMPORTANT : text/plain volontaire, voir note en haut de fichier
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Erreur API');
  return json;
}

const PRODUITS_CACHE_KEY = 'medithe_produits_cache_v1';
const PRODUITS_CACHE_TTL_MS = 5 * 60 * 1000;

function lireCacheProduits() {
  try {
    const raw = localStorage.getItem(PRODUITS_CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function ecrireCacheProduits(data) {
  try {
    localStorage.setItem(PRODUITS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // stockage indisponible : on ignore silencieusement
  }
}

export const api = {
  getProduits: () => apiGet('getProduits'),

  // Affichage instantané depuis le cache local pendant que les données fraîches arrivent
  getProduitsRapide: () => {
    const cached = lireCacheProduits();
    const fresh = apiGet('getProduits').then((data) => {
      ecrireCacheProduits(data);
      return data;
    });
    return { cached, fresh };
  },
  getProduit: (id) => apiGet('getProduit', { id }),
  getCommande: (numero) => apiGet('getCommande', { numero }),
  createCommande: (commande) => apiPost('createCommande', { commande }),

  // Admin (nécessitent un token obtenu via adminLogin)
  adminLogin: (password) => apiPost('adminLogin', { password }),
  closerLogin: (password) => apiPost('closerLogin', { password }),
  getCommandes: (token, statut) => apiGet('getCommandes', { token, ...(statut ? { statut } : {}) }),
  getStats: (token, dateDebut, dateFin) =>
    apiGet('getStats', { token, ...(dateDebut ? { dateDebut } : {}), ...(dateFin ? { dateFin } : {}) }),
  updateStatutCommande: (token, numero, statut, notes, nomCloser) =>
    apiPost('updateStatutCommande', { token, numero, statut, notes, nomCloser }),
  deleteCommande: (token, numero) => apiPost('deleteCommande', { token, numero }),
  clearAllCommandes: (token) => apiPost('clearAllCommandes', { token }),
  createProduit: (token, produit) => apiPost('createProduit', { token, produit }),
  getClosers: (token) => apiGet('getClosers', { token }),
  getStatsClosers: (token, dateDebut, dateFin) =>
    apiGet('getStatsClosers', { token, ...(dateDebut ? { dateDebut } : {}), ...(dateFin ? { dateFin } : {}) }),
  addCloser: (token, nom) => apiPost('addCloser', { token, nom }),
  removeCloser: (token, nom) => apiPost('removeCloser', { token, nom }),
  updateProduit: (token, id, produit) => apiPost('updateProduit', { token, id, produit }),
  deleteProduit: (token, id) => apiPost('deleteProduit', { token, id }),
};
