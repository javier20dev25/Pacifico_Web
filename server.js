require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Importar fs.promises para leer archivos
const { supabaseAdmin } = require('./backend/services/supabase'); // Importar supabaseAdmin
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

const bodyParser = require('body-parser');

// Middlewares
// Configuración de body-parser para capturar el raw body, necesario para la verificación del webhook de PayPal
app.use(bodyParser.json({
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    // Guardar el buffer raw en el objeto de la petición
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  },
}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Security Middlewares
// Desactivar Helmet en entorno de test para evitar posibles conflictos con supertest
if (process.env.NODE_ENV !== 'test') {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'frame-ancestors': ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
          'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://ka-f.fontawesome.com'],
          'img-src': ["'self'", "data:", "*.supabase.co"],
          'connect-src': ["'self'", "https://ka-f.fontawesome.com"],
          'frame-src': ["'self'", "https://www.youtube.com"], // <-- AÑADIDO
        },
      },
    })
  );
}
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// --- DEBUG TEMPORAL: log de todas las peticiones HTTP ---
app.use((req, res, next) => {
  console.log(`[HTTP] ${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Ruta pública de prueba para depuración desde el navegador
app.get('/__debug/ping', (req, res) => {
  console.log('[DEBUG] /__debug/ping recibido desde el cliente');
  res.json({ ok: true, serverTime: new Date().toISOString() });
});

// NUEVA RUTA DE DEBUGGING PARA LOGS DEL CLIENTE
app.post('/api/debug/log', (req, res) => {
  const message = req.body.message || 'Mensaje de debug vacío';
  console.log(`[CLIENT-SIDE LOG] ${message}`);
  res.status(200).send({ status: 'logged' });
});

// Rutas de la API
const authRoutes = require('./backend/api/auth');
const adminRoutes = require('./backend/api/admin');
const userRoutes = require('./backend/api/user');
const chatRoutes = require('./backend/api/chat');
const uploadRoutes = require('./backend/api/uploads');
const statisticsRoutes = require('./backend/api/statistics');
const orderRoutes = require('./backend/api/orders');
const rielRoutes = require('./backend/api/riel'); // <-- AÑADIDO
const paypalRoutes = require('./backend/api/paypal');
const { protect, isAdmin } = require('./backend/middleware/auth');

// --- Rutas Públicas de la API (sin autenticación) ---
const plansRoutes = require('./backend/api/plans');
app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes); // La ruta de prueba de subida es pública
app.use('/api/riel', rielRoutes); // <-- AÑADIDO
app.use('/api/plans', plansRoutes); // <-- NUEVA RUTA DE PLANES
app.use('/api/paypal', paypalRoutes); // <-- RUTA DE PAYPAL AHORA ES MIXTA (PÚBLICA/PRIVADA)

// --- NUEVO ENDPOINT PÚBLICO PARA EXPLICACIÓN DE PEDIDOS CON IA ---
const { GoogleGenerativeAI } = require('@google/generative-ai');

app.post('/api/explain-order', async (req, res) => {
  const { cart, selections, totals, store } = req.body;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return res.status(500).json({ error: 'La clave de API para el servicio de IA no está configurada.' });
  }
  if (!cart || !selections || !totals || !store) {
    return res.status(400).json({ error: 'Faltan datos del pedido para generar la explicación.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `Eres un asistente de compras experto, amigable y profesional. Tu tarea es explicar un resumen de pedido a un cliente de forma clara, humana y tranquilizadora, siguiendo estrictamente el siguiente formato y tono.

**Formato OBLIGATORIO:**

¡Hola! Aquí tienes un resumen claro de tu pedido:

👉 **Monto a pagar hoy:** [MONTO_HOY]
Explica brevemente qué incluye este pago (ej. "Este es el primer pago de tu compra más los costos iniciales.").

🧾 **Total de tu pedido:** [MONTO_TOTAL]

💰 **Saldo pendiente:** [MONTO_PENDIENTE]
Si hay saldo pendiente, explica que se pagará con el plan elegido (ej. "Este monto lo pagarás más adelante con el plan que elegiste:"). Si no hay saldo pendiente, omite esta sección.

📅 **Plan seleccionado:**
Si hay plan de cuotas, detállalo aquí (ej. "3 quincenas de [MONTO_CUOTA] cada una."). Si no hay plan de cuotas, omite esta sección.

---
Si todo está claro y estás de acuerdo, puedes hacer clic en 'Confirmar Pedido' para finalizar tu compra.

**Reglas CRÍTICAS:**
- **NO USES MARKDOWN.** No uses asteriscos (*) para negritas ni ningún otro formato. Toda la salida debe ser texto plano.
- Usa exactamente los emojis y la estructura de la plantilla.
- Sé conciso y directo, mantén un tono amigable y profesional.
- Responde siempre en español latinoamericano.`;

    // Formatear el resumen del pedido para que la IA lo entienda
    let orderSummary = 'Resumen del Pedido:\n';
    orderSummary += `Moneda: ${store.currency || 'USD'}\n`;
    for (const item of cart) {
        orderSummary += `- Producto: ${item.name}, Cantidad: ${item.quantity}\n`;
    }
    orderSummary += `\nOpciones seleccionadas:\n`;
    orderSummary += `- Método de envío: ${selections.shippingMethod || 'No especificado'}\n`;
    orderSummary += `- Método de pago: ${selections.paymentMethod || 'No especificado'}\n`;
    orderSummary += `- Plan de pago: ${selections.paymentPlan ? `Adelanto del ${selections.paymentPlan}%` : 'Pago completo'}\n`;
    if (selections.wantsDelivery) {
        orderSummary += `- Solicita delivery.\n`;
    }
    if (selections.selectedInstallment) {
        const [cuotas, tipo] = selections.selectedInstallment.split('-');
        orderSummary += `- Plan de cuotas para el saldo: ${cuotas} ${tipo}.\n`;
    }

    orderSummary += `\nTotales:\n`;
    orderSummary += `- Total del Pedido: ${totals.grandTotal}\n`;
    orderSummary += `- Monto a Pagar Hoy: ${totals.amountToPay}\n`;
    orderSummary += `- Saldo Pendiente: ${totals.pendingAmount}\n`;
    
    const finalPrompt = `${systemPrompt}\n\nAquí está el pedido del cliente para que lo expliques:\n${orderSummary}`;

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ explanation: text });

  } catch (error) {
    console.error('Error en /api/explain-order:', error);
    res.status(500).json({ error: 'No se pudo generar la explicación. Por favor, inténtalo de nuevo.' });
  }
});


// --- Rutas Protegidas de la API (requieren autenticación) ---
app.use('/api/stats', protect, statisticsRoutes);
app.use('/api/orders', protect, orderRoutes);
app.use('/api/admin', protect, isAdmin, adminRoutes);
app.use('/api/user', protect, userRoutes);
app.use('/api/chat', protect, chatRoutes);


// ==========================================================
// NUEVA RUTA DINÁMICA PARA TIENDAS (por slug)
// ==========================================================

// Función auxiliar con reintentos para hacer la consulta a Supabase más robusta
async function fetchStoreWithRetries(slug, retries = 3, delay = 100) {
  for (let i = 0; i < retries; i++) {
    try {
      // CORREGIDO: Seleccionar todas las columnas para tener toda la información.
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*') 
        .eq('slug', slug)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 es "not found"
        throw error;
      }
      return { data, error };
    } catch (e) {
      console.error(`Intento ${i + 1} fallido para obtener slug '${slug}':`, e.message);
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Función para sanear los datos de la tienda (ahora solo sanea productos)
function sanitizeStoreData(products) {
  if (!Array.isArray(products)) return [];

  return products.map(product => ({
    ...product,
    precio_base: Number(product.precio_base) || 0,
    precio_final_aereo: Number(product.precio_final_aereo) || 0,
    precio_final_maritimo: Number(product.precio_final_maritimo) || 0,
    peso_lb: Number(product.peso_lb) || 0,
  }));
}

app.get('/store/:slug', async (req, res, next) => {
  const storeSlug = req.params.slug;
  console.log(`[GET /store/:slug] 1. Iniciando proceso para slug: "${storeSlug}"`);

  try {
    // 1. Obtener los datos completos de la tienda
    const { data: storeRecord, error } = await fetchStoreWithRetries(storeSlug);
    console.log(`[GET /store/:slug] 2. Resultado de fetchStoreWithRetries:`, { store: storeRecord, error: error ? { message: error.message, code: error.code } : null });

    if (error) {
      console.error(`[GET /store/:slug] 3a. Error de base de datos detectado:`, error.message);
      return res.status(500).send('Error al consultar la base de datos.');
    }
    if (!storeRecord) {
      console.error(`[GET /store/:slug] 3b. La consulta no devolvió una tienda (slug no encontrado).`);
      return res.status(404).send(`Tienda con slug "${storeSlug}" no encontrada.`);
    }

    // --- INICIO: Tarea 5 - Lógica para encontrar Riel asociado ---
    let associatedRielSlug = null;
    if (storeRecord.usuario_id && storeRecord.store_type !== 'riel') {
      const { data: rielStore } = await supabaseAdmin
        .from('stores')
        .select('slug')
        .eq('usuario_id', storeRecord.usuario_id)
        .eq('store_type', 'riel')
        .eq('activa', true)
        .limit(1)
        .single();
      
      if (rielStore) {
        associatedRielSlug = rielStore.slug;
        console.log(`[GET /store/:slug] Riel asociado encontrado con slug: ${associatedRielSlug}`);
      }
    }
    // --- FIN: Tarea 5 ---

    // 2. Construir el objeto 'previewData' que el frontend espera
    const products = storeRecord.products || [];
    const sanitizedProducts = sanitizeStoreData(products);
    
    const { products: productsColumn, ...storeDataForClient } = storeRecord;

    const previewData = {
      store: storeDataForClient,
      products: sanitizedProducts,
      riel_slug: associatedRielSlug, // Inyectar el slug del Riel asociado
    };
    
    console.log(`[GET /store/:slug] 4. Datos de la tienda validados y reestructurados. Procediendo a leer la plantilla HTML.`);
    
    console.log(`[DEBUG TEMPLATE] Verificando tipo de tienda. Valor: '${storeRecord.store_type}', Tipo: ${typeof storeRecord.store_type}`);

    // 3. Determinar qué plantilla usar y leer el archivo HTML
    let templatePath;
    if (storeRecord.store_type === 'riel') {
      templatePath = path.join(__dirname, 'public', 'riel_viewer_template.html');
    } else {
      templatePath = path.join(__dirname, 'public', 'viewer_template.html');
    }
    let viewerHtml = await fs.readFile(templatePath, 'utf8');

    // 4. Inyectar los datos en la plantilla
    const supabaseConfig = {
      url: process.env.SUPABASE_URL,
      bucket: process.env.STORAGE_BUCKET || 'imagenes',
    };

    const injectedScript = `<script type="module">
      window.STORE_DATA = ${JSON.stringify(previewData).replace(/<\/script/gi, '<\\/script')};
      window.SUPABASE_CONFIG = ${JSON.stringify(supabaseConfig).replace(/<\/script/gi, '<\\/script')};
    </script>`;
    
    viewerHtml = viewerHtml.replace('__DATA_INJECTION_POINT__', injectedScript);
    viewerHtml = viewerHtml.replace(/__CACHE_BUST_VERSION__/g, Date.now());

    console.log(`[GET /store/:slug] 5. Inyección de datos completada. Enviando HTML al cliente.`);
    res.send(viewerHtml);

  } catch (error) {
    console.error(`[GET /store/:slug] 6. Error fatal en el bloque try/catch:`, error);
    next(error);
  }
});

// =========================================================
// SERVE STATIC FILES
// =========================================================
// CORREGIDO: Apuntar al directorio 'dist' de la build de React
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'react-editor', 'dist')));


// =========================================================
// SERVE REACT APP (Single Page Application)
// =========================================================
// El catch-all handler: para cualquier request que no sea de API o de tienda,
// manda el index.html de React para que el routing del cliente funcione.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'react-editor', 'dist', 'index.html'));
});

// =========================================================
// ERROR HANDLING MIDDLEWARE (debe ser el último)
// =========================================================
const errorHandler = require('./backend/middleware/errorHandler');
app.use(errorHandler);

// Solo iniciar el servidor si el script se ejecuta directamente
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
