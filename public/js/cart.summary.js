/* global $, shoppingCart, store, products, orderSelections, escapeHTML */

// FUNCIÓN DE TRADUCCIÓN (MEDIDA DE SEGURIDAD PARA DATOS ANTIGUOS)
function translateInstallmentType(type) {
    const translations = {
        monthly: 'meses',
        biweekly: 'quincenas',
        weekly: 'semanas',
    };
    return translations[type] || type; // Devuelve la traducción o el valor original si no hay coincidencia
}

/* Este archivo ahora contiene la lógica de renderizado del carrito.
   Se asume que viewer.js ya ha sido cargado y ha expuesto sus dependencias en window. */
window.renderCartSummary = function() {
    console.log('cart.summary.js v20251208.final — renderCartSummary loaded'); // MARCADOR DE VERSIÓN
    const body = $('cart-modal-body');
    const cartItems = Object.keys(shoppingCart);
    const c = store.currency || 'USD';

    if (cartItems.length === 0) {
      body.innerHTML = `<p class="text-center text-slate-500 py-10">Tu carrito de compras está vacío.</p>`;
      return;
    }

    // --- INICIALIZACIÓN ---
    let totalUnits = 0, totalWeight = 0, subtotalAir = 0, subtotalSea = 0;
    let shippingSelectorHtml = '', paymentMethodSelectorHtml = '', paymentPlanSelectorHtml = '', installmentsSelectorHtml = '', deliverySelectorHtml = '';

    const productRows = cartItems.map(productId => {
      const product = products.find(p => p.idLocal === productId);
      if (!product) return '';
      const quantity = shoppingCart[productId];
      const unitWeight = product.peso_lb || 0;
      const unitAirPrice = store.store_type === 'in_stock' ? (product.precio_base || 0) : (product.precio_final_aereo || 0);
      const unitSeaPrice = store.store_type === 'in_stock' ? (product.precio_base || 0) : (product.precio_final_maritimo || 0);
      const totalProductWeight = unitWeight * quantity;
      const totalProductAirPrice = unitAirPrice * quantity;
      const totalProductSeaPrice = unitSeaPrice * quantity;
      totalUnits += quantity;
      totalWeight += totalProductWeight;
      subtotalAir += totalProductAirPrice;
      subtotalSea += totalProductSeaPrice;
      return `
        <tr class="border-b border-slate-100">
          <td class="p-3 font-medium text-slate-800">${escapeHTML(product.nombre)}</td>
          <td class="p-3 text-center">${quantity}</td>
          <td class="p-3 text-center">${unitWeight.toFixed(2)} lb</td>
          <td class="p-3 text-center text-sky-600">${c} ${unitAirPrice.toFixed(2)}</td>
          <td class="p-3 text-center text-teal-600">${c} ${unitSeaPrice.toFixed(2)}</td>
          <td class="p-3 text-center font-semibold">${totalProductWeight.toFixed(2)} lb</td>
          <td class="p-3 text-center font-bold text-sky-700">${c} ${totalProductAirPrice.toFixed(2)}</td>
          <td class="p-3 text-center font-bold text-teal-700">${c} ${totalProductSeaPrice.toFixed(2)}</td>
        </tr>`;
    }).join('');

    // --- RENDERIZADO DE OPCIONES ---
    
    if (store.store_type === 'by_order') {
        if (!orderSelections.shippingMethod) orderSelections.shippingMethod = 'air';
        shippingSelectorHtml = `<div><h4 class="text-md font-bold text-slate-700 mb-2">1. Elige el método de envío</h4><div class="flex gap-4">
            <label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.shippingMethod === 'air' ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}"><input type="radio" name="shippingMethod" value="air" class="hidden" ${orderSelections.shippingMethod === 'air' ? 'checked' : ''}><span class="font-bold text-sky-600">✈️ Envío Aéreo</span><span class="block text-sm text-slate-500">Rápido y seguro</span></label>
            <label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.shippingMethod === 'sea' ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}"><input type="radio" name="shippingMethod" value="sea" class="hidden" ${orderSelections.shippingMethod === 'sea' ? 'checked' : ''}><span class="font-bold text-teal-600">🚢 Envío Marítimo</span><span class="block text-sm text-slate-500">Económico</span></label>
        </div></div>`;
    } else {
        orderSelections.shippingMethod = 'stock';
    }

    const paymentOptions = [];
    if (store.accepts_cash) paymentOptions.push({ value: 'cash', label: 'Efectivo', icon: '💵' });
    if (store.accepts_transfer) paymentOptions.push({ value: 'transfer', label: 'Transferencia', icon: '🏦' });
    if (store.paypal_link) paymentOptions.push({ value: 'paypal', label: 'PayPal', icon: '🅿️' });
    if (store.stripe_link) paymentOptions.push({ value: 'stripe', label: 'Stripe', icon: '💳' });
    if (paymentOptions.length > 0) {
        if (!orderSelections.paymentMethod || !paymentOptions.find(p => p.value === orderSelections.paymentMethod)) orderSelections.paymentMethod = paymentOptions[0].value;
        const paymentRadios = paymentOptions.map(opt => `<label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.paymentMethod === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}"><input type="radio" name="paymentMethod" value="${opt.value}" class="hidden" ${orderSelections.paymentMethod === opt.value ? 'checked' : ''}><span class="font-bold text-indigo-600">${opt.icon} ${opt.label}</span></label>`).join('');
        paymentMethodSelectorHtml = `<div><h4 class="text-md font-bold text-slate-700 mb-2">2. Elige cómo pagar</h4><div class="flex flex-wrap gap-4">${paymentRadios}</div>
            ${orderSelections.paymentMethod === 'transfer' && store.transfer_details ? `<div class="mt-2 p-3 bg-indigo-50 text-sm text-indigo-800 rounded-lg">${escapeHTML(store.transfer_details)}</div>` : ''}</div>`;
    }

    const planOptions = [];
    if (store.accepts_full_payment) planOptions.push({ value: '100', label: 'Pagar 100% ahora' });
    if (store.accepts_advance_payment && store.advance_options) {
        Object.keys(store.advance_options).forEach(advKey => {
            if (store.advance_options[advKey]) planOptions.push({ value: advKey, label: `Abonar ${advKey}%` });
        });
    }

    planOptions.sort((a, b) => Number(b.value) - Number(a.value));

    if (planOptions.length > 0) {
        if (!orderSelections.paymentPlan || !planOptions.find(p => p.value === orderSelections.paymentPlan)) orderSelections.paymentPlan = planOptions[0].value;
        const planRadios = planOptions.map(opt => `<label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.paymentPlan === opt.value ? 'border-green-500 bg-green-50' : 'border-slate-200'}"><input type="radio" name="paymentPlan" value="${opt.value}" class="hidden" ${orderSelections.paymentPlan === opt.value ? 'checked' : ''}><span class="font-bold text-green-600">${opt.label}</span></label>`).join('');
        paymentPlanSelectorHtml = `<div><h4 class="text-md font-bold text-slate-700 mb-2">3. Elige tu plan de pago</h4><div class="flex flex-wrap gap-4">${planRadios}</div></div>`;
    } else {
        orderSelections.paymentPlan = '100';
    }

    // --- CÁLCULO DE TOTALES CON NUEVA LÓGICA DE NEGOCIO ---
    const productSubtotal = orderSelections.shippingMethod === 'sea' ? subtotalSea : subtotalAir;
    let extraCost = 0;
    if (store.extra_cost && store.extra_cost.enabled && store.extra_cost.value > 0) {
        const { value, type } = store.extra_cost;
        if (type && type.startsWith('percentage')) extraCost = productSubtotal * (Number(value) / 100);
        else extraCost = Number(value);
    }
    const deliveryTotalCost = (orderSelections.wantsDelivery && store.delivery_type === 'fixed') ? (Number(store.delivery_fixed_cost) || 0) : 0;
    const upfrontCosts = extraCost + deliveryTotalCost;
    const productDownPayment = productSubtotal * (Number(orderSelections.paymentPlan) / 100);
    const amountToPay = productDownPayment + upfrontCosts;
    const pendingAmount = productSubtotal - productDownPayment;
    const grandTotal = productSubtotal + upfrontCosts;
    
    // --- LÓGICA DE OPCIONES DE CUOTAS ---
    if (store.accepts_installments && pendingAmount > 0.01 && Array.isArray(store.installment_options) && store.installment_options.length > 0) {
        const uniqueDefaultValue = `${store.installment_options[0].max}-${store.installment_options[0].type}`;
        if (!orderSelections.selectedInstallment) orderSelections.selectedInstallment = uniqueDefaultValue;
        
        const installmentRadios = store.installment_options.map(opt => {
            const installmentValue = (pendingAmount / opt.max).toFixed(2);
            const translatedType = translateInstallmentType(opt.type);
            const uniqueValue = `${opt.max}-${opt.type}`;
            return `<label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.selectedInstallment === uniqueValue ? 'border-purple-500 bg-purple-50' : 'border-slate-200'}">
                        <input type="radio" name="selectedInstallment" value="${uniqueValue}" class="hidden" ${orderSelections.selectedInstallment === uniqueValue ? 'checked' : ''}>
                        <span class="font-bold text-purple-600">${opt.max} ${translatedType}</span>
                        <span class="block text-sm text-slate-500">Pagarías ${c} ${installmentValue} por cuota</span>
                    </label>`;
        }).join('');
        installmentsSelectorHtml = `<div><h4 class="text-md font-bold text-slate-700 mb-2">4. Paga el resto en cuotas</h4><div class="p-4 bg-slate-50 rounded-lg"><p class="text-sm text-slate-600 mb-3">Saldo pendiente a financiar: <span class="font-bold">${c} ${pendingAmount.toFixed(2)}</span></p><div class="flex flex-wrap gap-4">${installmentRadios}</div></div></div>`;
    }

    if (store.delivery_type && store.delivery_type !== 'no') {
        let deliveryText = '';
        switch(store.delivery_type) {
            case 'included': deliveryText = '<span class="font-medium text-green-600">Delivery incluido.</span>'; orderSelections.wantsDelivery = true; break;
            case 'fixed': deliveryText = `Costo fijo de ${c} ${(Number(store.delivery_fixed_cost) || 0).toFixed(2)}`; break;
            case 'range': deliveryText = `Costo a coordinar entre ${c} ${(Number(store.delivery_range_start) || 0).toFixed(2)} y ${c} ${(Number(store.delivery_range_end) || 0).toFixed(2)}`; break;
        }
        const deliveryCheckbox = (store.delivery_type === 'fixed' || store.delivery_type === 'range') ? `<label class="flex items-center p-4 border rounded-lg cursor-pointer ${orderSelections.wantsDelivery ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}"><input type="checkbox" name="wantsDelivery" class="h-5 w-5 rounded text-blue-600" ${orderSelections.wantsDelivery ? 'checked' : ''}><span class="ml-3 font-bold text-blue-600">Sí, deseo solicitar delivery</span>${store.delivery_note ? `<span class="block w-full text-sm text-slate-500 ml-3 mt-1">${escapeHTML(store.delivery_note)}</span>` : ''}</label>` : (store.delivery_note ? `<div class="p-3 bg-blue-50 text-sm text-blue-800 rounded-lg">${escapeHTML(store.delivery_note)}</div>` : '');
        deliverySelectorHtml = `<div><h4 class="text-md font-bold text-slate-700 mb-2">5. Delivery</h4><div class="p-4 bg-slate-50 rounded-lg space-y-3"><p class="text-sm text-slate-800">${deliveryText}</p>${deliveryCheckbox}</div></div>`;
    }

    let installmentSummary = '';
    if (store.accepts_installments && pendingAmount > 0.01 && orderSelections.selectedInstallment) {
        const [max, type] = orderSelections.selectedInstallment.split('-');
        const installmentValue = (pendingAmount / Number(max)).toFixed(2);
        installmentSummary = `<div class="flex justify-between text-sm mt-1"><span class="text-slate-600">Plan de cuotas:</span><span class="font-semibold text-slate-800">${max} ${translateInstallmentType(type)} de ${c} ${installmentValue}</span></div>`;
    }

    const extraCostText = (store.extra_cost && store.extra_cost.enabled && store.extra_cost.value > 0) ? `<p class="text-xs text-slate-500">${escapeHTML(store.extra_cost.description)}</p>` : '';
    const summaryHtml = `<div class="mt-6 p-4 bg-slate-50 rounded-lg space-y-2">
            <div class="flex justify-between"><span class="text-slate-600">Subtotal de productos:</span><span class="font-semibold text-slate-800">${c} ${productSubtotal.toFixed(2)}</span></div>
            ${extraCost > 0 ? `<div class="flex justify-between items-start"><div><span class="text-slate-600">Costo extra:</span>${extraCostText}</div><span class="font-semibold text-slate-800">${c} ${extraCost.toFixed(2)}</span></div>` : ''}
            ${deliveryTotalCost > 0 ? `<div class="flex justify-between"><span class="text-slate-600">Costo de delivery:</span><span class="font-semibold text-slate-800">${c} ${deliveryTotalCost.toFixed(2)}</span></div>` : ''}
            <div class="flex justify-between font-bold text-slate-800 border-t pt-2 mt-2"><span>Total del Pedido:</span><span>${c} ${grandTotal.toFixed(2)}</span></div>
            <div class="flex justify-between text-xl font-bold text-indigo-700 border-t-2 border-dashed pt-2 mt-2"><span>MONTO A PAGAR HOY:</span><span>${c} ${amountToPay.toFixed(2)}</span></div>
            ${pendingAmount > 0.01 ? `<div class="flex justify-between text-sm mt-1"><span class="text-slate-600">Saldo pendiente a financiar:</span><span class="font-semibold text-slate-800">${c} ${pendingAmount.toFixed(2)}</span></div>` : ''}
            ${installmentSummary}
        </div>`;

    const isReady = orderSelections.shippingMethod && orderSelections.paymentMethod && orderSelections.paymentPlan;

    body.innerHTML = `
      <div class="overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-50"><tr class="text-left text-slate-600">
        <th class="p-3 font-semibold">Producto</th><th class="p-3 font-semibold text-center">Cant.</th><th class="p-3 text-center">Peso U.</th><th class="p-3 text-center text-sky-600">Valor U. (Aéreo)</th>
        <th class="p-3 text-center text-teal-600">Valor U. (Marítimo)</th><th class="p-3 font-semibold text-center">Peso Total</th><th class="p-3 font-bold text-center">Total (Aéreo)</th><th class="p-3 font-bold text-center">Total (Marítimo)</th>
      </tr></thead><tbody>${productRows}</tbody></table></div>
      <div class="mt-6 p-4 bg-slate-50 rounded-lg grid grid-cols-2 gap-4">
        <div><p class="text-sm text-slate-600">Unidades Totales:</p><p class="text-2xl font-bold text-slate-800">${totalUnits}</p></div>
        <div><p class="text-sm text-slate-600">Peso Total Estimado:</p><p class="text-2xl font-bold text-slate-800">${totalWeight.toFixed(2)} lb</p></div>
      </div>
      <div id="cart-options" class="mt-6 space-y-6">${shippingSelectorHtml}${paymentMethodSelectorHtml}${paymentPlanSelectorHtml}${installmentsSelectorHtml}${deliverySelectorHtml}</div>
      ${summaryHtml}
      <div class="mt-6 text-right">
        <button id="confirm-order-button" data-action="confirm-order" ${!isReady ? 'disabled' : ''} class="${isReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'} text-white font-bold py-3 px-6 rounded-lg transition">Confirmar Pedido</button>
      </div>
    `;
}