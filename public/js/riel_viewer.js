// public/js/riel_viewer.js

// --- ESTADO GLOBAL ---
let store = {};
let products = [];
let shoppingCart = {}; // {productId: quantity} 

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

// --- LÓGICA DE RENDERIZADO ---

function renderHeader() {
    const storeNameEl = $('store-name');
    const contactContainer = $('contact-button-container');

    if (storeNameEl) {
        storeNameEl.textContent = escapeHTML(store.nombre);
    }

    if (contactContainer && store.whatsapp) {
        const phoneNumber = store.whatsapp.replace(/\D/g, '');
        contactContainer.innerHTML = `
            <a href="https://wa.me/${phoneNumber}" target="_blank" class="inline-block bg-emerald-500 text-white font-bold py-2 px-5 rounded-full hover:bg-emerald-600 transition-colors">
                Contactar por WhatsApp
            </a>
        `;
    }
}

function renderProducts() {
    const gridContainer = $('products-grid');
    if (!gridContainer) return;

    if (!products || products.length === 0) {
        gridContainer.innerHTML = '<p class="col-span-full text-center text-slate-500">No hay productos en esta tienda todavía.</p>';
        return;
    }

    gridContainer.innerHTML = products.map(product => {
        const imageUrl = getPublicImageUrl(product.imageUrl);
        const price = Number(product.precio_base || 0);
        const currency = product.currency || store.currency || 'USD';
        const id = product.idLocal;

        return `
            <div class="product-card bg-white rounded-lg overflow-hidden shadow-md flex flex-col">
                <div class="w-full aspect-square bg-slate-100">
                    <img src="${imageUrl}" alt="Imagen de ${escapeHTML(product.nombre)}" class="w-full h-full object-cover">
                </div>
                <div class="p-3 flex-grow flex flex-col">
                    <h3 class="font-bold text-sm text-slate-800 truncate flex-grow">${escapeHTML(product.nombre)}</h3>
                    <p class="text-lg font-extrabold text-slate-900 mt-1">${currency} ${price.toFixed(2)}</p>
                </div>
                <div class="p-3 border-t border-slate-100" id="add-to-cart-container-${id}">
                    <!-- El botón de añadir se renderizará aquí -->
                </div>
            </div>
        `;
    }).join('');
}

function renderCartButton() {
    const cartContainer = $('cart-button-container');
    if (!cartContainer) return;
    cartContainer.innerHTML = `
        <button id="cart-button" data-action="open-cart" class="fixed bottom-5 right-5 w-16 h-16 bg-indigo-600 text-white rounded-full font-semibold text-sm hover:bg-indigo-700 transition shadow-lg flex items-center justify-center z-40">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span id="cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white hidden">0</span>
        </button>
    `;
}

// --- LÓGICA DE ACTUALIZACIÓN DE UI ---

function updateProductButton(productId) {
    const container = $(`add-to-cart-container-${productId}`);
    if (!container) return;

    const quantity = shoppingCart[productId];

    if (!quantity) {
        container.innerHTML = `
          <button data-action="add-to-cart" data-product-id="${productId}" class="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-bold hover:bg-indigo-200 transition text-sm">
              Añadir
          </button>
        `;
    } else {
        container.innerHTML = `
          <div class="flex items-center justify-center w-full">
              <button data-action="decrement" data-product-id="${productId}" class="px-4 py-2 bg-slate-200 text-slate-800 rounded-l-lg font-bold hover:bg-slate-300 transition">-</button>
              <span class="px-5 py-2 bg-slate-100 text-slate-800 font-bold text-lg">${quantity}</span>
              <button data-action="increment" data-product-id="${productId}" class="px-4 py-2 bg-slate-200 text-slate-800 rounded-r-lg font-bold hover:bg-slate-300 transition">+</button>
          </div>
        `;
    }
}

function updateAllProductButtons() {
    products.forEach(p => updateProductButton(p.idLocal));
}

function updateCartTotal() {
    const cartCountEl = $('cart-count');
    if (!cartCountEl) return;
    const totalItems = Object.values(shoppingCart).reduce((sum, quantity) => sum + quantity, 0);
    cartCountEl.textContent = totalItems;
    cartCountEl.classList.toggle('hidden', totalItems === 0);
}

// --- LÓGICA DEL CARRITO ---

function handleCartClick(productId, operation) {
    const currentQuantity = shoppingCart[productId] || 0;
    if (operation === 'add' && currentQuantity === 0) {
        shoppingCart[productId] = 1;
    } else if (operation === 'increment') {
        shoppingCart[productId] = currentQuantity + 1;
    } else if (operation === 'decrement') {
        if (currentQuantity > 1) {
            shoppingCart[productId] = currentQuantity - 1;
        } else {
            delete shoppingCart[productId];
        }
    }
    updateProductButton(productId);
    updateCartTotal();
}

function renderCartSummary() {
    const body = $('cart-modal-body');
    const cartItems = Object.keys(shoppingCart);
    const currency = store.currency || 'USD';

    if (cartItems.length === 0) {
      body.innerHTML = `
        <p class="text-center text-slate-500 py-10">Tu carrito está vacío.</p>
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

      return `
        <tr class="border-b border-slate-100">
          <td class="p-3 font-medium text-slate-800">${escapeHTML(product.nombre)}</td>
          <td class="p-3 text-center">${quantity}</td>
          <td class="p-3 text-right">${currency} ${unitPrice.toFixed(2)}</td>
        </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr class="text-left text-slate-600">
              <th class="p-3 font-semibold">Producto</th>
              <th class="p-3 font-semibold text-center">Cantidad</th>
              <th class="p-3 font-semibold text-right">Precio Unit.</th>
            </tr>
          </thead>
          <tbody>${productRows}</tbody>
        </table>
      </div>
      <div class="mt-6 p-4 bg-slate-50 rounded-lg space-y-2">
        <div class="flex justify-between"><span class="text-slate-600">Unidades Totales:</span><span class="font-semibold text-slate-800">${totalUnits}</span></div>
        <div class="flex justify-between text-lg font-bold text-slate-800 border-t pt-2 mt-2"><span>Total a Pagar:</span><span>${currency} ${totalPrice.toFixed(2)}</span></div>
      </div>
      <div class="mt-6 text-right">
        <button data-action="confirm-order" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition">Ordenar por WhatsApp</button>
      </div>
    `;
}

function generateWhatsAppMessage() {
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
        message += `• ${product.nombre} (x${quantity})
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
        renderCartButton();
        updateAllProductButtons();
        updateCartTotal();
        attachEventListeners();

    } catch (error) {
        console.error("Error fatal durante la inicialización del visualizador Riel:", error);
        document.body.innerHTML = '<p class="text-red-500 text-center mt-10">Ocurrió un error al cargar la tienda.</p>';
    }
}

document.addEventListener('DOMContentLoaded', main);