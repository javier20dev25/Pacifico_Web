// backend/services/paypal.js
const paypal = require('@paypal/paypal-server-sdk');

// Cargar las credenciales desde las variables de entorno
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
const environment = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' o 'live'

// Validar que las credenciales existan
if (!clientId || !clientSecret) {
  console.warn(
    'ADVERTENCIA: Las credenciales de PayPal (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) no están configuradas. La API de PayPal no funcionará.'
  );
}

/**
 * Configura el entorno de PayPal (Sandbox o Live).
 */
function getPayPalEnvironment() {
  if (environment === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

/**
 * Cliente de PayPal configurado y listo para usar.
 */
const paypalClient = new paypal.core.PayPalHttpClient(getPayPalEnvironment());

module.exports = { paypalClient };
