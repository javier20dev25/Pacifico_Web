const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');
const { supabaseAdmin } = require('../services/supabase'); // Import supabaseAdmin client

const conversationHistories = new Map();

const SYSTEM_PROMPT = `Eres Asistente Web IA — un asistente experto para dueños de tiendas PacíficoWeb. Tu rol: apoyar a emprendedores con respuestas prácticas, accionables y cortas sobre temas empresariales y técnicos relacionados a su tienda online, basándote en el contexto de su negocio que se te proporciona. Responde siempre en español latinoamericano.

Alcance (temas PERMITIDOS):
- Analizar el contexto de negocio proporcionado para responder preguntas.
- Estrategia comercial, contabilidad, marketing, operaciones y soporte técnico básico.

Prohibido / temas que debes rechazar:
- No des consejos médicos, legales, ni financieros de alto riesgo. Sugiere consultar a un profesional.

Estilo y limitaciones de respuesta (imprescindible):
- MUY conciso: Máximo 5 líneas o 60 palabras. Usa viñetas o listas.`;

// --- NUEVO: Función para obtener y formatear el contexto del negocio ---
async function getAndFormatBusinessContext(userId) {
  try {
    const [topProductsRes, topRevenueRes, fastestPayersRes, yellowListRes, planUsageRes] = await Promise.all([
      supabaseAdmin.rpc('get_top_products', { p_user_id: userId, p_limit: 3 }),
      supabaseAdmin.rpc('get_top_products_by_revenue', { p_user_id: userId, p_limit: 3 }),
      supabaseAdmin.rpc('get_fastest_paying_customers', { p_user_id: userId, p_limit: 3 }),
      supabaseAdmin.rpc('get_customers_with_overdue_orders', { p_user_id: userId }),
      supabaseAdmin.rpc('get_payment_plan_usage', { p_user_id: userId }),
    ]);

    let context = '\n--- CONTEXTO DE NEGOCIO EN TIEMPO REAL ---\n';

    if (yellowListRes.data && yellowListRes.data.length > 0) {
      context += `* Clientes con Deudas: ${yellowListRes.data.length}\n`;
    }
    if (topProductsRes.data && topProductsRes.data.length > 0) {
      context += `* Top Productos (Cantidad): ${topProductsRes.data.map(p => p.product_name).join(', ')}\n`;
    }
    if (topRevenueRes.data && topRevenueRes.data.length > 0) {
      context += `* Top Productos (Ingresos): ${topRevenueRes.data.map(p => p.product_name).join(', ')}\n`;
    }
    if (fastestPayersRes.data && fastestPayersRes.data.length > 0) {
        context += `* Clientes de Pago Rápido: ${fastestPayersRes.data.map(p => p.customer_name).join(', ')}\n`;
    }
    if (planUsageRes.data && planUsageRes.data.length > 0) {
        context += `* Planes Más Usados: ${planUsageRes.data.map(p => `${p.plan_name} (${p.usage_count})`).join(', ')}\n`;
    }

    context += '------------------------------------------\n';
    return context;
  } catch (error) {
    console.error("Error fetching business context:", error);
    return '\n--- CONTEXTO DE NEGOCIO NO DISPONIBLE ---\n';
  }
}

router.post('/', protect, async (req, res) => {
  const userMessage = req.body.message;
  const userId = req.user?.id; // Usar el ID de la base de datos
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!userMessage) return res.status(400).json({ error: 'No se ha proporcionado ningún mensaje.' });
  if (!userId) return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
  if (!geminiApiKey) return res.status(500).json({ error: 'La API Key de Gemini no está configurada.' });

  try {
    let session = conversationHistories.get(userId);
    if (!session) {
      session = { history: [], lastAccessed: Date.now() };
      conversationHistories.set(userId, session);
    }
    session.lastAccessed = Date.now();

    // --- LÓGICA MEJORADA: Inyectar contexto ---
    const businessContext = await getAndFormatBusinessContext(userId);
    const finalPrompt = `${SYSTEM_PROMPT}${businessContext}\nEl usuario pregunta: "${userMessage}"`;

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Aseguramos el modelo correcto

    const chat = model.startChat({ history: session.history });
    const result = await chat.sendMessage(finalPrompt);
    const response = await result.response;
    const text = response.text();

    session.history.push({ role: 'user', parts: [{ text: userMessage }] });
    session.history.push({ role: 'model', parts: [{ text }] });

    if (session.history.length > 20) { // Reducido para prompts más grandes
      session.history = session.history.slice(-20);
    }

    res.json({ response: text });
  } catch (error) {
    console.error('Error al contactar la API de Gemini:', error);
    res.status(500).json({ error: 'Error interno al comunicarse con el asistente de IA.' });
  }
});

// ... Lógica de auto-limpieza sin cambios ...

// ========================================================== 
// RUTA PÚBLICA PARA EL CHATBOT DE VENTAS
// ========================================================== 
const PUBLIC_SYSTEM_PROMPT = `Eres un Asistente de Ventas IA para la tienda "{store_name}". Tu objetivo es ayudar a los clientes a tomar decisiones de compra y responder sus dudas de forma amigable, profesional y proactiva. 

REGLAS ESTRICTAS:
1.  **Contexto es Rey:** Basa TODAS tus respuestas únicamente en la "INFORMACIÓN DE LA TIENDA" que se te proporciona. No inventes productos, precios, políticas o detalles que no estén en el contexto.
2.  **Foco en la Venta:** Sé proactivo. Si un cliente pregunta por un producto, además de dar detalles, sugiere productos relacionados o destaca sus beneficios. Tu meta es guiar al cliente hacia el carrito de compras.
3.  **Manejo de Desconocimiento (Fallback a WhatsApp):** Si una pregunta no puede ser respondida con la información proporcionada (ej. "¿pueden conseguir el producto X en color rojo?" y el color no está en los datos), NO digas "No lo sé". En su lugar, redirige amablemente al cliente al WhatsApp del vendedor usando este formato EXACTO: "Para detalles más específicos como ese, te recomiendo consultarlo directamente con un asesor por WhatsApp. ¡Te atenderán de maravilla! Puedes contactarlos aquí: {whatsapp_link}".
4.  **Tono:** Amigable, servicial y un poco entusiasta. Usa emojis de forma moderada para hacer la conversación más cercana (ej. 😊, ✨, 🚀).
5.  **Respuestas Cortas:** Mantén tus respuestas concisas y fáciles de leer en un chat.`;

function formatStoreContextForAI(storeData) {
  let context = '\n--- INFORMACIÓN DE LA TIENDA ---\n';
  context += `Nombre: ${storeData.store.nombre}\n`;
  context += `Descripción: ${storeData.store.descripcion}\n`;
  context += `Moneda: ${storeData.store.currency}\n`;

  if (storeData.products && storeData.products.length > 0) {
    context += '\n**Productos Disponibles:**\n';
    storeData.products.forEach(p => {
      context += `- Nombre: ${p.nombre}\n`;
      context += `  Descripción: ${p.descripcion}\n`;
      if (p.precio_final_aereo) context += `  Precio Aéreo: ${p.precio_final_aereo.toFixed(2)} ${storeData.store.currency}\n`;
      if (p.precio_final_maritimo) context += `  Precio Marítimo: ${p.precio_final_maritimo.toFixed(2)} ${storeData.store.currency}\n`;
      if (p.precio_final_stock) context += `  Precio Stock: ${p.precio_final_stock.toFixed(2)} ${storeData.store.currency}\n`;
      if (p.tags) context += `  Tags: ${p.tags.join(', ')}\n`;
    });
  }

  context += '\n**Logística y Envíos:**\n';
  if (storeData.store.isLogisticsDual) {
    context += `- Ofrecemos envíos aéreos (${storeData.store.airMinDays}-${storeData.store.airMaxDays} días) y marítimos (${storeData.store.seaMinDays}-${storeData.store.seaMaxDays} días).\n`;
  }
  context += `Política de Delivery: ${storeData.store.delivery_note || 'Consultar con el vendedor'}.\n`;

  context += '------------------------------------\n';
  return context;
}

router.post('/public', async (req, res) => {
  const { store_slug, history } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!store_slug || !history) {
    return res.status(400).json({ error: 'Faltan datos (slug de tienda o historial).' });
  }
  if (!geminiApiKey) return res.status(500).json({ error: 'La API Key de Gemini no está configurada.' });

  try {
    // 1. Obtener datos de la tienda para el contexto
    const { data: store, error: storeError } = await supabaseAdmin.from('stores').select('data').eq('slug', store_slug).single();

    if (storeError || !store) {
      return res.status(404).json({ error: 'Tienda no encontrada.' });
    }

    const storeData = store.data;
    const userMessage = history[history.length - 1].parts[0].text;

    // 2. Preparar el prompt para la IA
    const whatsappNumber = storeData.store.whatsapp?.replace(/\s+|-/g, '') || '';
    const whatsappLink = `https://wa.me/${whatsappNumber}`;
    const finalSystemPrompt = PUBLIC_SYSTEM_PROMPT
      .replace('{store_name}', storeData.store.nombre)
      .replace('{whatsapp_link}', whatsappLink);
    
    const storeContext = formatStoreContextForAI(storeData);
    const finalUserMessage = `${storeContext}\nEl cliente pregunta: "${userMessage}"`;

    // 3. Llamar a la API de Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: finalSystemPrompt }] },
        { role: 'model', parts: [{ text: '¡Hola! 😊 ¿En qué puedo ayudarte a encontrar hoy en la tienda?' }] },
        ...history
      ]
    });

    const result = await chat.sendMessage(finalUserMessage);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error en el chat público de IA:', error);
    res.status(500).json({ error: 'No se pudo obtener una respuesta del asistente.' });
  }
});

module.exports = router;