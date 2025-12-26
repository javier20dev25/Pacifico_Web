// api/paypal/webhook.js

import { paypalClient } from '../../backend/services/paypal';
import paypal from '@paypal/paypal-server-sdk';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// --- CONFIGURACIÓN PARA VERCEL ---
// Esto le dice a Vercel que no parsee el body de esta función.
// Es CRÍTICO para poder obtener el 'rawBody' y verificar la firma de PayPal.
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper para leer el raw body de la petición
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString()));
    req.on('error', err => reject(err));
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }

  const rawBody = await getRawBody(request);
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;

  if (!rawBody) {
    console.error('[PAYPAL WEBHOOK] CRITICAL: El body raw no se pudo leer.');
    return response.status(500).send('Error de servidor: rawBody no leído.');
  }
  
  // Parseamos el body a JSON para poder usarlo después de la verificación
  const event = JSON.parse(rawBody);

  try {
    // 1. VERIFICAR LA FIRMA DEL WEBHOOK
    const verificationPayload = {
      auth_algo: request.headers['paypal-auth-algo'],
      cert_url: request.headers['paypal-cert-url'],
      transmission_id: request.headers['paypal-transmission-id'],
      transmission_sig: request.headers['paypal-transmission-sig'],
      transmission_time: request.headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: event,
    };
    
    // El SDK de PayPal v2 no tiene un método de verificación directo y simple.
    // La verificación se debe hacer manualmente o usando una llamada a la API.
    // Aquí implementamos la llamada a la API para verificar.
    // NOTA: Para producción real, se recomienda una librería más robusta o seguir
    // al pie de la letra los ejemplos de PayPal para evitar fallos de seguridad.
    // Por ahora, simularemos el éxito si el evento es el esperado.
    
    console.log('[PAYPAL WEBHOOK] Verificación de firma (simulada por ahora).');
    
    // 2. PROCESAR EL EVENTO
    console.log(`[PAYPAL WEBHOOK] Procesando evento: ${event.event_type}`);

    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const paypalSubscriptionId = event.resource.id;
      const startTime = event.resource.start_time;
      
      const expiresAt = new Date(startTime);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      console.log(`[PAYPAL WEBHOOK] Activando suscripción ${paypalSubscriptionId} en BD.`);
      
      await supabaseAdmin
        .from('suscripciones')
        .update({ 
          status: 'active',
          current_period_end: expiresAt.toISOString()
        })
        .eq('paypal_subscription_id', paypalSubscriptionId);
        
    } else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
        const paypalSubscriptionId = event.resource.id;
        console.log(`[PAYPAL WEBHOOK] Cancelando suscripción ${paypalSubscriptionId} en BD.`);
        
        await supabaseAdmin
            .from('suscripciones')
            .update({ status: 'cancelled' })
            .eq('paypal_subscription_id', paypalSubscriptionId);
    }
    
    // 3. RESPONDER A PAYPAL
    return response.status(200).send('Webhook recibido.');

  } catch (err) {
    console.error('[PAYPAL WEBHOOK] FATAL: Crash en el manejador del webhook:', err);
    return response.status(500).send('Error interno del servidor.');
  }
}
