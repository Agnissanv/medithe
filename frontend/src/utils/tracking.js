import { supabase } from '../lib/supabaseClient.js';

let pixelsCharges = null;
let scriptsInjectes = new Set();

async function chargerPixels() {
  if (pixelsCharges) return pixelsCharges;
  const { data } = await supabase.from('parametres_pixels').select('*').eq('actif', true);
  pixelsCharges = data || [];
  injecterScripts(pixelsCharges);
  return pixelsCharges;
}

function injecterScriptExterne(src, onLoad) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  if (onLoad) script.onload = onLoad;
  document.head.appendChild(script);
}

function injecterScripts(pixels) {
  const facebookIds = pixels.filter((p) => p.plateforme === 'facebook').map((p) => p.pixel_id);
  const tiktokIds = pixels.filter((p) => p.plateforme === 'tiktok').map((p) => p.pixel_id);
  const googleIds = pixels.filter((p) => p.plateforme === 'google').map((p) => p.pixel_id);

  if (facebookIds.length && !scriptsInjectes.has('facebook')) {
    scriptsInjectes.add('facebook');
    window.fbq = window.fbq || function () {
      (window.fbq.q = window.fbq.q || []).push(arguments);
    };
    window._fbq = window._fbq || window.fbq;
    injecterScriptExterne('https://connect.facebook.net/en_US/fbevents.js', () => {
      facebookIds.forEach((id) => window.fbq('init', id));
      window.fbq('track', 'PageView');
    });
  }

  if (tiktokIds.length && !scriptsInjectes.has('tiktok')) {
    scriptsInjectes.add('tiktok');
    window.TiktokAnalyticsObject = 'ttq';
    const ttq = (window.ttq = window.ttq || []);
    ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie'];
    ttq.setAndDefer = function (target, method) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    ttq.methods.forEach((method) => ttq.setAndDefer(ttq, method));
    ttq.instance = function (pixelId) {
      const inst = ttq._i[pixelId] || [];
      ttq.methods.forEach((method) => ttq.setAndDefer(inst, method));
      return inst;
    };
    ttq.load = function (pixelId) {
      ttq._i = ttq._i || {};
      ttq._i[pixelId] = [];
      injecterScriptExterne(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${pixelId}&lib=ttq`);
    };
    tiktokIds.forEach((id) => {
      ttq.load(id);
      ttq.instance(id).page();
    });
  }

  if (googleIds.length && !scriptsInjectes.has('google')) {
    scriptsInjectes.add('google');
    injecterScriptExterne(`https://www.googletagmanager.com/gtag/js?id=${googleIds[0]}`);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    googleIds.forEach((id) => window.gtag('config', id));
  }
}

// ---- Envoi côté serveur (API de conversion Meta/TikTok/Google) ----------------
// Complète le tracking navigateur ci-dessus : plus fiable (pas affecté par les
// bloqueurs de pub ni la perte de données iOS). Le même event_id est utilisé côté
// navigateur ET côté serveur pour que Meta/TikTok ne comptent pas l'événement deux fois.

function genererEventId() {
  return (window.crypto?.randomUUID?.() || `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`);
}

function obtenirClientId() {
  const cle = '_medithe_cid';
  const trouve = document.cookie.split('; ').find((c) => c.startsWith(cle + '='));
  if (trouve) return trouve.split('=')[1];
  const id = genererEventId();
  document.cookie = `${cle}=${id}; max-age=${60 * 60 * 24 * 365}; path=/`;
  return id;
}

function envoyerEvenementServeur(evenement, eventId, donnees) {
  // Best-effort : on n'attend jamais cet appel et on ignore ses erreurs, pour ne
  // jamais ralentir ou casser une action utilisateur (ajout panier, commande…).
  try {
    fetch('/api/track-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evenement, event_id: eventId, donnees, client_id: obtenirClientId() }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // navigateur sans fetch/cookies (très rare) : on ignore silencieusement
  }
}

export async function trackPageView() {
  const pixels = await chargerPixels();
  const eventId = genererEventId();
  if (window.fbq) window.fbq('track', 'PageView', {}, { eventID: eventId });
  if (window.ttq) pixels.filter((p) => p.plateforme === 'tiktok').forEach((p) => window.ttq.instance(p.pixel_id).page());
  envoyerEvenementServeur('PageView', eventId, {});
}

export async function trackViewContent(produit) {
  const pixels = await chargerPixels();
  const eventId = genererEventId();
  const donnees = { content_name: produit.Nom, content_ids: [produit.ID], content_id: produit.ID, value: produit.Prix, currency: 'XOF' };
  if (window.fbq) window.fbq('track', 'ViewContent', donnees, { eventID: eventId });
  if (window.ttq) pixels.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('ViewContent', { content_id: produit.ID, value: produit.Prix, currency: 'XOF' }, { event_id: eventId })
  );
  if (window.gtag) window.gtag('event', 'view_item', { value: produit.Prix, currency: 'XOF', items: [{ item_id: produit.ID, item_name: produit.Nom }] });
  envoyerEvenementServeur('ViewContent', eventId, donnees);
}

export async function trackAddToCart(produit, quantite) {
  const pixels = await chargerPixels();
  const eventId = genererEventId();
  const valeur = produit.Prix * quantite;
  const donnees = { content_id: produit.ID, content_ids: [produit.ID], value: valeur, currency: 'XOF' };
  if (window.fbq) window.fbq('track', 'AddToCart', donnees, { eventID: eventId });
  if (window.ttq) pixels.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('AddToCart', { content_id: produit.ID, value: valeur, currency: 'XOF' }, { event_id: eventId })
  );
  if (window.gtag) window.gtag('event', 'add_to_cart', { value: valeur, currency: 'XOF' });
  envoyerEvenementServeur('AddToCart', eventId, donnees);
}

export async function trackInitiateCheckout(items, total) {
  const pixels = await chargerPixels();
  const eventId = genererEventId();
  const donnees = { content_ids: items.map((i) => i.id), value: total, currency: 'XOF', num_items: items.length };
  if (window.fbq) window.fbq('track', 'InitiateCheckout', donnees, { eventID: eventId });
  if (window.ttq) pixels.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('InitiateCheckout', { value: total, currency: 'XOF' }, { event_id: eventId })
  );
  if (window.gtag) window.gtag('event', 'begin_checkout', { value: total, currency: 'XOF' });
  envoyerEvenementServeur('InitiateCheckout', eventId, donnees);
}

export async function trackPurchase(numeroCommande, total) {
  const pixels = await chargerPixels();
  const eventId = genererEventId();
  const donnees = { order_id: numeroCommande, value: total, currency: 'XOF' };
  if (window.fbq) window.fbq('track', 'Purchase', { value: total, currency: 'XOF' }, { eventID: eventId });
  if (window.ttq) pixels.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('CompletePayment', { value: total, currency: 'XOF' }, { event_id: eventId })
  );
  if (window.gtag) window.gtag('event', 'purchase', { transaction_id: numeroCommande, value: total, currency: 'XOF' });
  envoyerEvenementServeur('Purchase', eventId, donnees);
}
