import { state } from './state.js';
import { renderAll } from './render.js';
import { showToast } from './utils.js';
import { selectors } from './config.js';
import { getCurrencySymbol } from './utils.js';

// --- Lógica del Carrito ---

function addToCart(productId) {
    if (!state.cart[productId]) {
        state.cart[productId] = 0;
    }
    state.cart[productId] += 1;
    showToast('¡Añadido al carrito!');
    renderAll();
}

function updateQuantity(productId, change) {
    if (!state.cart[productId] && change < 1) {
        return; // No hacer nada si se intenta reducir de 0
    }
    state.cart[productId] += change;
    if (state.cart[productId] < 0) {
        state.cart[productId] = 0;
    }
    renderAll();
}

function deleteFromCart(productId) {
    if (state.cart[productId]) {
        delete state.cart[productId];
        renderAll();
    }
}

// --- Renderizado del Carrito ---

export function renderCart() {
    const { cart, storeState } = state;
    const { products, store } = storeState;
    const symbol = getCurrencySymbol(store.currency);

    const cartItems = Object.keys(cart).filter(id => cart[id] > 0);
    const totalItems = cartItems.reduce((sum, id) => sum + cart[id], 0);

    // 1. Actualizar Burbuja del Carrito
    if (selectors.cartBubble) {
        if (totalItems > 0) {
            selectors.cartBubble.classList.remove('hidden');
            selectors.cartBadge.textContent = totalItems;
        } else {
            selectors.cartBubble.classList.add('hidden');
        }
    }

    // 2. Renderizar Panel del Carrito
    if (!selectors.cartPanel) return;

    let totalAir = 0;
    let totalSea = 0;
    let totalWeight = 0;

    const itemsHTML = cartItems.map(id => {
        const product = products.find(p => p.idLocal === id);
        if (!product) return '';

        const quantity = cart[id];
        totalAir += (product.precio_final_aereo || 0) * quantity;
        totalSea += (product.precio_final_maritimo || 0) * quantity;
        totalWeight += (product.peso_lb || 0) * quantity;

        return `
            <div class="flex items-center gap-4 py-3 border-b border-gray-200">
                <img src="${product.imageUrl || 'https://via.placeholder.com/100x100.png?text=IMG'}" class="w-16 h-16 rounded-md object-cover">
                <div class="flex-grow">
                    <p class="font-bold text-sm">${product.nombre}</p>
                    <p class="text-xs text-gray-500">Cantidad: ${quantity}</p>
                    <div class="flex items-center border border-gray-200 rounded-full w-fit mt-1">
                        <button onclick="updateQuantity('${id}', -1)" class="w-6 h-6 text-base text-gray-500 rounded-l-full">-</button>
                        <span class="px-2 text-sm font-semibold">${quantity}</span>
                        <button onclick="updateQuantity('${id}', 1)" class="w-6 h-6 text-base text-gray-500 rounded-r-full">+</button>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-bold text-sm">${symbol}${(product.precio_final_aereo || product.costo_base_final).toFixed(2)}</p>
                    <button onclick="deleteFromCart('${id}')" class="text-xs text-red-500 hover:underline mt-1">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    const footerHTML = `
        <div class="p-4 border-t border-gray-200 space-y-3">
            <div class="flex justify-between text-sm font-semibold">
                <span>Subtotal (${totalItems} productos)</span>
                <span>${symbol}${totalAir.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-sm">
                <span>Peso Total Estimado</span>
                <span>${totalWeight.toFixed(2)} lbs</span>
            </div>
            <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p class="font-bold text-blue-800">Costo Total Final</p>
                <div class="flex justify-center gap-6 mt-2">
                    ${totalAir > 0 ? `<div class="text-lg font-bold">✈️ ${symbol}${totalAir.toFixed(2)}</div>` : ''}
                    ${totalSea > 0 ? `<div class="text-lg font-bold">🚢 ${symbol}${totalSea.toFixed(2)}</div>` : ''}
                </div>
            </div>
            <button id="checkoutBtn" class="w-full bg-purple-600 text-white font-bold py-3 rounded-lg hover:bg-purple-700 transition-colors">Proceder al Pedido</button>
        </div>
    `;

    selectors.cartPanel.innerHTML = `
        <div class="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 class="text-xl font-bold">Tu Carrito</h2>
            <button id="closeCartBtn" class="text-2xl text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <div class="flex-grow p-4 overflow-y-auto">
            ${cartItems.length > 0 ? itemsHTML : '<p class="text-center text-gray-500 mt-10">Tu carrito está vacío.</p>'}
        </div>
        ${cartItems.length > 0 ? footerHTML : ''}
    `;
}

// Exportamos las funciones que queremos que sean globales
export { addToCart, updateQuantity, deleteFromCart };
