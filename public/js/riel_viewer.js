// public/js/riel_viewer.js

// --- ESTADO GLOBAL ---
let store = {};
let products = [];
let shoppingCart = {}; // { productId: quantity }

// --- FUNCIONES DE UTILIDAD ---
const $ = id => document.getElementById(id);
const escapeHTML = (s) => (s || '').toString().replace(/[&<"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c]);

function getPublicImageUrl(pathOrUrl) {
    if (!pathOrUrl) return 'https://placehold.co/400x400/f0f4f8/64748b?text=Producto';
    if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) return pathOrUrl;
    const config = window.SUPABASE_CONFIG;
    if (!config || !config.url || !config.bucket) {
        console.error("Supabase config is missing.");
        return 'https://placehold.co/400x400/f0f4f8/ff0000?text=Error';
    }
    const supabaseUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
    return `${supabaseUrl}storage/v1/object/public/${config.bucket}/${pathOrUrl}`;
}

// --- LÓGICA DE RENDERIZADO (NUEVO DISEÑO) ---

function renderHeader() {
    const headerContainer = $('store-header');
    if (!headerContainer) return;

    const storeName = escapeHTML(store.nombre) || "Tienda Riel";
    const initial = storeName.charAt(0).toUpperCase();
    const phoneNumber = store.whatsapp ? store.whatsapp.replace(/\D/g, '') : '';
    const whatsappUrl = phoneNumber ? `https://wa.me/${phoneNumber}` : '#';

    headerContainer.innerHTML = `
        <div class="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden flex flex-col items-center text-center">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-indigo-900 opacity-20 rounded-full -ml-5 -mb-5 blur-xl"></div>
            
            <div class="flex items-center gap-2 mb-2 z-10">
                <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-bold text-xl border border-white/30">
                    ${initial}
                </div>
                <h1 class="text-3xl font-bold tracking-tight text-white">${storeName}</h1>
            </div>
            
            <h2 class="text-indigo-100 text-sm font-medium mb-4">Descubre lo mejor para ti</h2>
            
            <a href="${whatsappUrl}" target="_blank" class="flex items-center gap-2 bg-white text-indigo-600 px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-colors shadow-sm w-full justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 0 0 12 21.9a9.9 9.9 0 0 0 7-3 8 8 0 0 0-4-3h-3a5 5 0 0 0-4 2z"/><path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4z"/></svg>
                Contactar por WhatsApp
            </a>
        </div>
    `;
}

function renderProducts() {
    const gridContainer = $('products-grid');
    const productCountEl = $('product-count');

    if (productCountEl) {
        productCountEl.textContent = `${products.length} productos`;
    }

    if (!gridContainer) return;
    if (!products || products.length === 0) {
        gridContainer.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10">No hay productos en esta tienda todavía.</p>';
        return;
    }

    gridContainer.innerHTML = products.map(product => {
        const imageUrl = getPublicImageUrl(product.imageUrl);
        const price = Number(product.precio_base || 0);
        const currency = product.currency || store.currency || 'USD';
        const id = product.idLocal;

        return `
            <div class="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 flex flex-col">
              <div class="relative aspect-[4/5] w-full bg-gray-100 rounded-xl overflow-hidden mb-3">
                <img src="${imageUrl}" alt="${escapeHTML(product.nombre)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              </div>
              <div class="flex-1 flex flex-col">
                <h4 class="font-semibold text-slate-800 text-sm leading-tight mb-2 line-clamp-2">${escapeHTML(product.nombre)}</h4>
                <div class="mt-auto flex items-center justify-between">
                  <span class="font-bold text-slate-900 text-base">${currency} ${price.toFixed(2)}</span>
                  <div id="add-to-cart-container-${id}" class="h-8">
                     <!-- Botón se renderiza dinámicamente -->
                  </div>
                </div>
              </div>
            </div>
        `;
    }).join('');
}

function renderBottomNav() {
    const navContainer = $('bottom-nav-container');
    if (!navContainer) return;

    navContainer.innerHTML = `
        <div class="bg-slate-900/90 backdrop-blur-lg text-white rounded-full p-2 pl-6 pr-2 shadow-2xl shadow-slate-900/20 flex items-center justify-between border border-white/10">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-300 font-medium uppercase">Total</span>
            <span id="cart-total-price" class="font-bold text-sm">$0.00 USD</span>
          </div>
          <button data-action="open-cart" class="bg-white text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-100 transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            <span class="ml-1">Ver Carrito</span>
            <span id="cart-count" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-900 hidden">0</span>
          </button>
        </div>
    `;
}

// --- LÓGICA DE ACTUALIZACIÓN DE UI ---

function updateProductButton(productId) {
    const container = $(`add-to-cart-container-${productId}`);
    if (!container) return;
    const quantity = shoppingCart[productId];
    if (!quantity) {
        container.innerHTML = `
            <button data-action="add-to-cart" data-product-id="${productId}" class="w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>`;
    } else {
        container.innerHTML = `
            <div class="flex items-center justify-end w-full">
              <button data-action="decrement" data-product-id="${productId}" class="w-8 h-8 bg-slate-200 text-slate-800 rounded-l-lg font-bold hover:bg-slate-300 transition">-</button>
              <span class="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-800 font-bold text-sm">${quantity}</span>
              <button data-action="increment" data-product-id="${productId}" class="w-8 h-8 bg-slate-200 text-slate-800 rounded-r-lg font-bold hover:bg-slate-300 transition">+</button>
            </div>`;
    }
}

function updateAllProductButtons() {
    if (!products) return;
    products.forEach(p => updateProductButton(p.idLocal));
}

function updateCartTotal() {
    const cartCountEl = $('cart-count');
    const cartTotalPriceEl = $('cart-total-price');
    const currency = store.currency || 'USD';
    let totalItems = 0;
    let totalPrice = 0;

    for (const productId in shoppingCart) {
        const product = products.find(p => p.idLocal === productId);
        if (product) {
            const quantity = shoppingCart[productId];
            totalItems += quantity;
            totalPrice += (Number(product.precio_base) || 0) * quantity;
        }
    }
    
    if (cartCountEl) {
        cartCountEl.textContent = totalItems;
        cartCountEl.classList.toggle('hidden', totalItems === 0);
    }
    if (cartTotalPriceEl) {
        cartTotalPriceEl.textContent = `${totalPrice.toFixed(2)} ${currency}`;
    }
}

// --- LÓGICA DEL CARRITO ---
function handleCartClick(productId, operation) {
    const currentQuantity = shoppingCart[productId] || 0;
    if (operation === 'add' && currentQuantity === 0) shoppingCart[productId] = 1;
    else if (operation === 'increment') shoppingCart[productId] = currentQuantity + 1;
    else if (operation === 'decrement') {
        if (currentQuantity > 1) shoppingCart[productId] = currentQuantity - 1;
        else delete shoppingCart[productId];
    }
    updateProductButton(productId);
    updateCartTotal();
}

function renderCartSummary() {
    // ... (la lógica interna del modal puede permanecer igual por ahora) ...
    const body = $('cart-modal-body');
    const cartItems = Object.keys(shoppingCart);
    const currency = store.currency || 'USD';

    if (cartItems.length === 0) {
      body.innerHTML = `<p class="text-center text-slate-500 py-10">Tu carrito está vacío.</p>
        <div class="mt-6 text-right"><button disabled class="bg-slate-300 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">Ordenar por WhatsApp</button></div>`;
      return;
    }
    let totalUnits = 0;
    let totalPrice = 0;
    const productRows = cartItems.map(productId => {
      const product = products.find(p => p.idLocal === productId);
      if (!product) return '';
      const quantity = shoppingCart[productId];
      const unitPrice = Number(product.precio_base || 0);
      totalUnits += quantity;
      totalPrice += unitPrice * quantity;
      return `<tr class="border-b border-slate-100">
          <td class="p-3 font-medium text-slate-800">${escapeHTML(product.nombre)}</td>
          <td class="p-3 text-center">${quantity}</td>
          <td class="p-3 text-right">${currency} ${unitPrice.toFixed(2)}</td>
        </tr>`;
    }).join('');
    body.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50"><tr class="text-left text-slate-600">
              <th class="p-3 font-semibold">Producto</th><th class="p-3 font-semibold text-center">Cantidad</th><th class="p-3 font-semibold text-right">Precio Unit.</th>
          </tr></thead>
          <tbody>${productRows}</tbody>
        </table>
      </div>
      <div class="mt-6 p-4 bg-slate-50 rounded-lg space-y-2">
        <div class="flex justify-between"><span class="text-slate-600">Unidades Totales:</span><span class="font-semibold text-slate-800">${totalUnits}</span></div>
        <div class="flex justify-between text-lg font-bold text-slate-800 border-t pt-2 mt-2"><span>Total a Pagar:</span><span>${currency} ${totalPrice.toFixed(2)}</span></div>
      </div>
      <div class="mt-6 text-right">
        <button data-action="confirm-order" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition">Ordenar por WhatsApp</button>
      </div>`;
}

function generateWhatsAppMessage() {
    // ... (lógica sin cambios)
    const currency = store.currency || 'USD';
    let message = `*¡Hola! 👋 Me gustaría hacer un pedido:*

`;
    let totalPrice = 0;
    Object.keys(shoppingCart).forEach(productId => {
        const product = products.find(p => p.idLocal === productId);
        if (!product) return;
        const quantity = shoppingCart[productId];
        const unitPrice = Number(product.precio_base || 0);
        totalPrice += unitPrice * quantity;
        message += `• ${escapeHTML(product.nombre)} (x${quantity})
`;
    });
    message += `
*Total del Pedido:* ${currency} ${totalPrice.toFixed(2)}

¡Gracias!`;
    const phoneNumber = store.whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// --- MODAL ---
function openCartModal() {
    renderCartSummary();
    $('cart-modal').classList.remove('hidden');
}
function closeCartModal() {
    $('cart-modal').classList.add('hidden');
}

// --- MANEJADOR DE EVENTOS ---
function attachEventListeners() {
    document.body.addEventListener('click', function(event) {
        const target = event.target.closest('[data-action]');
        if (!target) return;
        const { action, productId } = target.dataset;
        switch(action) {
            case 'add-to-cart': handleCartClick(productId, 'add'); break;
            case 'increment': handleCartClick(productId, 'increment'); break;
            case 'decrement': handleCartClick(productId, 'decrement'); break;
            case 'open-cart': openCartModal(); break;
            case 'confirm-order': generateWhatsAppMessage(); break;
        }
    });
    $('cart-modal-close').addEventListener('click', closeCartModal);
    $('cart-modal').addEventListener('click', (e) => e.target.id === 'cart-modal' && closeCartModal());
}

// --- PUNTO DE ENTRADA ---
function main() {
    try {
        if (!window.STORE_DATA || !window.STORE_DATA.store) {
            throw new Error('STORE_DATA no está disponible.');
        }
        store = window.STORE_DATA.store;
        products = window.STORE_DATA.products || [];
        renderHeader();
        renderProducts();
        renderBottomNav(); // Cambiado de renderCartButton a renderBottomNav
        updateAllProductButtons();
        updateCartTotal();
        attachEventListeners();
    } catch (error) {
        console.error("Error fatal durante la inicialización del visualizador Riel:", error);
        document.body.innerHTML = '<p class="text-red-500 text-center mt-10">Ocurrió un error al cargar la tienda.</p>';
    }
}

document.addEventListener('DOMContentLoaded', main);
