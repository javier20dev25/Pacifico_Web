// public/js/riel_viewer.js - VERSIÓN FINAL CON CORRECCIONES DE ANIMACIÓN

// ====================================================================
// ESTADO GLOBAL Y CONFIGURACIÓN
// ====================================================================
let store = {};
let products = [];
let cart = {};
let history = [];
let currentIndex = 0;
let sessionId = null;
let storeId = null;
let isDragging = false;
let dragStart = { x: 0, y: 0 };
let dragOffset = { x: 0, y: 0 };
let animatingOutDirection = null;
let showPromptAnimation = true;

// ====================================================================
// FUNCIONES DE UTILIDAD
// ====================================================================
const $ = id => document.getElementById(id);
const escapeHTML = (s) => (s || '').toString().replace(/[&<"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const formatPrice = (price, currency) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'USD' }).format(price);
const triggerHaptic = () => { if (navigator.vibrate) navigator.vibrate(50); };
function generateSimpleUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
const getPublicImageUrl = (pathOrUrl) => {
    if (!pathOrUrl) return 'https://placehold.co/800x1000/f0f4f8/64748b?text=Producto';
    if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) return pathOrUrl;
    const config = window.SUPABASE_CONFIG;
    if (!config || !config.url || !config.bucket) return 'https://placehold.co/800x1000/f0f4f8/ff0000?text=Error';
    const supabaseUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
    return `${supabaseUrl}storage/v1/object/public/${config.bucket}/${pathOrUrl}`;
};

// ====================================================================
// LÓGICA DE SESIÓN Y ANALÍTICAS
// ====================================================================
function generateSessionId() {
    let sid = localStorage.getItem('riel_session_id');
    if (!sid) {
        sid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : generateSimpleUUID();
        localStorage.setItem('riel_session_id', sid);
    }
    sessionId = sid;
}
async function postVisit() {
    if (!storeId || !sessionId) return;
    try {
        await fetch('/api/riel/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ store_id: storeId, session_id: sessionId }) });
    } catch (e) { console.error("Failed to post visit:", e); }
}
async function postInteraction(productId, interactionType) {
    if (!storeId || !sessionId) return;
    try {
        await fetch('/api/riel/interactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ store_id: storeId, product_id_local: productId, interaction_type: interactionType, session_id: sessionId }) });
    } catch (e) { console.error("Failed to post interaction:", e); }
}

// ====================================================================
// LÓGICA DEL CARRITO
// ====================================================================
function handleCartClick(productId, operation) {
    if (!productId) return;
    triggerHaptic();
    const currentQuantity = cart[productId] || 0;
    if (operation === 'add' && currentQuantity === 0) cart[productId] = 1;
    else if (operation === 'increment') cart[productId] = (currentQuantity || 0) + 1;
    else if (operation === 'decrement') {
        if (currentQuantity > 1) cart[productId] -= 1;
        else delete cart[productId];
    }
    const modal = $('cart-modal');
    if (modal && !modal.classList.contains('hidden')) renderCartSummary();
    updateUI();
}

// ====================================================================
// LÓGICA DE SWIPE
// ====================================================================
const handlePointerDown = (e) => {
    if (animatingOutDirection) return;
    showPromptAnimation = false;
    isDragging = true;
    dragStart = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY };
    const card = $('card-active');
    if (card) card.classList.add('dragging');
};
const handlePointerMove = (e) => {
    if (!isDragging || animatingOutDirection) return;
    const clientX = e.clientX || e.touches?.[0].clientX;
    const clientY = e.clientY || e.touches?.[0].clientY;
    dragOffset = { x: clientX - dragStart.x, y: clientY - dragStart.y };
    updateUI();
};
const handlePointerUp = () => {
    if (!isDragging) return;
    isDragging = false;
    const card = $('card-active');
    if (card) card.classList.remove('dragging');
    const threshold = 100;
    const { x, y } = dragOffset;
    if (Math.abs(x) > Math.abs(y)) {
        if (x > threshold) completeSwipe('right');
        else if (x < -threshold) completeSwipe('left');
        else resetCardPosition();
    } else {
        if (y > threshold) completeSwipe('down');
        else if (y < -threshold) completeSwipe('up');
        else resetCardPosition();
    }
};
function resetCardPosition() {
    dragOffset = { x: 0, y: 0 };
    updateUI();
}
function completeSwipe(direction) {
    if (animatingOutDirection) return;
    triggerHaptic();
    animatingOutDirection = direction;
    const currentProduct = products[currentIndex % products.length];
    if (currentProduct) {
        const interactionMap = { 'right': 'like', 'left': 'nope', 'up': 'nope', 'down': 'add_to_cart' };
        const interaction = interactionMap[direction];
        if (interaction) postInteraction(currentProduct.idLocal, interaction);
        if (direction === 'down') handleCartClick(currentProduct.idLocal, 'add');
    }
    updateUI();
    // CORRECCIÓN: Aumentar timeout para dar tiempo a la animación CSS de 0.4s
    setTimeout(() => {
        history.push(currentIndex);
        currentIndex += 1;
        animatingOutDirection = null;
        dragOffset = { x: 0, y: 0 };
        showPromptAnimation = false;
        updateUI();
    }, 500); // 500ms > 400ms de la animación
}
function handleUndo() {
    if (history.length === 0 || animatingOutDirection) return;
    triggerHaptic();
    currentIndex = history.pop();
    updateUI();
}

// ====================================================================
// LÓGICA DE RENDERIZADO
// ====================================================================
function renderHeader() {
    const headerEl = $('store-header');
    if (!headerEl) return;
    const storeName = escapeHTML(store.nombre) || "Tienda Riel";
    headerEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" class="text-white"><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>${storeName}</span>`;
}
function renderControls() {
    const footerEl = $('controls-footer');
    if (!footerEl) return;
    footerEl.innerHTML = `<div class="absolute bottom-44 left-0 w-full px-6 z-40 flex items-center justify-center gap-4 sm:gap-6"><button data-action="nope" class="w-16 h-16 rounded-full bg-white/90 shadow-xl text-red-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all backdrop-blur-sm"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button><button data-action="undo" id="undo-button" class="w-14 h-14 rounded-full bg-white/90 shadow-xl text-yellow-500 flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50 backdrop-blur-sm"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/></svg></button><button data-action="like" class="w-16 h-16 rounded-full bg-white/90 shadow-xl text-green-500 flex items-center justify-center hover:scale-125 active:scale-95 transition-all backdrop-blur-sm"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-all drop-shadow-[0_0_15px_rgba(52,211,163,0.7)]"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button></div><div class="absolute bottom-16 left-0 w-full px-6 z-40"><div id="bottom-nav-container"></div></div>`;
}
function updateCartTotal() {
    const navContainer = $('bottom-nav-container');
    if (!navContainer) return;
    const cartItemsCount = Object.values(cart).reduce((a, b) => a + b, 0);
    navContainer.innerHTML = `<div class="flex justify-center gap-3 w-full"><button data-action="add-to-cart" class="bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-700 active:scale-95 transition-all text-base ${cartItemsCount > 0 ? 'flex-1' : 'w-full'}"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Añadir al Carrito</button>${cartItemsCount > 0 ? `<button data-action="open-cart" class="bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl font-bold flex items-center justify-center gap-2 backdrop-blur-md border border-white/20 text-base hover:bg-gray-700 active:scale-95 transition-all w-fit min-w-[120px]"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>(${cartItemsCount})</button>` : ''}</div>`;
    const undoButton = $('undo-button');
    if (undoButton) undoButton.disabled = history.length === 0;
}
function renderCards() {
    const swipeArea = $('swipe-area');
    if (!swipeArea) throw new Error("Elemento #swipe-area no encontrado.");
    const currentProduct = products[currentIndex % products.length];
    const nextProduct = products[(currentIndex + 1) % products.length];
    if (!currentProduct) { swipeArea.innerHTML = `<div class="text-center p-10"><p class="text-slate-500">No hay más productos.</p></div>`; return; }
    const cardHTML = (product, isActive) => {
        if (!product) return '';
        const imageUrl = getPublicImageUrl(product.imageUrl);
        const price = Number(product.precio_base) || 0;
        return `<div id="card-${isActive ? 'active' : 'next'}" class="card-container absolute inset-0 p-2 z-${isActive ? '20' : '0'} flex flex-col ${!isActive ? 'pointer-events-none' : ''}"><div class="relative w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"><div class="relative h-[65%] w-full overflow-hidden"><img src="${imageUrl}" class="w-full h-full object-cover" draggable="false" /><div class="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-white/90 to-transparent pointer-events-none"></div></div><div class="flex-1 w-full p-6 pt-0 flex flex-col justify-between relative z-10 bg-white"><div class="pb-12"><h2 class="text-3xl font-bold text-gray-900 leading-snug mb-2">${escapeHTML(product.nombre)}</h2><p class="text-4xl font-black text-emerald-600">${formatPrice(price, store.currency)}</p></div></div>${isActive ? `<div class="absolute inset-0 pointer-events-none z-30"><div style="opacity: ${Math.max(0, dragOffset.x) / 100}" class="absolute top-10 left-8 border-4 border-green-500 text-green-500 text-5xl font-black px-4 py-2 rounded-xl -rotate-12 bg-white/30 backdrop-blur-md">LIKE</div><div style="opacity: ${Math.max(0, -dragOffset.x) / 100}" class="absolute top-10 right-8 border-4 border-red-500 text-red-500 text-5xl font-black px-4 py-2 rounded-xl rotate-12 bg-white/30 backdrop-blur-md">NOPE</div><div style="opacity: ${Math.max(0, dragOffset.y) / 100}" class="absolute top-1/2 left-0 w-full text-center -translate-y-1/2"><span class="text-6xl font-black text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">COMPRAR</span></div><div style="opacity: ${Math.max(0, -dragOffset.y) / 100}" class="absolute bottom-20 w-full text-center"><span class="text-4xl font-black text-gray-200">DESCARTAR</span></div></div>` : ''}</div></div>`;
    };
    swipeArea.innerHTML = `${cardHTML(nextProduct, false)}${cardHTML(currentProduct, true)}`;
    const activeCard = $('card-active');
    if (activeCard) {
        if (animatingOutDirection) {
            activeCard.classList.add('animating', `out-${animatingOutDirection}`);
        } else if (isDragging) {
            activeCard.style.transform = `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x * 0.1}deg)`;
            activeCard.classList.add('dragging');
        } else {
            activeCard.style.transform = 'translate(0,0) rotate(0deg)';
            activeCard.classList.add('resetting');
            setTimeout(() => activeCard.classList.remove('resetting'), 400); // CORRECCIÓN: Limpiar clase de reseteo
        }
    }
}

// ====================================================================
// LÓGICA DEL MODAL DEL CARRITO
// ====================================================================
function openCartModal() { const modal = $('cart-modal'); if (modal) { renderCartSummary(); modal.classList.remove('hidden'); } }
function closeCartModal() { const modal = $('cart-modal'); if (modal) modal.classList.add('hidden'); }
function renderCartSummary() {
    const body = $('cart-modal-body');
    if (!body) return;
    const cartItems = Object.keys(cart);
    const currency = store.currency || 'USD';
    if (cartItems.length === 0) { body.innerHTML = `<p class="text-center text-slate-500 py-10">Tu carrito está vacío.</p><div class="mt-6 text-right"><button disabled class="bg-slate-300 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">Ordenar por WhatsApp</button></div>`; return; }
    let totalUnits = 0, totalPrice = 0;
    const productRows = Object.entries(cart).map(([id, q]) => {
        const p = products.find(prod => prod.idLocal === id);
        if (!p) return '';
        const price = Number(p.precio_base || 0);
        totalUnits += q;
        totalPrice += price * q;
        return `<tr class="border-b border-slate-100"><td class="p-3 font-medium">${escapeHTML(p.nombre)}</td><td class="p-3 text-center"><div class="flex items-center justify-center"><button data-action="decrement" data-product-id="${id}" class="px-2 py-1 bg-slate-200 rounded-l-md">-</button><span class="px-3 font-semibold">${q}</span><button data-action="increment" data-product-id="${id}" class="px-2 py-1 bg-slate-200 rounded-r-md">+</button></div></td><td class="p-3 text-right font-semibold">${formatPrice(price * q, currency)}</td></tr>`;
    }).join('');
    body.innerHTML = `<div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-50"><tr><th class="p-3 font-semibold text-left">Producto</th><th class="p-3 font-semibold text-center">Cantidad</th><th class="p-3 font-semibold text-right">Subtotal</th></tr></thead><tbody>${productRows}</tbody></table></div><div class="mt-6 p-4 bg-slate-50 rounded-lg space-y-2"><div class="flex justify-between"><span>Unidades Totales:</span><span class="font-semibold">${totalUnits}</span></div><div class="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total a Pagar:</span><span>${formatPrice(totalPrice, currency)}</span></div></div><div class="mt-6 text-right"><button data-action="confirm-order" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition">Ordenar por WhatsApp</button></div>`;
}
function generateWhatsAppMessage() {
    const currency = store.currency || 'USD';
    let message = `*¡Hola! 👋 Me gustaría hacer un pedido:*

`, totalPrice = 0;
    Object.keys(cart).forEach(id => {
        const p = products.find(prod => prod.idLocal === id);
        if (!p) return;
        const q = cart[id];
        const price = Number(p.precio_base || 0);
        totalPrice += price * q;
        message += `• ${escapeHTML(p.nombre)} (x${q})
`;
    });
    message += `
*Total del Pedido:* ${formatPrice(totalPrice, currency)}

¡Gracias!`;
    const phoneNumber = store.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// ====================================================================
// FUNCIÓN DE RENDERIZADO PRINCIPAL
// ====================================================================
function updateUI() {
    renderHeader();
    renderCards();
    renderControls();
    updateCartTotal();
}

// ====================================================================
// MANEJADORES DE EVENTOS
// ====================================================================
function attachEventListeners() {
    const swipeArea = $('swipe-area');
    if (swipeArea) {
        swipeArea.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
        document.addEventListener('pointerleave', handlePointerUp); // Previene que el drag se quede pegado si el cursor sale
    }

    document.body.addEventListener('click', e => {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        const action = target.dataset.action;
        const productId = target.dataset.productId;
        showPromptAnimation = false;
        switch (action) {
            case 'like': completeSwipe('right'); break;
            case 'nope': completeSwipe('left'); break;
            case 'undo': handleUndo(); break;
            case 'add-to-cart':
                const currentProduct = products[currentIndex % products.length];
                if (currentProduct) handleCartClick(currentProduct.idLocal, 'add');
                break;
            case 'open-cart': openCartModal(); break;
            case 'confirm-order': generateWhatsAppMessage(); break;
            case 'increment': if (productId) handleCartClick(productId, 'increment'); break;
            case 'decrement': if (productId) handleCartClick(productId, 'decrement'); break;
        }
    });
}

function injectModalAndListeners() {
    if ($('cart-modal')) return;
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `<div id="cart-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden p-4"><div id="cart-modal-content" class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"><header class="p-5 border-b border-slate-200 flex justify-between items-center"><h2 class="text-lg font-bold text-slate-800">Resumen de tu Pedido</h2><button id="cart-modal-close" class="p-2 rounded-full hover:bg-slate-100 text-slate-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></header><main id="cart-modal-body" class="p-6 space-y-6 overflow-y-auto"></main></div></div>`;
    document.body.appendChild(modalContainer);
    const modalCloseButton = $('cart-modal-close');
    if (modalCloseButton) modalCloseButton.addEventListener('click', closeCartModal);
    else throw new Error("Error: No se pudo adjuntar listener a '#cart-modal-close'.");
    const cartModal = $('cart-modal');
    if (cartModal) cartModal.addEventListener('click', e => e.target.id === 'cart-modal' && closeCartModal());
    else throw new Error("Error: No se pudo adjuntar listener a '#cart-modal'.");
}

// ====================================================================
// PUNTO DE ENTRADA
// ====================================================================
function main() {
    try {
        if (!window.STORE_DATA || !window.STORE_DATA.store) throw new Error('STORE_DATA no está disponible.');
        store = window.STORE_DATA.store;
        storeId = store.id;
        products = window.STORE_DATA.products || [];
        generateSessionId();
        postVisit();
        injectModalAndListeners();
        updateUI();
        attachEventListeners();
    } catch (error) {
        console.error("Error fatal:", error);
        const mainContainer = $('main-container');
        if (mainContainer) {
            const errorMessage = escapeHTML(error.message);
            mainContainer.innerHTML = `<div class="text-red-600 text-center p-8"><p class="font-bold text-lg">Ocurrió un error al cargar la tienda.</p><p class="text-sm mt-4 font-mono bg-red-100 p-3 rounded">Detalle del error: ${errorMessage}</p></div>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', main);