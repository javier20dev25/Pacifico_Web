// api/test-env.js

export default function handler(request, response) {
  // Set CORS headers to allow requests from any origin, useful for testing
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for browser preflight checks
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(45).end('Method Not Allowed');
  }

  const supabaseUrlFound = !!process.env.SUPABASE_URL;
  const supabaseServiceKeyFound = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  response.status(200).json({
    message: 'Vercel Environment Variable Check',
    supabaseUrlFound,
    supabaseServiceKeyFound,
  });
}
