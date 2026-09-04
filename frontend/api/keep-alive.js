import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY);

  const { error } = await supabase.from('produits').select('id').limit(1);

  if (error) return res.status(500).json({ success: false, error: error.message });
  res.status(200).json({ success: true, date: new Date().toISOString() });
}