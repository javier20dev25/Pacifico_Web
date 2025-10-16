const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Mapa en memoria para guardar historiales con timestamp
const conversationHistories = new Map();

const SYSTEM_PROMPT = `Eres Asistente Web IA — un asistente experto para dueños de tiendas PacíficoWeb. Tu rol: apoyar a emprendedores con respuestas prácticas, accionables y cortas sobre temas empresariales y técnicos relacionados a su tienda online. Responde siempre en español latinoamericano.

Alcance (temas PERMITIDOS):
- Estrategia comercial y de precios (márgenes, costes, estructura de precios).
- Contabilidad básica y control de costos.
- Marketing y ventas (copy, email marketing, SEO local).
- Redacción de mensajes para clientes, incluyendo respuestas y comunicados por WhatsApp.
- Operaciones y logística (envíos, gestión de inventario).
- UX / CRO (mejoras en la tienda).
- Soporte técnico básico (integraciones, errores comunes).

Prohibido / temas que debes rechazar:
- No des consejos médicos, legales, ni financieros de alto riesgo. En su lugar, sugiere consultar a un profesional licenciado.

Estilo y limitaciones de respuesta (imprescindible):
- MUY conciso: Máximo 5 líneas o 60 palabras. Usa viñetas o listas numeradas para claridad.
- Tonalidad: Profesional, cercana y práctica.`;

router.post('/', async (req, res) => {
    const userMessage = req.body.message;
    const userUuid = req.user?.uuid;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!userMessage) return res.status(400).json({ error: 'No se ha proporcionado ningún mensaje.' });
    if (!userUuid) return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
    if (!geminiApiKey) return res.status(500).json({ error: 'La API Key de Gemini no está configurada.' });

    try {
        // Obtener o crear la sesión de historial para el usuario
        let session = conversationHistories.get(userUuid);
        if (!session) {
            session = { history: [], lastAccessed: Date.now() };
            conversationHistories.set(userUuid, session);
        }
        session.lastAccessed = Date.now(); // Actualizar timestamp

        // Determinar si se está enviando un prompt completo o un simple mensaje
        const finalPrompt = req.body.prompt || `${SYSTEM_PROMPT}\n\nEl usuario dice: "${userMessage}"`;

        // Inicializar el cliente y el modelo de Gemini
        const genAI = new GoogleGenerativeAI(geminiApiKey);
                // Modelo especificado por Astaroth para todos los proyectos.
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        console.log(`[DEBUG] Enviando prompt a ${model.model}...`);

        // Iniciar el chat y enviar el mensaje/prompt
        const chat = model.startChat({ history: session.history });
        const result = await chat.sendMessage(finalPrompt);
        const response = await result.response;
        const text = response.text();

        // Actualizar el historial solo para chats interactivos, no para análisis puntuales
        if (!req.body.prompt) {
            session.history.push({ role: 'user', parts: [{ text: userMessage }] });
            session.history.push({ role: 'model', parts: [{ text }] });
        }

        // Limitar el historial
        if (session.history.length > 40) {
            session.history = session.history.slice(-40);
        }

        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
        res.json({ response: formattedText });

    } catch (error) {
        console.error('Error al contactar la API de Gemini:', error);
        res.status(500).json({ error: 'Error interno al comunicarse con el asistente de IA.' });
    }
});

// --- LÓGICA DE AUTO-LIMPIEZA DE MEMORIA ---
const INACTIVE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 horas
const CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos

setInterval(() => {
    const now = Date.now();
    console.log(`[INFO] Ejecutando limpieza de historiales de chat inactivos...`);
    let purgedCount = 0;
    for (const [userUuid, session] of conversationHistories.entries()) {
        if (now - session.lastAccessed > INACTIVE_TIMEOUT_MS) {
            conversationHistories.delete(userUuid);
            purgedCount++;
        }
    }
    if (purgedCount > 0) {
        console.log(`[INFO] Se purgaron ${purgedCount} conversaciones inactivas.`);
    }
}, CLEANUP_INTERVAL_MS);

module.exports = router;