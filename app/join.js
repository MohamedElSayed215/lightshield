import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const { email, name } = req.body || {};

  // Validate
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  // Check duplicate
  const { data: existing } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (existing) {
    return res.status(200).json({ ok: true, message: 'Already on the list!' });
  }

  // Insert
  const { error } = await supabase.from('waitlist').insert({
    email: email.toLowerCase().trim(),
    name:  name?.trim() || null,
  });

  if (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: 'Database error' });
  }

  return res.status(200).json({ ok: true, message: 'Access granted!' });
}
