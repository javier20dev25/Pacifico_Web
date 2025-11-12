const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { supabaseAdmin } = require('../services/supabase');
const conversationHistories = new Map();
const SYSTEM_PROMPT =
  'Eres Asistente Web IA — un asistente experto para dueños de tiendas PacíficoWeb. Tu rol: apoyar a emprendedores con respuestas prácticas, accionables y cortas sobre temas empresariales y técnicos relacionados a su tienda online. Responde siempre en español latinoamericano.\n\nAlcance (temas PERMITIDOS):\n- Estrategia comercial y de precios.\n- Contabilidad básica y control de costos.\n- Marketing y ventas.\n- Redacción de mensajes para clientes.\n- Operaciones y logística.\n- Mejoras en la tienda.\n- Soporte técnico básico.\n\nProhibido / temas que debes rechazar:\n- No des consejos médicos, legales, ni financieros de alto riesgo. En su lugar, sugiere consultar a un profesional licenciado.\n\nEstilo y limitaciones de respuesta (imprescindible):\n- MUY conciso: Máximo 5 líneas o 60 palabras. Usa viñetas o listas numeradas para claridad.';
function createContextFromStoreData(storeData) {
  if (!storeData) return '';
  let context = '\n\n--- CONTEXTO DE LA TIENDA ---\n';

  if (storeData.store) {
    context += `Nombre de la tienda: ${storeData.store.nombre || 'N/A'}\n`;
    context += `Descripción: ${storeData.store.descripcion || 'N/A'}\n`;
  }
  if (storeData.products && storeData.products.length > 0) {
    context += '\nProductos:\n';
    storeData.products.forEach((p) => {
      context += `- ${p.nombre}: Precio Aéreo: $${p.precio_final_aereo?.toFixed(2) || 'N/A'}, Precio Marítimo: $${p.precio_final_maritimo?.toFixed(2) || 'N/A'}, Peso: ${p.peso_lb || 0} lb\n`;
    });
  }
  if (storeData.payment) {
    context += '\nMétodos de Pago Activos:\n';
    for (const [key, value] of Object.entries(storeData.payment)) {
      if (value.enabled) {
        context += `- ${value.label || key}\n`;
      }
    }
  }
  context += '--- FIN DEL CONTEXTO ---\n';
  return context;
}
router.post('/', async (req, res) => {
  const userMessage = req.body.message;
  const userUuid = req.user?.uuid;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!userMessage || !userUuid || !geminiApiKey) {
    return res
      .status(400)
      .json({ error: 'Faltan datos esenciales (mensaje, usuario o API Key).' });
  }
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Usar el modelo especificado    // 1. Triaje: Preguntar a la IA si se necesita contexto
    const triagePrompt = `¿La siguiente pregunta de un usuario requiere conocimiento específico sobre los productos, precios, inventario o reglas de envío de su tienda online para ser respondida correctamente? Responde únicamente "SÍ" o "NO". Pregunta: "${userMessage}"`;
    const triageResult = await model.generateContent(triagePrompt);
    const triageResponse = await triageResult.response;
    const triageDecision = triageResponse.text().trim().toUpperCase();
    let finalPrompt = '';
    let storeContext = ''; // 2. Si se necesita contexto, buscarlo y construir el prompt completo
    if (triageDecision.includes('SÍ')) {
      console.log(
        '[DEBUG CHAT] Se necesita contexto. Buscando datos de la tienda...'
      );
      const { data: userRec } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('uuid', userUuid)
        .single();
      const usuarioId = userRec?.id;
      if (usuarioId) {
        const { data: store } = await supabaseAdmin
          .from('stores')
          .select('data')
          .eq('usuario_id', usuarioId)
          .single();
        storeContext = createContextFromStoreData(store?.data);
      }
    }
    finalPrompt = `${storeContext}${SYSTEM_PROMPT}\n\nHistorial de la conversación:\n${(conversationHistories.get(userUuid)?.history || []).map((h) => `${h.role}: ${h.parts[0].text}`).join('\n')}\n\nPregunta del usuario: "${userMessage}"`; // 3. Generar la respuesta final
    const chat = model.startChat({
      history: conversationHistories.get(userUuid)?.history || [],
    });
    const result = await chat.sendMessage(finalPrompt);
    const response = await result.response;
    const text = response.text(); // 4. Actualizar historial
    let session = conversationHistories.get(userUuid);
    if (!session) {
      session = { history: [], lastAccessed: Date.now() };
      conversationHistories.set(userUuid, session);
    }
    session.lastAccessed = Date.now();
    session.history.push({ role: 'user', parts: [{ text: userMessage }] });
    session.history.push({ role: 'model', parts: [{ text }] });
    if (session.history.length > 20) {
      session.history = session.history.slice(-20);
    }
    res.json({ response: text });
  } catch (error) {
    console.error('Error en la API de Chat:', error);
    res
      .status(500)
      .json({ error: 'Error interno al comunicarse con el asistente de IA.' });
  }
}); // Lógica de auto-limpieza (sin cambios)
const INACTIVE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  let purgedCount = 0;
  for (const [userUuid, session] of conversationHistories.entries()) {
    if (now - session.lastAccessed > INACTIVE_TIMEOUT_MS) {
      conversationHistories.delete(userUuid);
      purgedCount++;
    }
  }
  if (purgedCount > 0) {
    console.log(
      `[INFO CHAT] Se purgaron ${purgedCount} conversaciones inactivas.`
    );
  }
}, CLEANUP_INTERVAL_MS);
module.exports = router;
