// --- ESTADO GLOBAL ---
let store = {};
let products = [];
let shoppingCart = {}; // { productId: quantity }
let orderSelections = {
  shippingMethod: null,
  paymentMethod: null,
  paymentPlan: null,
  selectedInstallment: null,
  wantsDelivery: false,
};

// --- FUNCIONES DE UTILIDAD ---
const $ = id => document.getElementById(id);
const escapeHTML = (s) => (s || '').replace(/[&<"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function getPublicImageUrl(pathOrUrl) {
  if (!pathOrUrl) return 'https://placehold.co/400x300/f4f7fa/6b7280?text=IMG';
  if (pathOrUrl.startsWith('http') || pathOrUrl.startsWith('data:')) return pathOrUrl;
  const config = window.SUPABASE_CONFIG;
  if (!config || !config.url || !config.bucket) {
      console.error("Supabase config is missing or incomplete.", config);
      return 'https://placehold.co/400x300/f4f7fa/ff0000?text=CONFIG_ERROR';
  }
  const supabaseUrl = config.url.endsWith('/') ? config.url : `${config.url}/`;
  return `${supabaseUrl}storage/v1/object/public/${config.bucket}/${pathOrUrl}`;
}

function getEmbedUrl(url) {
  if (!url) return null;
  let embedUrl = null;

  try {
    const videoUrl = new URL(url);
    const hostname = videoUrl.hostname.toLowerCase();
    const pathname = videoUrl.pathname;

    if (hostname.includes('youtube.com')) {
      if (pathname.includes('/watch')) {
        const videoId = videoUrl.searchParams.get('v');
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      } else if (pathname.includes('/shorts/')) {
        const videoId = pathname.split('/shorts/')[1].split('/')[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    } else if (hostname.includes('youtu.be')) {
      const videoId = pathname.substring(1).split('/')[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    } else if (hostname.includes('instagram.com')) {
      if (pathname.includes('/p/') || pathname.includes('/reel/')) {
        const cleanPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        embedUrl = `https://www.instagram.com${cleanPathname}/embed`;
      }
    } else if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      // For Facebook, using their video plugin is the most reliable way.
      embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`;
    }
    // For TikTok and other platforms, this function will return null,
    // which triggers the fallback `window.open(url, '_blank')` in openMediaModal.

  } catch (error) {
    console.error("Error parsing video URL:", url, error);
    return null; // If URL is invalid, fallback to the default behavior.
  }

  return embedUrl;
}

// --- LÓGICA DE MODALES ---
function openMediaModal(type, url) {
    const modal = $('media-modal');
    const contentContainer = $('media-modal-content');
    if (type === 'image') {
        contentContainer.innerHTML = `<img src="${url}" class="max-w-[90vw] max-h-[80vh] rounded-lg shadow-xl" />`;
        modal.classList.remove('hidden');
    } else if (type === 'video') {
        const embedUrl = getEmbedUrl(url);
        if (embedUrl) {
            contentContainer.innerHTML = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="rounded-lg shadow-xl bg-black max-w-[90vw] max-h-[80vh]"></iframe>`;
            modal.classList.remove('hidden');
        } else {
            window.open(url, '_blank');
        }
    }
}

function closeMediaModal() {
    const modal = $('media-modal');
    const contentContainer = $('media-modal-content');
    modal.classList.add('hidden');
    contentContainer.innerHTML = '';
}

function openCartModal() {
    const modal = $('cart-modal');
    if (window.renderCartSummary) {
        window.renderCartSummary();
    } else {
        console.error("Error: renderCartSummary no está definido en window.");
    }
    modal.classList.remove('hidden');
}

function closeCartModal() {
    const modal = $('cart-modal');
    modal.classList.add('hidden');
}

// --- LÓGICA DEL CARRITO Y RESUMEN ---
function generateWhatsAppMessage() {
    const c = store.currency || 'USD';
    let message = `*¡Hola! 👋 Quiero confirmar mi pedido:*

*Resumen de Productos:*
`;

    Object.keys(shoppingCart).forEach(productId => {
        const product = products.find(p => p.idLocal === productId);
        const quantity = shoppingCart[productId];
        if (product) message += `• ${product.nombre} (x${quantity})
`;
    });

    const productSubtotal = Object.keys(shoppingCart).reduce((total, productId) => {
        const product = products.find(p => p.idLocal === productId);
        const quantity = shoppingCart[productId];
        if (!product) return total;
        const price = orderSelections.shippingMethod === 'sea' 
            ? (product.precio_final_maritimo || 0)
            : (store.store_type === 'in_stock' ? (product.precio_base || 0) : (product.precio_final_aereo || 0));
        return total + (price * quantity);
    }, 0);

    let extraCost = 0;
    if (store.extra_cost && store.extra_cost.enabled && store.extra_cost.value > 0) {
        const { value, type } = store.extra_cost;
        if (type && type.startsWith('percentage')) extraCost = productSubtotal * (Number(value) / 100);
        else extraCost = Number(value);
    }
    
    const deliveryTotalCost = (orderSelections.wantsDelivery && store.delivery_type === 'fixed') ? (Number(store.delivery_fixed_cost) || 0) : 0;
    
    // --- LÓGICA DE PAGO ACTUALIZADA ---
    const upfrontCosts = extraCost + deliveryTotalCost;
    const productDownPayment = productSubtotal * (Number(orderSelections.paymentPlan) / 100);
    const amountToPay = productDownPayment + upfrontCosts;
    const pendingAmount = productSubtotal - productDownPayment;
    const grandTotal = productSubtotal + upfrontCosts;

    message += `
*Detalles del Pedido:*
`;
    if (store.store_type === 'by_order') {
        message += `- *Método de Envío:* ${orderSelections.shippingMethod === 'air' ? 'Aéreo ✈️' : 'Marítimo 🚢'}
`;
    }
    message += `- *Método de Pago:* ${orderSelections.paymentMethod}
`;
    message += `- *Plan de Pago:* Abono del ${orderSelections.paymentPlan}% sobre productos
`;
    
    if (orderSelections.wantsDelivery) {
        message += `- *Delivery:* Solicitado
`;
    }

    if (pendingAmount > 0.01 && orderSelections.selectedInstallment) {
        const [max, type] = orderSelections.selectedInstallment.split('-');
        if (max && type) {
            const installmentValue = (pendingAmount / Number(max)).toFixed(2);
            message += `- *Cuotas para Saldo:* ${max} ${translateInstallmentType(type)} de ${c} ${installmentValue}
`;
        }
    }

    if (extraCost > 0) {
        message += `
*Nota sobre Costo Extra:*
_${escapeHTML(store.extra_cost.description)}_
`;
    }

    message += `
*Resumen de Costos:*
`;
    message += `*- Subtotal de Productos:* ${c} ${productSubtotal.toFixed(2)}
`;
    if (extraCost > 0) message += `*- Costo Extra:* ${c} ${extraCost.toFixed(2)}
`;
    if (deliveryTotalCost > 0) message += `*- Delivery:* ${c} ${deliveryTotalCost.toFixed(2)}
`;
    message += `*- TOTAL DEL PEDIDO:* *${c} ${grandTotal.toFixed(2)}*
`;
    message += `*- MONTO A PAGAR HOY:* *${c} ${amountToPay.toFixed(2)}*
`;
    if (pendingAmount > 0.01) {
        message += `*- SALDO PENDIENTE (sobre productos):* *${c} ${pendingAmount.toFixed(2)}*
`;
    }

    message += `
¡Gracias! Espero su respuesta.`;

    const phoneNumber = store.whatsapp.replace(/\s+|-/g, '');
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
}

// --- LÓGICA DE RENDERIZADO PRINCIPAL ---
function renderHeader() {
    const headerContainer = $('store-header');
    if(!headerContainer) return;
    headerContainer.innerHTML = ''; 

    const cartContainer = $('cart-button-container');
    if(!cartContainer) return;
    cartContainer.innerHTML = `
        <button id="cart-button" data-action="open-cart" class="fixed bottom-5 right-5 w-16 h-16 bg-indigo-500 text-white rounded-full font-semibold text-sm hover:bg-indigo-600 transition shadow-lg flex items-center justify-center z-40">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            <span id="cart-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white hidden">0</span>
        </button>
    `;
}

function renderVendorProfile() {
    const profileContainer = $('vendor-profile');
    if(!profileContainer) return;
    const logoUrl = getPublicImageUrl(store.logo_url);
    const storeName = store.nombre || 'Tienda Ejemplo';
    const description = store.descripcion || 'La mejor selección de productos de calidad garantizada.';
    
    const contactButton = store.whatsapp ? `
        <a href="https://wa.me/${store.whatsapp.replace(/\s+|-/g, '')}" target="_blank" class="text-indigo-600 font-semibold hover:text-indigo-700 transition flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-2 4v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"></path></svg>
            Contactar
        </a>` : '';

    const videoButton = store.video_url ? `
        <a href="#" data-action="view-media" data-type="video" data-url="${escapeHTML(store.video_url)}" class="text-purple-600 font-semibold hover:text-purple-700 transition flex items-center">
            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            Ver Video
        </a>` : '';

    profileContainer.innerHTML = `
      <div class="flex flex-col items-center">
          <div class="w-20 h-20 rounded-full header-gradient flex items-center justify-center mb-3 overflow-hidden">
              <img src="${logoUrl}" alt="Logo de ${escapeHTML(storeName)}" class="w-full h-full object-cover cursor-pointer" data-action="view-media" data-type="image" data-url="${logoUrl}">
          </div>
          <h2 class="text-3xl font-extrabold text-gray-800">${escapeHTML(storeName)}</h2>
          <p class="text-gray-500 text-lg mt-1">${escapeHTML(description)}</p>
          <div class="flex items-center justify-center space-x-6 mt-4">
            ${contactButton}
            ${videoButton}
          </div>
      </div>
    `;
}

function renderProducts() {
    const gridContainer = $('products-grid');
    if (!gridContainer) return;
    try {
        if (!products || products.length === 0) {
            console.warn("No se encontraron productos para renderizar.");
            gridContainer.innerHTML = '<p class="text-gray-500 col-span-full text-center">No hay productos en esta tienda todavía.</p>';
            return;
        }
        console.log(`Renderizando ${products.length} producto(s).`);
        gridContainer.innerHTML = products.map(renderProductCard).join('');
        console.log("Grid de productos actualizado.");
    } catch (error) {
        console.error("Error crítico durante el renderizado de productos:", error);
        gridContainer.innerHTML = '<p class="text-red-500 col-span-full text-center">Ocurrió un error al mostrar los productos. Revisa la consola.</p>';
    }
}

function renderProductCard(product) {
    const imageUrl = getPublicImageUrl(product.imageUrl);
    const id = product.idLocal;
    const c = store.currency || 'USD';

    let pricesHtml = '';
    if (store.store_type === 'in_stock') {
        pricesHtml = `<div class="flex justify-between items-end">
                        <span class="text-base font-semibold text-gray-700 uppercase">Precio:</span>
                        <span class="text-2xl font-extrabold text-indigo-800">
${c} ${(product.precio_base || 0).toFixed(2)}</span>
                      </div>`;
    } else {
        pricesHtml = `
          <div class="flex justify-between items-end border-b pb-2 mb-2">
              <span class="text-base font-semibold text-blue-600 uppercase">AÉREO:</span>
              <span class="text-2xl font-extrabold text-blue-800">
${c} ${(product.precio_final_aereo || 0).toFixed(2)}</span>
          </div>
          <div class="flex justify-between items-end">
              <span class="text-base font-semibold text-green-600 uppercase">MARÍTIMO:</span>
              <span class="text-xl font-bold text-green-700">
${c} ${(product.precio_final_maritimo || 0).toFixed(2)}</span>
          </div>`;
    }

    let deliveryHtml = '';
    if (store.store_type === 'in_stock') {
        deliveryHtml = `<div class="flex items-center text-green-600"><svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="font-medium">Disponible</span></div>`;
    } else {
        deliveryHtml = `
          <div class="flex items-center text-blue-600">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span class="font-medium">AÉREO:</span>
              <span class="ml-auto text-gray-600 font-bold">${store.air_min_days || '7'}-${store.air_max_days || '15'} días</span>
          </div>
          <div class="flex items-center text-green-600">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span class="font-medium">MARÍTIMO:</span>
              <span class="ml-auto text-gray-600 font-bold">${store.sea_min_days || '30'}-${store.sea_max_days || '45'} días</span>
          </div>
        `;
    }

    const videoUrl = product.video_url || product.youtubeLink;
    const videoButtonHtml = videoUrl ? `
      <button data-action="view-media" data-type="video" data-url="${escapeHTML(videoUrl)}" class="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600 transition transform hover:scale-[1.02] shadow-md shadow-purple-300">
          <svg class="w-5 h-5 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          Ver Video
      </button>` : '';

    return `
      <div class="product-card bg-white rounded-xl overflow-hidden p-5 flex flex-col justify-between" data-product-id="${id}">
          <div>
              <div class="h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center border border-gray-200 overflow-hidden">
                  <img src="${imageUrl}" alt="Imagen de ${escapeHTML(product.nombre)}" class="w-full h-full object-cover cursor-pointer" data-action="view-media" data-type="image" data-url="${imageUrl}">
              </div>
              <h4 class="text-xl font-bold text-gray-800">${escapeHTML(product.nombre)}</h4>
              <p class="text-sm text-gray-500 mb-4">${escapeHTML(product.descripcion)}</p>
              <div class="mb-4">
                  ${pricesHtml}
              </div>
              <p class="text-xs font-semibold text-gray-700 mb-3">Tiempos de Entrega Estimados:</p>
              <div class="space-y-1 text-sm mb-6">
                  ${deliveryHtml}
              </div>
          </div>
          <div class="flex space-x-3 pt-4 border-t border-gray-100">
              <div id="add-to-cart-container-${id}" class="flex-1">
                  <button data-action="add-to-cart" data-product-id="${id}" class="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition transform hover:scale-[1.02] shadow-md shadow-green-300">
                      <svg class="w-5 h-5 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                      Añadir
                  </button>
              </div>
              ${videoButtonHtml}
          </div>
      </div>
    `;
}

// --- LÓGICA DEL CARRITO ---
function handleCartClick(productId, operation) {
    console.log(`handleCartClick llamado con productId: ${productId}, operacion: ${operation}`);
    const currentQuantity = shoppingCart[productId] || 0;

    if (operation === 'add') {
        if (currentQuantity === 0) {
            shoppingCart[productId] = 1;
        }
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

function updateProductButton(productId) {
    const container = $(`add-to-cart-container-${productId}`);
    if (!container) return;

    const quantity = shoppingCart[productId];

    if (!quantity) {
        container.innerHTML = `
          <button data-action="add-to-cart" data-product-id="${productId}" class="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition transform hover:scale-[1.02] shadow-md shadow-green-300">
              <svg class="w-5 h-5 inline-block mr-2 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              Añadir
          </button>
        `;
    } else {
        container.innerHTML = `
          <div class="flex items-center justify-center w-full">
              <button data-action="decrement" data-product-id="${productId}" class="px-4 py-3 bg-gray-300 text-gray-800 rounded-l-lg font-bold hover:bg-gray-400 transition">-</button>
              <span class="px-4 py-3 bg-gray-100 text-gray-800 font-bold text-lg">${quantity}</span>
              <button data-action="increment" data-product-id="${productId}" class="px-4 py-3 bg-gray-300 text-gray-800 rounded-r-lg font-bold hover:bg-gray-400 transition">+</button>
          </div>
        `;
    }
}

function updateCartTotal() {
      const cartCount = $('cart-count');
      if (!cartCount) return;

      const totalItems = Object.values(shoppingCart).reduce((sum, quantity) => sum + quantity, 0);
      
      cartCount.textContent = totalItems;
      cartCount.classList.toggle('hidden', totalItems === 0);
}

// --- MANEJADOR DE EVENTOS ---
function attachEventListeners() {
      document.body.addEventListener('click', function(event) {
          const target = event.target.closest('[data-action]');
          if (!target) return;

          console.log("Click detectado en un elemento de acción:", target);

          const { action, productId, url, type } = target.dataset;
          
          console.log(`Acción: ${action}, Producto ID: ${productId}`);

          switch(action) {
            case 'add-to-cart':
              console.log("Llamando a handleCartClick con 'add'");
              handleCartClick(productId, 'add');
              break;
            case 'increment':
              console.log("Llamando a handleCartClick con 'increment'");
              handleCartClick(productId, 'increment');
              break;
            case 'decrement':
              console.log("Llamando a handleCartClick con 'decrement'");
              handleCartClick(productId, 'decrement');
              break;
            case 'view-media':
              console.log(`Llamando a openMediaModal con tipo: ${type}`);
              if (url && type) openMediaModal(type, url);
              break;
            case 'open-cart':
              console.log("Llamando a openCartModal");
              openCartModal();
              break;
            case 'confirm-order':
              console.log("Llamando a generateWhatsAppMessage");
              generateWhatsAppMessage();
              break;
          }
      });

      if($('cart-modal-body')) {
        $('cart-modal-body').addEventListener('change', function(event) {
            const target = event.target;
            console.log(`Cambio detectado en el modal del carrito:`, target);
            if (target.name === 'shippingMethod') orderSelections.shippingMethod = target.value;
            if (target.name === 'paymentMethod') orderSelections.paymentMethod = target.value;
            if (target.name === 'paymentPlan') orderSelections.paymentPlan = target.value;
            if (target.name === 'selectedInstallment') orderSelections.selectedInstallment = target.value;
            if (target.name === 'wantsDelivery') orderSelections.wantsDelivery = target.checked;
            window.renderCartSummary();
        });
      }

      if($('media-modal-close')) $('media-modal-close').addEventListener('click', closeMediaModal);
      if($('media-modal')) $('media-modal').addEventListener('click', e => e.target.id === 'media-modal' && closeMediaModal());
      if($('cart-modal-close')) $('cart-modal-close').addEventListener('click', closeCartModal);
      if($('cart-modal')) $('cart-modal').addEventListener('click', e => e.target.id === 'cart-modal' && closeCartModal());
}

// --- PUNTO DE ENTRADA ---
function main() {
  try {
    console.log("Viewer script iniciando...");
    if (!window.STORE_DATA || !window.STORE_DATA.store) {
      console.error('FATAL: STORE_DATA no está disponible o está malformado.');
      document.body.innerHTML = '<p class="text-red-500 text-center mt-10">Error: No se pudieron cargar los datos de la tienda.</p>';
      return;
    }
    console.log("STORE_DATA recibido del servidor:", window.STORE_DATA);
    
    store = window.STORE_DATA.store;
    products = window.STORE_DATA.products || [];
    console.log(`Tienda "${store.nombre}" cargada con ${products.length} productos.`);
    // --- Exponer dependencias para módulos externos (insertado automáticamente) ---
    window.store = store;
    window.products = products;
    window.shoppingCart = shoppingCart;
    window.orderSelections = orderSelections;
    window.$ = $;
    window.escapeHTML = escapeHTML;
    // --- Fin de exposición ---

    renderHeader();
    renderVendorProfile();
    renderProducts();
    attachEventListeners();
    updateCartTotal();
    console.log("Script del visualizador finalizado con éxito.");
  } catch (error) {
    console.error("Error fatal durante la inicialización del visualizador:", error);
    document.body.innerHTML = `<p class="text-red-500 text-center mt-10">Ocurrió un error al cargar la tienda. Revisa la consola para más detalles.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', main);
