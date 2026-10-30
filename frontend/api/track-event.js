import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const VERSION_META = 'v26.0';
const HOTES_AUTORISES = [
  'medithe.looh-oo.com', 'medithe.vercel.app',
  process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL,
].filter(Boolean);
const DELAI_ACHAT_MS = 2 * 60 * 60 * 1000; // un achat se déclare juste après la commande
const COOKIE_META = /^fb\.\d\.\d+\.[\w.-]{1,250}$/;

// Fait le pont entre un événement client (vue produit, ajout panier, achat…) et les
// API de conversion serveur-à-serveur de Meta, TikTok et Google (GA4). Contourne les
// bloqueurs de pub et la perte de données iOS puisque l'appel part de notre serveur,
// pas du navigateur du visiteur.
//
// Corps attendu : { evenement, event_id, donnees, client_id, fbp, fbc, telephone }
//   evenement : 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
//   event_id  : identifiant partagé avec l'appel navigateur (fbq/ttq), pour éviter les doublons
//   donnees   : { content_id, content_name, value, currency, order_id, num_items, ... }
//   client_id : identifiant visiteur stable (cookie), utilisé par GA4 et Meta
//   fbp, fbc  : cookies Meta du visiteur, pour relier l'événement à la personne qui a vu la pub
//   telephone : seulement pour un achat, jamais transmis tel quel (chiffré en SHA-256 pour Meta)

const NOMS_META = {
  PageView: 'PageView', ViewContent: 'ViewContent', AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout', Purchase: 'Purchase',
};
const NOMS_TIKTOK = {
  ViewContent: 'ViewContent', AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout', Purchase: 'CompletePayment',
};
const NOMS_GA4 = {
  PageView: 'page_view', ViewContent: 'view_item', AddToCart: 'add_to_cart',
  InitiateCheckout: 'begin_checkout', Purchase: 'purchase',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  if (!origineAutorisee(req)) return res.status(403).json({ error: 'Origine non autorisée' });

  const { evenement, event_id: eventId, donnees: donneesRecues = {}, client_id: clientId, fbp, fbc, telephone } = req.body || {};
  if (!NOMS_META[evenement] || typeof eventId !== 'string' || !eventId || eventId.length > 100) {
    return res.status(400).json({ error: 'Événement invalide' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Envoi serveur non configuré : variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY absentes sur Vercel' });
  }

  try {
    // Un achat doit correspondre à une vraie commande récente, et sa valeur vient de la base, pas du navigateur
    const donnees = evenement === 'Purchase' ? await verifierAchat(donneesRecues) : donneesRecues;
    if (!donnees) return res.status(400).json({ error: 'Commande inconnue' });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [{ data: configs, error: erreurConfigs }, { data: pixels, error: erreurPixels }] = await Promise.all([
      supabaseAdmin.from('parametres_api_conversion').select('*').eq('actif', true),
      supabaseAdmin.from('parametres_pixels').select('*').eq('actif', true),
    ]);
    if (erreurConfigs) throw erreurConfigs;
    if (erreurPixels) throw erreurPixels;
    if (!configs?.length) return res.status(200).json({ ok: true, envoyes: [] });

    const contexte = {
      ip: (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      pageUrl: req.headers['referer'] || req.headers['origin'] || '',
      fbp: COOKIE_META.test(fbp || '') ? fbp : null,
      fbc: COOKIE_META.test(fbc || '') ? fbc : null,
      idClient: clientId ? hacher(String(clientId)) : null,
      telephone: evenement === 'Purchase' ? telephoneHache(telephone) : null,
    };

    const envois = configs.map(async (cfg) => {
      try {
        if (cfg.plateforme === 'facebook' && NOMS_META[evenement]) {
          const idsPixel = pixels.filter((p) => p.plateforme === 'facebook').map((p) => p.pixel_id);
          await envoyerMeta(cfg, idsPixel, evenement, eventId, donnees, contexte);
        } else if (cfg.plateforme === 'tiktok' && NOMS_TIKTOK[evenement]) {
          const codesPixel = pixels.filter((p) => p.plateforme === 'tiktok').map((p) => p.pixel_id);
          await envoyerTikTok(cfg, codesPixel, evenement, eventId, donnees, contexte);
        } else if (cfg.plateforme === 'google' && NOMS_GA4[evenement]) {
          await envoyerGA4(cfg, evenement, donnees, clientId);
        } else {
          return { plateforme: cfg.plateforme, ok: true, ignore: true };
        }
        return { plateforme: cfg.plateforme, ok: true };
      } catch (err) {
        console.error(`track-event ${cfg.plateforme} :`, err.message);
        return { plateforme: cfg.plateforme, ok: false };
      }
    });

    const resultats = await Promise.all(envois);
    res.status(200).json({ ok: true, envoyes: resultats });
  } catch (err) {
    console.error('track-event :', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

function origineAutorisee(req) {
  try {
    return HOTES_AUTORISES.includes(new URL(req.headers.origin || req.headers.referer).host);
  } catch {
    return false;
  }
}

async function verifierAchat(donnees) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await supabase.rpc('suivre_commande', { p_numero: String(donnees.order_id || '') });
  const commande = data?.[0];
  if (error || !commande) return null;
  if (Date.now() - new Date(commande.date_heure).getTime() > DELAI_ACHAT_MS) return null;
  return { ...donnees, value: Number(commande.montant_total) };
}

const hacher = (valeur) => crypto.createHash('sha256').update(valeur).digest('hex');

// Meta attend le numéro international, chiffres seuls, puis chiffré. Sans indicatif, on suppose la Côte d'Ivoire (10 chiffres).
function telephoneHache(telephone) {
  const brut = String(telephone || '').trim();
  const chiffres = brut.replace(/\D/g, '');
  if (!chiffres) return null;
  if (brut.startsWith('+')) return hacher(chiffres);
  if (chiffres.startsWith('00')) return hacher(chiffres.slice(2));
  return hacher(chiffres.length === 10 ? `225${chiffres}` : chiffres);
}

async function envoyerMeta(cfg, idsPixel, evenement, eventId, donnees, contexte) {
  if (!cfg.access_token || !idsPixel.length) return;

  const eventTime = Math.floor(Date.now() / 1000);
  const payload = {
    data: [{
      event_name: NOMS_META[evenement],
      event_time: eventTime,
      event_id: eventId,
      action_source: 'website',
      event_source_url: contexte.pageUrl,
      user_data: {
        client_ip_address: contexte.ip,
        client_user_agent: contexte.userAgent,
        ...(contexte.fbp ? { fbp: contexte.fbp } : {}),
        ...(contexte.fbc ? { fbc: contexte.fbc } : {}),
        ...(contexte.idClient ? { external_id: [contexte.idClient] } : {}),
        ...(contexte.telephone ? { ph: [contexte.telephone] } : {}),
      },
      custom_data: {
        currency: donnees.currency,
        value: donnees.value,
        content_ids: donnees.content_ids || (donnees.content_id ? [donnees.content_id] : undefined),
        content_name: donnees.content_name,
        num_items: donnees.num_items,
        order_id: donnees.order_id,
      },
    }],
    access_token: cfg.access_token,
  };
  if (cfg.test_event_code) payload.test_event_code = cfg.test_event_code;

  await Promise.all(idsPixel.map(async (pixelId) => {
    const reponse = await fetch(`https://graph.facebook.com/${VERSION_META}/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!reponse.ok) {
      const detail = await reponse.json().catch(() => ({}));
      throw new Error(`Meta a refusé l'événement (${reponse.status}) : ${detail?.error?.message || 'sans détail'}`);
    }
  }));
}

async function envoyerTikTok(cfg, codesPixel, evenement, eventId, donnees, contexte) {
  if (!cfg.access_token || !codesPixel.length) return;

  const eventTime = new Date().toISOString();
  await Promise.all(codesPixel.map((pixelCode) =>
    fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': cfg.access_token },
      body: JSON.stringify({
        event_source: 'web',
        event_source_id: pixelCode,
        data: [{
          event: NOMS_TIKTOK[evenement],
          event_id: eventId,
          event_time: eventTime,
          user: { ip: contexte.ip, user_agent: contexte.userAgent },
          page: { url: contexte.pageUrl },
          properties: {
            currency: donnees.currency,
            value: donnees.value,
            content_id: donnees.content_id,
            contents: donnees.content_ids?.map((id) => ({ content_id: id })),
          },
        }],
      }),
    })
  ));
}

async function envoyerGA4(cfg, evenement, donnees, clientId) {
  if (!cfg.ga4_measurement_id || !cfg.ga4_api_secret) return;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${cfg.ga4_measurement_id}&api_secret=${cfg.ga4_api_secret}`;
  await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      client_id: clientId || `serveur.${Date.now()}`,
      events: [{
        name: NOMS_GA4[evenement],
        params: {
          currency: donnees.currency,
          value: donnees.value,
          transaction_id: donnees.order_id,
          items: donnees.content_ids?.map((id) => ({ item_id: id })),
        },
      }],
    }),
  });
}
