import { state, availablePaymentMethods } from './state.js';
import { selectors } from './config.js';
import { getCurrencySymbol } from './utils.js';

import { renderCart } from './cart.js';

// Las funciones openProductModal y deleteProduct se adjuntarán al window en main.js

function renderStoreInfo() {
    const { store } = state.storeState;
    if (!store) return;

    // --- Renderizado de campos existentes (sin cambios) ---
    selectors.storeNameInput.value = store.nombre || '';
    selectors.storeDescriptionInput.value = store.descripcion || '';
    selectors.storeWhatsappInput.value = store.whatsapp || '';
    selectors.storeYoutubeLinkInput.value = store.youtubeLink || '';
    selectors.storeCurrency.value = store.currency || 'USD';
    selectors.logisticsToggle.checked = store.isLogisticsDual;
    selectors.dualLogisticsContainer.style.display = store.isLogisticsDual ? 'block' : 'none';
    selectors.airRateInput.value = store.airRate || 0;
    selectors.airMinDaysInput.value = store.airMinDays || 0;
    selectors.airMaxDaysInput.value = store.airMaxDays || 0;
    selectors.seaRateInput.value = store.seaRate || 0;
    selectors.seaMinDaysInput.value = store.seaMinDays || 0;
    selectors.seaMaxDaysInput.value = store.seaMaxDays || 0;
    selectors.storeDeliveryType.value = store.delivery_type || 'no';
    selectors.storeDeliveryFixedCost.value = store.delivery_fixed_cost || 0;
    selectors.storeDeliveryRangeStart.value = store.delivery_range_start || 0;
    selectors.storeDeliveryRangeEnd.value = store.delivery_range_end || 0;
    selectors.storeDeliveryNote.value = store.delivery_note || '';
    if (selectors.storeLogoPreview && selectors.storeLogoPlaceholder) {
        if (store.logoUrl) {
            selectors.storeLogoPreview.src = store.logoUrl;
            selectors.storeLogoPreview.style.display = 'block';
            selectors.storeLogoPlaceholder.style.display = 'none';
        } else {
            selectors.storeLogoPreview.style.display = 'none';
            selectors.storeLogoPlaceholder.style.display = 'flex';
        }
    }

    // --- Renderizado de la nueva sección de Pagos ---

    // 1. Generar checkboxes de métodos de pago
    const paymentMethodsHTML = Object.keys(availablePaymentMethods).map(key => {
        const isChecked = store.payment_methods && store.payment_methods[key];
        return `
            <label class="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" id="payment-${key}" data-payment-key="${key}" class="payment-method-check" ${isChecked ? 'checked' : ''}>
                <span>${availablePaymentMethods[key]}</span>
            </label>
        `;
    }).join('');
    selectors.paymentMethodsContainer.innerHTML = paymentMethodsHTML;

    // 2. Poblar campos de condiciones de pago
    selectors.acceptsFullPayment.checked = store.accepts_full_payment;
    selectors.acceptsAdvancePayment.checked = store.accepts_advance_payment;
    selectors.advance50.checked = store.advance_options['50'];
    selectors.advance25.checked = store.advance_options['25'];
    selectors.advance10.checked = store.advance_options['10'];
    selectors.acceptsInstallments.checked = store.accepts_installments;
    selectors.installmentType.value = store.installment_type || 'monthly';
    selectors.maxInstallments.value = store.max_installments || 3;

    // 3. Lógica de visibilidad
    const deliveryType = selectors.storeDeliveryType.value;
    selectors.storeDeliveryFixedContainer.style.display = deliveryType === 'fixed' ? 'block' : 'none';
    selectors.storeDeliveryRangeContainer.style.display = deliveryType === 'range' ? 'block' : 'none';
    
    selectors.advancePaymentOptions.style.display = store.accepts_advance_payment ? 'block' : 'none';
    selectors.installmentsOptions.style.display = store.accepts_installments ? 'block' : 'none';
}

function renderProductsList() {
    if (!selectors.productsListDiv) return;
    selectors.productsListDiv.innerHTML = ''; // Limpiar lista
    const symbol = getCurrencySymbol(state.storeState.store.currency);
    (state.storeState.products || []).forEach(p => {
        const productEl = document.createElement('div');
        productEl.className = 'flex justify-between items-center p-3 bg-gray-50 rounded-lg border';
        productEl.innerHTML = `
            <div class="flex-grow">
                <p class="font-bold">${p.nombre || "Producto sin nombre"}</p>
                <p class="text-sm text-gray-500">Costo Base: ${symbol}${(p.costo_base_final?.toFixed(2) || "0.00")} | Margen: ${p.margen_valor || 0}${p.margen_tipo === 'percent' ? '%' : '$'}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="openProductModal('${p.idLocal}')" class="btn bg-yellow-400 text-white w-8 h-8 rounded-full shadow-md hover:bg-yellow-500"><i class="fas fa-edit"></i></button>
                <button onclick="deleteProduct('${p.idLocal}')" class="btn bg-red-500 text-white w-8 h-8 rounded-full shadow-md hover:bg-red-600"><i class="fas fa-trash"></i></button>
            </div>
        `;
        selectors.productsListDiv.appendChild(productEl);
    });
}

function renderPreview() {
    if (!selectors.previewDiv) return;
    const { store, products } = state.storeState;
    if (!store) return;

    const symbol = getCurrencySymbol(store.currency);

    let deliveryHTML = '';
    switch (store.delivery_type) {
        case 'fixed':
            deliveryHTML = `<p class="text-sm text-center text-gray-600"><i class="fas fa-truck mr-2"></i>Delivery con costo fijo de ${symbol}${store.delivery_fixed_cost?.toFixed(2)}</p>`;
            break;
        case 'range':
            deliveryHTML = `<p class="text-sm text-center text-gray-600"><i class="fas fa-truck mr-2"></i>Delivery entre ${symbol}${store.delivery_range_start?.toFixed(2)} y ${symbol}${store.delivery_range_end?.toFixed(2)}</p>`;
            break;
        case 'included':
            deliveryHTML = `<p class="text-sm text-center text-green-600"><i class="fas fa-check-circle mr-2"></i>Delivery incluído en el precio</p>`;
            break;
        case 'no':
            deliveryHTML = `<p class="text-sm text-center text-gray-500"><i class="fas fa-store mr-2"></i>Retiro en tienda</p>`;
            break;
    }

    const mainVideoButton = store.youtubeLink
        ? `<button onclick="showYouTubeVideo('${store.youtubeLink}')" class="mt-2 text-sm text-blue-600 hover:text-blue-800 font-semibold"><i class="fab fa-youtube mr-1.5"></i>Ver Video Promocional</button>`
        : '';

    const productsHTML = (products || []).map(p => {
        const videoButton = p.youtubeLink 
            ? `<button onclick="event.stopPropagation(); showYouTubeVideo('${p.youtubeLink}')" class="absolute top-2 right-2 bg-red-600/80 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition-transform duration-150 hover:scale-110"><i class="fab fa-youtube"></i></button>` 
            : '';
        
        const tagsHTML = (p.tags || []).map(tag => 
            `<span class="text-xs bg-blue-600 text-white font-semibold rounded-full px-3 py-1">#${tag}</span>`
        ).join(' ');

        const quantityInCart = state.cart[p.idLocal] || 0;

        // Usamos flexbox para poner los precios lado a lado
        const pricesHTML = `
            <div class="flex justify-end items-baseline gap-4 mt-3 font-bold text-lg">
                ${p.precio_final_maritimo ? `<div class="text-gray-600 text-base">🚢 ${symbol}${(p.precio_final_maritimo).toFixed(2)}</div>` : ''}
                ${p.precio_final_aereo ? `<div class="text-blue-700">✈️ ${symbol}${(p.precio_final_aereo).toFixed(2)}</div>` : ''}
                ${!p.precio_final_aereo && !p.precio_final_maritimo ? `<div class="text-blue-700">${symbol}${(p.costo_base_final || 0).toFixed(2)}</div>` : ''}
            </div>
        `;

        return `
        <div onclick="showProductQuickView('${p.idLocal}')" class="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200">
            <div class="relative">
                <img src="${p.imageUrl || 'https://via.placeholder.com/300x200.png?text=Producto'}" alt="${p.nombre || 'Imagen de producto'}" class="w-full h-40 object-cover">
                ${videoButton}
            </div>
            <div class="p-3 flex flex-col flex-grow">
                <h4 class="font-bold text-gray-900 text-base">${p.nombre || "Producto sin Nombre"}</h4>
                <p class="text-xs text-gray-600 mt-1 flex-grow min-h-[32px]">${p.descripcion || "Sin descripción."}</p>
                
                <div class="flex flex-wrap gap-1.5 mt-2">
                    ${tagsHTML}
                </div>

                ${pricesHTML}

                <div class="flex items-center justify-between mt-4" onclick="event.stopPropagation()">
                    <div class="flex items-center border border-gray-300 rounded-full">
                        <button onclick="updateQuantity('${p.idLocal}', -1)" class="w-8 h-8 text-xl font-light text-gray-600 hover:bg-gray-100 rounded-l-full transition-colors">-</button>
                        <span class="px-4 font-semibold text-gray-800 text-lg">${quantityInCart}</span>
                        <button onclick="updateQuantity('${p.idLocal}', 1)" class="w-8 h-8 text-xl font-light text-gray-600 hover:bg-gray-100 rounded-r-full transition-colors">+</button>
                    </div>
                    <button onclick="addToCart('${p.idLocal}')" class="bg-blue-600 text-white text-sm font-bold py-2 px-4 rounded-full hover:bg-blue-700 transition-all duration-150 transform hover:scale-105"><i class="fas fa-shopping-cart"></i></button>
                </div>
            </div>
        </div>
        `
    }).join('');

    selectors.previewDiv.innerHTML = `
        <div class="w-full max-w-md mx-auto bg-gray-100 rounded-2xl shadow-inner p-4 border border-gray-200">
            <div class="text-center mb-4">
                <img id="previewLogo" src="${store.logoUrl || 'https://via.placeholder.com/100.png?text=Logo'}" class="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg mb-2">
                <h2 class="text-2xl font-bold text-gray-800">${store.nombre || "Nombre de la Tienda"}</h2>
                <p class="text-gray-600 text-sm px-2">${store.descripcion || "Descripción de la tienda."}</p>
                ${mainVideoButton}
            </div>
            <div class="mb-4 border-t border-b border-gray-200 py-2">
                ${deliveryHTML}
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${productsHTML || '<p class="text-center text-gray-400 col-span-2 py-8">Aún no has añadido productos.</p>'}
            </div>
        </div>
    `;
}

export function renderAll() {
    renderStoreInfo();
    renderProductsList();
    renderPreview();
    renderCart();
}
