import { state } from './state.js';
import { selectors } from './config.js';
import { renderAll } from './render.js';
import { getCurrencySymbol } from './utils.js';

export function updateCalculationDisplay() {
    if (!selectors.prodInitialCost) return;
    const cost = parseFloat(selectors.prodInitialCost.value) || 0;
    const weight = parseFloat(selectors.prodWeight.value) || 0;
    const { airRate, seaRate, currency, isLogisticsDual } = state.storeState.store;
    const symbol = getCurrencySymbol(currency);

    const baseCostAir = isLogisticsDual ? cost + (weight * airRate) : cost;
    const baseCostSea = isLogisticsDual ? cost + (weight * seaRate) : cost;
    
    selectors.baseCostAirDisplay.textContent = `${symbol}${baseCostAir.toFixed(2)}`;
    selectors.baseCostSeaDisplay.textContent = `${symbol}${baseCostSea.toFixed(2)}`;
    
    if (selectors.formulaDisplay) {
        if (isLogisticsDual) {
            selectors.baseCostSeaDisplay.style.display = 'inline';
            selectors.formulaDisplay.textContent = `Fórmula (Dual): ${symbol}${cost} + (${weight}lb * ${symbol}${airRate}/${symbol}${seaRate} por lb)`;
        } else {
            selectors.baseCostSeaDisplay.style.display = 'none';
            selectors.formulaDisplay.textContent = `Fórmula (Stock): Costo ${symbol}${cost}`;
        }
    }
}

export function openProductModal(productId) {
    state.activeProductId = productId;
    state.activeProductImage = null; // Resetear imagen activa
    const isNew = !productId;
    let product = {};

    if (isNew) {
        state.activeProductId = `prod_${Date.now()}`;
        product = { idLocal: state.activeProductId, nombre: '', descripcion: '', costo_inicial: 0, peso_lb: 0, margen_tipo: 'fixed', margen_valor: 5 };
    } else {
        product = state.storeState.products.find(p => p.idLocal === productId) || {};
    }

    selectors.prodNameInput.value = product.nombre || '';
    selectors.prodDescInput.value = product.descripcion || '';
    selectors.prodYoutubeLink.value = product.youtubeLink || '';
    selectors.prodInitialCost.value = product.costo_inicial || 0;
    selectors.prodWeight.value = product.peso_lb || 0;
    selectors.prodMarginType.value = product.margen_tipo || 'fixed';
    selectors.prodMarginValue.value = product.margen_valor || 0;
    selectors.prodStockMode.value = product.metodo_venta || 'stock';
    selectors.prodShipMethod.value = product.metodo_envio_encargo || 'both';
    selectors.prodTags.value = (product.tags || []).join(', ');

    selectors.prodImagePreview.src = product.imageUrl || '';
    selectors.prodImagePreview.style.display = product.imageUrl ? 'block' : 'none';
    selectors.prodImagePlaceholder.style.display = product.imageUrl ? 'none' : 'flex';

    selectors.prodStockMode.dispatchEvent(new Event('change'));
    updateCalculationDisplay();

    selectors.productEditorModal.classList.remove('hidden');
}

export function closeProductModal() {
    selectors.productEditorModal.classList.add('hidden');
    state.activeProductId = null;
}

export function saveProductFromModal() {
    if (!state.activeProductId) return;

    const cost = parseFloat(selectors.prodInitialCost.value) || 0;
    const weight = parseFloat(selectors.prodWeight.value) || 0;
    const marginType = selectors.prodMarginType.value;
    const marginValue = parseFloat(selectors.prodMarginValue.value) || 0;
    const { airRate, seaRate, isLogisticsDual } = state.storeState.store;

    const baseCostAir = isLogisticsDual ? cost + (weight * airRate) : cost;
    const baseCostSea = isLogisticsDual ? cost + (weight * seaRate) : cost;

    let finalPriceAir = 0;
    let finalPriceSea = 0;

    if (marginType === 'fixed') {
        finalPriceAir = baseCostAir + marginValue;
        finalPriceSea = baseCostSea + marginValue;
    } else {
        finalPriceAir = baseCostAir * (1 + marginValue / 100);
        finalPriceSea = baseCostSea * (1 + marginValue / 100);
    }

    const productData = {
        idLocal: state.activeProductId,
        nombre: selectors.prodNameInput.value,
        descripcion: selectors.prodDescInput.value,
        youtubeLink: selectors.prodYoutubeLink.value,
        costo_inicial: cost,
        peso_lb: weight,
        margen_tipo: marginType,
        margen_valor: marginValue,
        costo_base_final: baseCostAir,
        precio_final_aereo: finalPriceAir,
        precio_final_maritimo: finalPriceSea,
        metodo_venta: selectors.prodStockMode.value,
        metodo_envio_encargo: selectors.prodShipMethod.value,
        tags: selectors.prodTags.value.split(',').map(t => t.trim()).filter(t => t),
    };

    if (state.activeProductImage) {
        productData.imageUrl = state.activeProductImage.url;
        productData.imageFile = state.activeProductImage.file;
    }

    const existingIndex = state.storeState.products.findIndex(p => p.idLocal === state.activeProductId);
    
    if (existingIndex > -1) {
        if (!productData.imageUrl) { // Conservar imagen si no se subió una nueva
            productData.imageUrl = state.storeState.products[existingIndex].imageUrl;
            productData.imageFile = state.storeState.products[existingIndex].imageFile;
        }
        state.storeState.products[existingIndex] = productData;
    } else {
        state.storeState.products.push(productData);
    }

    renderAll();
    closeProductModal();
}

export function deleteProduct(productId) {
    state.storeState.products = state.storeState.products.filter(p => p.idLocal !== productId);
    renderAll();
}
