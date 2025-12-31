// api/debug/env-check.js
export default function handler(req, res) {
  const vars = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET',
    'VITE_PAYPAL_CLIENT_ID', // si lo usas como env público
  ];
  const present = {};
  vars.forEach(v => present[v] = !!process.env[v]);
  // No devolvemos valores, solo presencia
  res.status(200).json({ ok: true, env: present, now: new Date().toISOString() });
}
