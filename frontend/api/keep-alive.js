import { createClient } from '@supabase/supabase-js';

// Appelée tous les 2 jours par la tâche planifiée de Vercel (vercel.json) : une petite lecture suffit
// pour que Supabase (offre gratuite) ne mette pas le projet en pause après 7 jours sans activité.
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return res.status(500).json({ success: false, error: 'Variables SUPABASE_URL et SUPABASE_PUBLISHABLE_KEY absentes sur Vercel' });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  const { error } = await supabase.from('produits').select('id').limit(1);

  if (error) {
    console.error('keep-alive :', error.message);
    return res.status(500).json({ success: false, error: 'Supabase ne répond pas' });
  }
  res.status(200).json({ success: true, date: new Date().toISOString() });
}