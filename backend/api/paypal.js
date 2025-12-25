// backend/api/paypal.js
const express = require('express');
const router = express.Router();
const { paypalClient } = require('../services/paypal');
const paypal = require('@paypal/paypal-server-sdk');
const { supabaseAdmin } = require('../services/supabase');
const { protect } = require('../middleware/auth');

/**
 * @route   POST /api/paypal/create-subscription
 * @desc    Crea una suscripción en PayPal.
 * @access  Private
 */
router.post('/create-subscription', protect, async (req, res, next) => {
  // ... (el código de este endpoint que ya creamos sigue siendo válido)
  const { planId, subscriptionId } = req.body;
  const userUuid = req.user.uuid;

  if (!planId || !subscriptionId) {
    return res.status(400).json({ error: 'Se requiere el ID del plan y el ID de la suscripción.' });
  }

  try {
    const { data: plan } = await supabaseAdmin.from('planes').select('nombre, precio').eq('id', planId).single();
    if (!plan || parseFloat(plan.precio) === 0) {
      return res.status(400).json({ error: 'Plan inválido o gratuito.' });
    }

    const paypalPlanMap = {
      'Emprendedor': process.env.PAYPAL_PLAN_EMPRENDEDOR_ID,
      'Oro Business': process.env.PAYPAL_PLAN_ORO_ID,
    };
    const paypalPlanId = paypalPlanMap[plan.nombre];

    if (!paypalPlanId) {
      return res.status(500).json({ error: 'Error de configuración de plan de PayPal en el servidor.' });
    }

    const request = new paypal.subscriptions.SubscriptionsCreateRequest();
    request.requestBody({
      plan_id: paypalPlanId,
      application_context: {
        brand_name: 'PacificoWeb',
        return_url: `${process.env.FRONTEND_URL}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
        user_action: 'SUBSCRIBE_NOW',
      },
    });

    const response = await paypalClient.execute(request);
    const paypalSubscriptionId = response.result.id;

    await supabaseAdmin.from('suscripciones').update({ paypal_subscription_id: paypalSubscriptionId }).eq('id', subscriptionId).eq('usuario_uuid', userUuid);
    
    res.json({ paypalSubscriptionId });

  } catch (err) {
    console.error('Error al crear la suscripción de PayPal:', err.message);
    next(err);
  }
});


/**
 * @route   POST /api/paypal/webhook
 * @desc    Maneja webhooks de PayPal para actualizar el estado de suscripciones.
 * @access  Public
 */
router.post('/webhook', async (req, res) => {
  console.log('[PAYPAL WEBHOOK] Petición recibida en /api/paypal/webhook.');

  // Extraer las cabeceras de PayPal y el body raw que guardamos en el middleware
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  const rawBody = req.rawBody; // <--- ¡LA CLAVE ESTÁ AQUÍ!

  // Logging para depuración en Vercel
  console.log(`[PAYPAL WEBHOOK] Headers: transmission-id=${transmissionId}, transmission-time=${transmissionTime}`);
  if (!rawBody) {
    console.error("[PAYPAL WEBHOOK] CRITICAL: El body raw no está disponible. Revisa la configuración del middleware en server.js.");
    return res.status(500).send('Error de configuración del servidor: rawBody no encontrado.');
  }

  try {
    // 1. VERIFICAR LA FIRMA DEL WEBHOOK
    const verificationPayload = {
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: req.headers['paypal-cert-url'],
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: req.body
    };

    const verifyRequest = new paypal.notifications.WebhooksVerifySignatureRequest();
    verifyRequest.requestBody(verificationPayload);
    
    const verifyResponse = await paypalClient.execute(verifyRequest);
    const { verification_status } = verifyResponse.result;

    if (verification_status !== 'SUCCESS') {
      console.error(`[PAYPAL WEBHOOK] SECURITY: Fallo en la verificación de firma. Status: ${verification_status}`);
      return res.status(403).send('Firma de webhook inválida.');
    }

    console.log('[PAYPAL WEBHOOK] Verificación de firma exitosa (SUCCESS).');

    // 2. PROCESAR EL EVENTO (IDEMPOTENCIA)
    const event = req.body;
    console.log(`[PAYPAL WEBHOOK] Procesando evento: ${event.event_type} con transmission_id: ${transmissionId}`);

    // Lógica de idempotencia: Podríamos guardar el transmissionId en la BD para no procesar duplicados.
    // Por ahora, nos enfocamos en la lógica principal.

    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const paypalSubscriptionId = event.resource.id;
      const startTime = event.resource.start_time;
      
      // Calcular la fecha de expiración (ej. 1 mes desde el inicio)
      const expiresAt = new Date(startTime);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      console.log(`[PAYPAL WEBHOOK] Activando suscripción ${paypalSubscriptionId} en la BD. Nueva expiración: ${expiresAt.toISOString()}`);
      
      const { error } = await supabaseAdmin
        .from('suscripciones')
        .update({ 
          status: 'active',
          current_period_end: expiresAt.toISOString() // Guardamos la fecha de expiración
        })
        .eq('paypal_subscription_id', paypalSubscriptionId);
      
      if (error) {
        console.error(`[PAYPAL WEBHOOK] DB ERROR: Error al activar la suscripción ${paypalSubscriptionId}:`, error.message);
      } else {
        console.log(`[PAYPAL WEBHOOK] DB SUCCESS: Suscripción ${paypalSubscriptionId} activada.`);
      }
    } else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
        const paypalSubscriptionId = event.resource.id;
        console.log(`[PAYPAL WEBHOOK] Cancelando suscripción ${paypalSubscriptionId} en la BD.`);
        
        await supabaseAdmin
            .from('suscripciones')
            .update({ status: 'cancelled' })
            .eq('paypal_subscription_id', paypalSubscriptionId);
    }
    // Puedes añadir más 'else if' para otros eventos como PAYMENT.SALE.COMPLETED

    // 3. RESPONDER A PAYPAL
    // Es crucial responder 200 para que PayPal sepa que recibimos el evento.
    res.status(200).send('Webhook recibido y procesado.');

  } catch (err) {
    // Capturar cualquier excepción no controlada para evitar el crash de la función
    console.error('[PAYPAL WEBHOOK] FATAL: Crash no controlado en el manejador del webhook:', err);
    res.status(500).send('Error interno del servidor al procesar el webhook.');
  }
});

module.exports = router;

