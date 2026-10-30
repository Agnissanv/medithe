import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const echapper = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const nombre = (n) => Math.round(Number(n) || 0).toLocaleString('fr-FR').replace(/\s/g, ' ');

// Aperçu de partage d'une fiche produit : un lien envoyé sur WhatsApp ou Facebook affiche la photo, le nom et le prix.
// Seuls les robots de partage et les moteurs de recherche passent ici (voir vercel.json) : les clients reçoivent
// directement le site, sans ce détour. Si quelque chose échoue, on renvoie la page normale.
export default async function handler(req, res) {
  const id = String(req.query.id || '').trim();
  const hote = req.headers['x-forwarded-host'] || req.headers.host;
  const base = `https://${hote}`;

  let html;
  try {
    const r = await fetch(`${base}/index.html`);
    if (!r.ok) throw new Error('index indisponible');
    html = await r.text();
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();
    return;
  }

  try {
    if (SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY && /^[0-9a-f-]{36}$/i.test(id)) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      const { data: p } = await supabase.from('produits').select('nom, description, prix, images').eq('id', id).maybeSingle();
      if (p) {
        const nom = p.nom.trim().replace(/[.\s]+$/, ''); // pas de point avant le prix
        const titre = `${nom} : ${nombre(p.prix)} F CFA | MédiThé`;
        const description = `${p.description ? `${p.description.trim()}. ` : ''}${nombre(p.prix)} F CFA. Livraison à domicile, paiement à la livraison.`;
        const photo = p.images?.[0];
        const image = photo?.includes('/upload/')
          ? photo.replace('/upload/', '/upload/f_jpg,q_auto,w_1200,h_630,c_fill,g_auto/')
          : photo || `${base}/brand/hero-produits.jpg`;
        const adresse = `${base}/produit/${id}`;
        const balises = [
          '<meta property="og:type" content="product" />',
          '<meta property="og:site_name" content="MédiThé" />',
          `<meta property="og:title" content="${echapper(titre)}" />`,
          `<meta property="og:description" content="${echapper(description)}" />`,
          `<meta property="og:url" content="${echapper(adresse)}" />`,
          `<meta property="og:image" content="${echapper(image)}" />`,
          '<meta property="og:image:width" content="1200" />',
          '<meta property="og:image:height" content="630" />',
          '<meta name="twitter:card" content="summary_large_image" />',
          `<meta name="description" content="${echapper(description)}" />`,
          `<link rel="canonical" href="${echapper(adresse)}" />`,
        ].join('\n    ');
        html = html
          .replace(/<title>[\s\S]*?<\/title>/i, `<title>${echapper(titre)}</title>`)
          .replace(/\s*<meta\s+(?:property|name)="(?:og:[^"]*|twitter:[^"]*|description)"[^>]*>/gi, '')
          .replace(/\s*<link\s+rel="canonical"[^>]*>/gi, '')
          .replace('</head>', `    ${balises}\n  </head>`);
      }
    }
  } catch (err) {
    console.error('fiche-produit :', err.message); // la page normale reste servie
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.status(200).send(html);
}
