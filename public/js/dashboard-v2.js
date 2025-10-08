// ==========================================================
// 1. HELPER DE SEGURIDAD PARA MANIPULACIÓN DEL DOM
// ==========================================================
function safeSetText(id, text) {
  try {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = text ?? '';
    } else {
      console.warn('[safeSetText] Elemento no encontrado:', id);
    }
  } catch (err) {
    console.error('[safeSetText] Error al escribir en el DOM:', id, err);
  }
}

// ==========================================================
// 2. LÓGICA PRINCIPAL DEL DASHBOARD
// ==========================================================
async function initDashboard() {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    const [profileResponse, storesResponse] = await Promise.all([
      fetch('/api/user/profile', { headers }),
      fetch('/api/user/stores', { headers })
    ]);

    if (!profileResponse.ok) throw new Error('No se pudo cargar el perfil.');
    const profilePayload = await profileResponse.json();
    const user = profilePayload.user || profilePayload;
    
    safeSetText('user-name', user.nombre || 'Usuario');
    safeSetText('user-email', user.correo || '-');
    safeSetText('user-plan', user.plan || 'Sin plan');
    safeSetText('user-status', user.status || '-');

    if (!storesResponse.ok) throw new Error('No se pudieron cargar las tiendas.');
    const stores = await storesResponse.json();
    renderStoreManagement(stores, headers);

    // Añadir listeners de eventos principales después de cargar todo
    setupEventListeners();

  } catch (error) {
    console.error('[initDashboard] Error cargando datos:', error);
    showErrorBanner(error.message);
  }
}

function renderStoreManagement(stores, headers) {
    const wrapper = document.getElementById('store-management-wrapper');
    if (!wrapper) return;

    if (stores.length === 0) {
        wrapper.innerHTML = `<div class="text-center neomorphic-card p-8"><p class="text-gray-500 mb-4">Aún no has creado tu tienda.</p><a href="/templates/baseplantillaediciontiendas.html" class="neomorphic-btn">➕ Crear mi Primera Tienda</a></div>`;
        return;
    }

    const store = stores[0];
    const storeName = store.nombre || 'Mi Tienda';
    const publicUrl = store.slug ? `${window.location.origin}/store/${store.slug}` : '#';

    document.querySelector('#stores-container h2').textContent = storeName;

    wrapper.innerHTML = `
        <div class="neomorphic-card p-4">
            <div class="aspect-w-16 aspect-h-9 border-2 border-gray-200 rounded-lg overflow-hidden mb-4 bg-gray-100">
                <iframe src="${publicUrl}" class="w-full h-full"></iframe>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/templates/baseplantillaediciontiendas.html" class="neomorphic-btn w-full sm:w-auto text-center">✏️ Editar Tienda</a>
                <button id="share-store-btn" class="neomorphic-btn w-full sm:w-auto">🔗 Compartir Enlace</button>
                <button id="delete-store-btn" class="neomorphic-btn w-full sm:w-auto hover:!text-red-500">🗑️ Eliminar</button>
            </div>
        </div>
    `;
}

function showErrorBanner(msg){
  let b = document.getElementById('error-banner');
  if(!b){
    b = document.createElement('div');
    b.id = 'error-banner';
    b.style = 'background:#fee;color:red;border:1px solid #f99;padding:10px;margin:8px;position:fixed;top:10px;left:10px;right:10px;z-index:1000;border-radius:8px;text-align:center;';
    document.body.prepend(b);
  }
  b.textContent = msg;
  setTimeout(() => { b.style.display = 'none'; }, 5000);
}

// ==========================================================
// 3. LÓGICA DEL GESTOR DE PEDIDOS
// ==========================================================

async function handleProcessOrder() {
    const text = document.getElementById('whatsapp-order-input').value;
    if (!text) {
        alert('Por favor, pega el texto del pedido de WhatsApp.');
        return;
    }
    try {
        const parsedOrder = parseOrderText(text);
        renderProcessedOrder(parsedOrder);
        await saveOrder(parsedOrder);
        alert('¡Pedido procesado y guardado con éxito!');
    } catch (error) {
        showErrorBanner(`Error al procesar el pedido: ${error.message}`);
    }
}

function parseOrderText(text) {
    const order = { products: [], raw_message: text };
    const headerRegex = /^ \[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+):/m;
    const headerMatch = text.match(headerRegex);
    order.order_date = headerMatch ? new Date(`${headerMatch[1].split('/').reverse().join('-')}T${headerMatch[2]}`) : new Date();
    order.customer_name = headerMatch ? headerMatch[3] : 'Desconocido';

    const productRegex = /- (.+?) \(x(\d+)\) - [A-Z]{3} (\d+\.\d{2})/g;
    let productMatch;
    while ((productMatch = productRegex.exec(text)) !== null) {
        order.products.push({
            name: productMatch[1].trim(),
            quantity: parseInt(productMatch[2], 10),
            price: parseFloat(productMatch[3])
        });
    }

    const totalRegex = /\*Total a Pagar:\* [A-Z]{3} (\d+\.\d{2})/;
    const totalMatch = text.match(totalRegex);
    order.total_price = totalMatch ? parseFloat(totalMatch[1]) : 0;

    if (order.products.length === 0) {
        throw new Error('No se encontraron productos con el formato esperado.');
    }
    return order;
}

function renderProcessedOrder(order) {
    const outputDiv = document.getElementById('processed-order-output');
    const downloadBtn = document.getElementById('download-invoice-btn');
    let tableHTML = `
        <div id="invoice-to-download" class="p-4 bg-white border rounded-lg">
            <h4 class="font-bold text-lg mb-4">Factura de Pedido</h4>
            <p><b>Cliente:</b> ${order.customer_name}</p>
            <p><b>Fecha:</b> ${new Date(order.order_date).toLocaleString()}</p>
            <table class="w-full mt-4 text-sm text-left">
                <thead class="bg-gray-100"><tr><th class="p-2">Producto</th><th class="p-2">Cant.</th><th class="p-2">Precio</th></tr></thead>
                <tbody>`;
    order.products.forEach(p => {
        tableHTML += `<tr><td class="p-2 border-t">${p.name}</td><td class="p-2 border-t">${p.quantity}</td><td class="p-2 border-t">C$${p.price.toFixed(2)}</td></tr>`;
    });
    tableHTML += `</tbody><tfoot class="font-bold"><tr class="border-t-2"><td class="p-2" colspan="2">Total</td><td class="p-2">C$${order.total_price.toFixed(2)}</td></tr></tfoot></table></div>`;
    outputDiv.innerHTML = tableHTML;
    if(downloadBtn) downloadBtn.classList.remove('hidden');
}

async function downloadInvoiceAsImage() {
    const invoiceElement = document.getElementById('invoice-to-download');
    if (!invoiceElement) return alert('No se encontró la factura para descargar.');
    try {
        const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true });
        const imageURL = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = imageURL;
        downloadLink.download = `factura_${order.customer_name || 'cliente'}_${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    } catch (error) {
        console.error('Error al generar la imagen:', error);
        alert('Hubo un error al generar la imagen.');
    }
}

async function saveOrder(order) {
    const token = localStorage.getItem('jwt_token');
    const response = await fetch('/api/user/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(order)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo guardar el pedido.');
    }
    return response.json();
}

// ==========================================================
// 4. EVENT LISTENERS
// ==========================================================

function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-button');
    if(logoutBtn) logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });

    const processOrderBtn = document.getElementById('process-order-btn');
    if(processOrderBtn) processOrderBtn.addEventListener('click', handleProcessOrder);

    const downloadInvoiceBtn = document.getElementById('download-invoice-btn');
    if(downloadInvoiceBtn) downloadInvoiceBtn.addEventListener('click', downloadInvoiceAsImage);

    // Listeners para el Chat de IA
    const chatSendBtn = document.getElementById('chat-send-btn');
    if(chatSendBtn) chatSendBtn.addEventListener('click', handleSendMessage);

    const chatInput = document.getElementById('chat-input');
    if(chatInput) chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    
    // Listeners para la gestión de la tienda (se añaden en renderStoreManagement)
}

// ==========================================================
// 5. LÓGICA DEL CHAT DE IA
// ==========================================================

async function handleSendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    addMessageToChatUI(message, 'user');
    input.value = '';
    
    addMessageToChatUI('...', 'ai', true);

    try {
        const jwtToken = localStorage.getItem('jwt_token');
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ message })
        });

        const typingIndicator = document.getElementById('typing-indicator');
        if(typingIndicator) typingIndicator.remove();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'El asistente no pudo responder.');
        }

        const data = await response.json();
        addMessageToChatUI(data.response, 'ai');

    } catch (error) {
        const typingIndicator = document.getElementById('typing-indicator');
        if(typingIndicator) typingIndicator.remove();
        addMessageToChatUI(`Error: ${error.message}`, 'ai', false, true);
    }
}

function addMessageToChatUI(message, sender, isTyping = false, isError = false) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;

    const messageContainer = document.createElement('div');
    messageContainer.className = `chat-message ${sender === 'user' ? 'user-message' : 'ai-message'}`;

    if (isTyping) {
        messageContainer.id = 'typing-indicator';
    }

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = sender === 'user' ? 'TÚ' : 'IA';

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    if (isTyping) {
        bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    } else {
        bubble.innerHTML = message; // Usar innerHTML para renderizar <strong>, <br>, etc.
    }
    
    if (isError) {
        bubble.style.backgroundColor = '#fecaca';
        bubble.style.color = '#991b1b';
    }

    if (sender === 'user') {
        messageContainer.appendChild(bubble);
        messageContainer.appendChild(avatar);
    } else {
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(bubble);
    }

    const initialMessage = messagesDiv.querySelector('.text-gray-500');
    if (initialMessage) {
        initialMessage.remove();
    }

    messagesDiv.appendChild(messageContainer);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ==========================================================
// 5. PUNTO DE ENTRADA
// ==========================================================
document.addEventListener('DOMContentLoaded', initDashboard);
