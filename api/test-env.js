// api/test-env.js

export default function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(405).end('Method Not Allowed');
  }

  const requiredEnvVars = {
    // Vercel
    VERCEL_ENV: !!process.env.VERCEL_ENV,

    // Supabase
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,

    // PayPal
    PAYPAL_CLIENT_ID: !!process.env.PAYPAL_CLIENT_ID,
    PAYPAL_SECRET: !!process.env.PAYPAL_SECRET,

    // Auth
    JWT_SECRET: !!process.env.JWT_SECRET,
  };

  const allVarsFound = Object.values(requiredEnvVars).every(Boolean);

  response.status(200).json({
    message: 'Vercel Environment Variable Check',
    allVarsFound,
    variables: requiredEnvVars,
    vercelEnv: process.env.VERCEL_ENV || 'Not Set',
  });
}
