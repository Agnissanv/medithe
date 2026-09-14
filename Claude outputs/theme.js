import { supabase } from '../lib/supabaseClient.js';

const CLE_CACHE = 'medithe_theme_cache_v1';

// Applique les 3 couleurs de marque immédiatement (sans recharger la page) —
// utilisé au démarrage du site ET juste après un enregistrement dans l'admin.
// Les autres teintes (bordures, fonds secondaires...) sont dérivées de --forest/
// --copper directement en CSS via color-mix() (voir index.css), donc pas besoin
// de les recalculer ici.
export function appliquerTheme(theme) {
  if (!theme) return;
  const racine = document.documentElement;
  if (theme.couleur_principale) racine.style.setProperty('--forest', theme.couleur_principale);
  if (theme.couleur_accent) racine.style.setProperty('--copper', theme.couleur_accent);
  if (theme.couleur_fond) racine.style.setProperty('--parchment-dark', theme.couleur_fond);
}

// À appeler une fois au démarrage de l'app (main.jsx). Applique d'abord la
// dernière valeur connue en cache (évite un flash de couleur au chargement),
// puis va chercher la valeur à jour en base et la réapplique si besoin.
export async function chargerTheme() {
  try {
    const cache = localStorage.getItem(CLE_CACHE);
    if (cache) appliquerTheme(JSON.parse(cache));
  } catch {
    // navigateur sans localStorage (très rare) : pas grave, on continue
  }

  try {
    const { data, error } = await supabase
      .from('parametres_apparence')
      .select('*')
      .eq('id', 'principal')
      .single();
    if (error || !data) return; // table pas encore créée, ou pas de réseau : couleurs par défaut du CSS
    appliquerTheme(data);
    try { localStorage.setItem(CLE_CACHE, JSON.stringify(data)); } catch {}
  } catch {
    // idem : on laisse simplement les couleurs par défaut
  }
}
