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

function injecterScripts(pixels) {
  const facebookIds = pixels.filter((p) => p.plateforme === 'facebook').map((p) => p.pixel_id);
  const tiktokIds = pixels.filter((p) => p.plateforme === 'tiktok').map((p) => p.pixel_id);
  const googleIds = pixels.filter((p) => p.plateforme === 'google').map((p) => p.pixel_id);

  if (facebookIds.length && !scriptsInjectes.has('facebook')) {
    scriptsInjectes.add('facebook');
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    facebookIds.forEach((id) => window.fbq('init', id));
    window.fbq('track', 'PageView');
  }

  if (tiktokIds.length && !scriptsInjectes.has('tiktok')) {
    scriptsInjectes.add('tiktok');
    /* eslint-disable */
    !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=i+"?sdkid="+e+"&lib="+t;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(a,s)};
    /* eslint-enable */
    tiktokIds.forEach((id) => {
      window.ttq.load(id);
      window.ttq.instance(id).page();
    });
  }

  if (googleIds.length && !scriptsInjectes.has('google')) {
    scriptsInjectes.add('google');
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${googleIds[0]}`;
    script.async = true;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    googleIds.forEach((id) => window.gtag('config', id));
  }
}

export async function trackPageView() {
  await chargerPixels();
  if (window.fbq) window.fbq('track', 'PageView');
  if (window.ttq) pixelsCharges.filter((p) => p.plateforme === 'tiktok').forEach((p) => window.ttq.instance(p.pixel_id).page());
}

export async function trackViewContent(produit) {
  await chargerPixels();
  const donnees = { content_name: produit.Nom, content_ids: [produit.ID], value: produit.Prix, currency: 'XOF' };
  if (window.fbq) window.fbq('track', 'ViewContent', donnees);
  if (window.ttq) pixelsCharges.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('ViewContent', { content_id: produit.ID, value: produit.Prix, currency: 'XOF' })
  );
  if (window.gtag) window.gtag('event', 'view_item', { value: produit.Prix, currency: 'XOF', items: [{ item_id: produit.ID, item_name: produit.Nom }] });
}

export async function trackAddToCart(produit, quantite) {
  await chargerPixels();
  const valeur = produit.Prix * quantite;
  if (window.fbq) window.fbq('track', 'AddToCart', { content_ids: [produit.ID], value: valeur, currency: 'XOF' });
  if (window.ttq) pixelsCharges.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('AddToCart', { content_id: produit.ID, value: valeur, currency: 'XOF' })
  );
  if (window.gtag) window.gtag('event', 'add_to_cart', { value: valeur, currency: 'XOF' });
}

export async function trackInitiateCheckout(items, total) {
  await chargerPixels();
  if (window.fbq) window.fbq('track', 'InitiateCheckout', { content_ids: items.map((i) => i.id), value: total, currency: 'XOF' });
  if (window.ttq) pixelsCharges.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('InitiateCheckout', { value: total, currency: 'XOF' })
  );
  if (window.gtag) window.gtag('event', 'begin_checkout', { value: total, currency: 'XOF' });
}

export async function trackPurchase(numeroCommande, total) {
  await chargerPixels();
  if (window.fbq) window.fbq('track', 'Purchase', { value: total, currency: 'XOF' });
  if (window.ttq) pixelsCharges.filter((p) => p.plateforme === 'tiktok').forEach((p) =>
    window.ttq.instance(p.pixel_id).track('CompletePayment', { value: total, currency: 'XOF' })
  );
  if (window.gtag) window.gtag('event', 'purchase', { transaction_id: numeroCommande, value: total, currency: 'XOF' });
}