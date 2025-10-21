import { state } from './state.js';
import { selectors } from './config.js';
import { getCurrencySymbol, showYouTubeVideo } from './utils.js';
import { addToCart, updateQuantity } from './cart.js';

function closeProductQuickView() {
    if (selectors.quickViewModal) {
        selectors.quickViewModal.classList.add('hidden');
        selectors.quickViewCard.innerHTML = ''; // Limpiar contenido
    }
}

// Nuevos manejadores que fuerzan el refresco del modal
export function handleQuickViewQuantityChange(productId, change) {
    updateQuantity(productId, change);
    showProductQuickView(productId);
}

export function handleQuickViewAddToCart(productId) {
    addToCart(productId);
    showProductQuickView(productId);
}

export function showProductQuickView(productId) {
    const product = state.storeState.products.find(p => p.idLocal === productId);
    if (!product) return;

    const { store } = state.storeState;
    const symbol = getCurrencySymbol(store.currency);
    const quantityInCart = state.cart[product.idLocal] || 0;

    const tagsHTML = (product.tags || []).map(tag => 
        `<span class="text-sm bg-blue-600 text-white font-semibold rounded-full px-3 py-1">#${tag}</span>`
    ).join(' ');

    const videoButton = product.youtubeLink 
        ? `<button onclick="event.stopPropagation(); showYouTubeVideo('${product.youtubeLink}')" class="mt-4 bg-red-600 text-white font-bold py-2 px-4 rounded-full hover:bg-red-700 transition-colors w-full flex items-center justify-center"><i class="fab fa-youtube mr-2"></i>Ver Video del Producto</button>`
        : '';

    const modalContent = `
        <button id="closeQuickViewBtn" class="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-2xl z-10">&times;</button>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <img src="${product.imageUrl || 'https://via.placeholder.com/400x300.png?text=Producto'}" alt="${product.nombre}" class="w-full h-auto object-cover rounded-xl shadow-lg">
            </div>
            <div class="flex flex-col">
                <h2 class="text-3xl font-bold text-gray-900">${product.nombre}</h2>
                <div class="flex flex-wrap gap-2 mt-3">
                    ${tagsHTML}
                </div>
                <p class="text-gray-700 mt-4 flex-grow">${product.descripcion || 'Este producto no tiene una descripción detallada.'}</p>
                
                <div class="mt-4 text-right font-bold text-blue-800 text-2xl">
                    ${product.precio_final_aereo ? `<div class="mb-2">✈️ ${symbol}${(product.precio_final_aereo).toFixed(2)}</div>` : ''}
                    ${product.precio_final_maritimo ? `<div>🚢 ${symbol}${(product.precio_final_maritimo).toFixed(2)}</div>` : ''}
                    ${!product.precio_final_aereo && !product.precio_final_maritimo ? `<div>${symbol}${(product.costo_base_final || 0).toFixed(2)}</div>` : ''}
                </div>

                <div class="flex items-center justify-between mt-6">
                    <div class="flex items-center border border-gray-300 rounded-full">
                        <button onclick="handleQuickViewQuantityChange('${product.idLocal}', -1)" class="w-10 h-10 text-2xl font-semibold text-gray-600 hover:bg-gray-100 rounded-l-full transition-colors">-</button>
                        <span class="px-6 font-bold text-gray-800 text-xl">${quantityInCart}</span>
                        <button onclick="handleQuickViewQuantityChange('${product.idLocal}', 1)" class="w-10 h-10 text-2xl font-semibold text-gray-600 hover:bg-gray-100 rounded-r-full transition-colors">+</button>
                    </div>
                    <button onclick="handleQuickViewAddToCart('${product.idLocal}')" class="bg-blue-600 text-white font-bold py-3 px-6 rounded-full hover:bg-blue-700 transition-all duration-150 transform hover:scale-105"><i class="fas fa-shopping-cart mr-2"></i>Añadir</button>
                </div>
                ${videoButton}
            </div>
        </div>
    `;

    selectors.quickViewCard.innerHTML = modalContent;
    selectors.quickViewModal.classList.remove('hidden');

    // Add event listeners for closing
    document.getElementById('closeQuickViewBtn').addEventListener('click', closeProductQuickView);
    selectors.quickViewModal.addEventListener('click', (e) => {
        if (e.target === selectors.quickViewModal) {
            closeProductQuickView();
        }
    });
}
