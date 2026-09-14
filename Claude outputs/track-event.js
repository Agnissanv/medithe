import { createClient } from '@supabase/supabase-js';

// Fait le pont entre un événement client (vue produit, ajout panier, achat…) et les
// API de conversion serveur-à-serveur de Meta, TikTok et Google (GA4). Contourne les
// bloqueurs de pub et la perte de données iOS puisque l'appel part de notre serveur,
// pas du navigateur du visiteur.
//
// Corps attendu : { evenement, event_id, donnees, client_id }
//   evenement : 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'
//   event_id  : identifiant partagé avec l'appel navigateur (fbq/ttq), pour éviter les doublons
//   donnees   : { content_id, content_name, value, currency, order_id, num_items, ... }
//   client_id : identifiant visiteur stable (cookie), utilisé par GA4

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

  const { evenement, event_id: eventId, donnees = {}, client_id: clientId } = req.body || {};
  if (!evenement || !eventId) {
    return res.status(400).json({ error: 'Paramètres manquants (evenement, event_id)' });
  }

  try {
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
        return { plateforme: cfg.plateforme, ok: false, erreur: err.message };
      }
    });

    const resultats = await Promise.all(envois);
    res.status(200).json({ ok: true, envoyes: resultats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

  await Promise.all(idsPixel.map((pixelId) =>
    fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  ));
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
