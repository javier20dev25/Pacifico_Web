// api/paypal/create-subscription.js

import jwt from 'jsonwebtoken';
import { paypalClient } from '../../backend/services/paypal';
import paypal from '@paypal/paypal-server-sdk';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

// Helper para verificar el token JWT (lógica del antiguo middleware 'protect')
async function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No autorizado, no se encontró token.' };
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Podríamos verificar si el usuario aún existe en la BD, pero por ahora confiamos en el token.
    return { user: decoded }; // Devuelve el payload del token (ej. { uuid, rol, email })
  } catch (error) {
    return { error: 'No autorizado, token inválido.' };
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    return response.status(405).end('Method Not Allowed');
  }
  
  // --- INICIO DE LÓGICA DE PROTECCIÓN DE RUTA ---
  const { user, error: authError } = await verifyToken(request.headers.authorization);
  if (authError) {
    return response.status(401).json({ error: authError });
  }
  // --- FIN DE LÓGICA DE PROTECCIÓN DE RUTA ---

  const { planId, subscriptionId } = request.body;
  const userUuid = user.uuid; // Obtenido del token decodificado

  if (!planId || !subscriptionId) {
    return response.status(400).json({ error: 'Se requiere el ID del plan y el ID de la suscripción.' });
  }

  try {
    const { data: plan, error: planError } = await supabaseAdmin
      .from('planes')
      .select('nombre, precio')
      .eq('id', planId)
      .single();

    if (planError || !plan || parseFloat(plan.precio) === 0) {
      return response.status(400).json({ error: 'Plan inválido o gratuito.' });
    }

    const paypalPlanMap = {
      'Emprendedor': process.env.PAYPAL_PLAN_EMPRENDEDOR_ID,
      'Oro Business': process.env.PAYPAL_PLAN_ORO_ID,
    };
    const paypalPlanId = paypalPlanMap[plan.nombre];

    if (!paypalPlanId) {
      console.error(`Error de configuración de plan de PayPal para '${plan.nombre}'.`);
      return response.status(500).json({ error: 'Error de configuración del servidor para los planes de pago.' });
    }

    const payPalRequest = new paypal.subscriptions.SubscriptionsCreateRequest();
    payPalRequest.requestBody({
      plan_id: paypalPlanId,
      application_context: {
        brand_name: 'PacificoWeb',
        return_url: `${process.env.FRONTEND_URL}/payment-success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled`,
        user_action: 'SUBSCRIBE_NOW',
      },
    });

    const payPalResponse = await paypalClient.execute(payPalRequest);
    const paypalSubscriptionId = payPalResponse.result.id;

    const { error: updateError } = await supabaseAdmin
      .from('suscripciones')
      .update({ paypal_subscription_id: paypalSubscriptionId })
      .eq('id', subscriptionId)
      .eq('usuario_uuid', userUuid);

    if (updateError) {
      throw new Error(`Error al guardar el paypal_subscription_id: ${updateError.message}`);
    }
    
    return response.status(200).json({ paypalSubscriptionId });

  } catch (err) {
    console.error('Error al crear la suscripción de PayPal:', err.message);
    return response.status(500).json({ error: 'Error interno del servidor.' });
  }
}
