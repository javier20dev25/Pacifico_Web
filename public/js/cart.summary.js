/* global $, shoppingCart, store, products, orderSelections, escapeHTML */

/* Este archivo ahora contiene la lógica de renderizado del carrito.
   Se asume que viewer.js ya ha sido cargado y ha expuesto sus dependencias en window. */
window.renderCartSummary = function() {
    const body = $('cart-modal-body');
    const cartItems = Object.keys(shoppingCart);
    const c = store.currency || 'USD';

    if (cartItems.length === 0) {
      body.innerHTML = `
        <p class="text-center text-slate-500 py-10">Tu carrito de compras está vacío.</p>
        <div class="mt-6 text-right">
          <button id="confirm-order-button" disabled class="bg-indigo-300 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">
            Confirmar Pedido
          </button>
        </div>
      `;
      return;
    }

    let totalUnits = 0;
    let totalWeight = 0;
    let subtotalAir = 0;
    let subtotalSea = 0;

    const productRows = cartItems.map(productId => {
      const product = products.find(p => p.idLocal === productId);
      if (!product) return '';

      const quantity = shoppingCart[productId];
      const unitWeight = product.peso_lb; // Ya saneado desde el servidor
      const unitAirPrice = store.storeType === 'in_stock' ? product.precio_base : product.precio_final_aereo;
      const unitSeaPrice = store.storeType === 'in_stock' ? product.precio_base : product.precio_final_maritimo;
      
      const totalProductWeight = unitWeight * quantity;
      const totalProductAirPrice = unitAirPrice * quantity;
      const totalProductSeaPrice = unitSeaPrice * quantity;

      totalUnits += quantity;
      totalWeight += totalProductWeight;
      subtotalAir += totalProductAirPrice;
      subtotalSea += totalProductSeaPrice;

      return `
        <tr class="border-b border-slate-100">
          <td class="p-3 font-medium text-slate-800">
${escapeHTML(product.nombre)}</td>
          <td class="p-3 text-center">
${quantity}</td>
          <td class="p-3 text-center">
${unitWeight.toFixed(2)} lb</td>
          <td class="p-3 text-center text-sky-600">
${c} ${unitAirPrice.toFixed(2)}</td>
          <td class="p-3 text-center text-teal-600">
${c} ${unitSeaPrice.toFixed(2)}</td>
          <td class="p-3 text-center font-semibold">
${totalProductWeight.toFixed(2)} lb</td>
          <td class="p-3 text-center font-bold text-sky-700">
${c} ${totalProductAirPrice.toFixed(2)}</td>
          <td class="p-3 text-center font-bold text-teal-700">
${c} ${totalProductSeaPrice.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // --- Renderizado de Opciones ---
    
    // 1. Selector de Envío
    let shippingSelectorHtml = '';
    if (store.storeType === 'on_demand') {
        if (!orderSelections.shippingMethod) {
            orderSelections.shippingMethod = 'air';
        }
        shippingSelectorHtml = `
            <div>
                <h4 class="text-md font-bold text-slate-700 mb-2">1. Elige el método de envío</h4>
                <div class="flex gap-4">
                    <label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.shippingMethod === 'air' ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}">
                        <input type="radio" name="shippingMethod" value="air" class="hidden" ${orderSelections.shippingMethod === 'air' ? 'checked' : ''}>
                        <span class="font-bold text-sky-600">✈️ Envío Aéreo</span>
                        <span class="block text-sm text-slate-500">Rápido y seguro</span>
                    </label>
                    <label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.shippingMethod === 'sea' ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}">
                        <input type="radio" name="shippingMethod" value="sea" class="hidden" ${orderSelections.shippingMethod === 'sea' ? 'checked' : ''}>
                        <span class="font-bold text-teal-600">🚢 Envío Marítimo</span>
                        <span class="block text-sm text-slate-500">Económico y para grandes volúmenes</span>
                    </label>
                </div>
            </div>
        `;
    } else {
        orderSelections.shippingMethod = 'stock';
    }

    // 2. Selector de Método de Pago
    let paymentMethodSelectorHtml = '';
    const paymentOptions = [];
    if (store.acceptsCash) paymentOptions.push({ value: 'cash', label: 'Efectivo', icon: '💵' });
    if (store.acceptsTransfer) paymentOptions.push({ value: 'transfer', label: 'Transferencia', icon: '🏦' });
    if (store.paypalLink) paymentOptions.push({ value: 'paypal', label: 'PayPal', icon: '🅿️' });
    if (store.stripeLink) paymentOptions.push({ value: 'stripe', label: 'Stripe', icon: '💳' });

    if (paymentOptions.length > 0) {
        if (!orderSelections.paymentMethod || !paymentOptions.find(p => p.value === orderSelections.paymentMethod)) {
            orderSelections.paymentMethod = paymentOptions[0].value;
        }
        const paymentRadios = paymentOptions.map(opt => `
            <label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.paymentMethod === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}">
                <input type="radio" name="paymentMethod" value="${opt.value}" class="hidden" ${orderSelections.paymentMethod === opt.value ? 'checked' : ''}>
                <span class="font-bold text-indigo-600">${opt.icon} ${opt.label}</span>
            </label>
        `).join('');

        paymentMethodSelectorHtml = `
            <div>
                <h4 class="text-md font-bold text-slate-700 mb-2">2. Elige el método de pago</h4>
                <div class="flex flex-wrap gap-4">
                    ${paymentRadios}
                </div>
            </div>
        `;
    }

    // 3. Selector de Plan de Pago
    let paymentPlanSelectorHtml = '';
    const planOptions = [];
    if (store.accepts_full_payment) planOptions.push({ value: '100', label: 'Pagar 100% ahora' });
    if (store.accepts_advance_payment && store.advance_options && store.advance_options.length > 0) {
        store.advance_options.forEach(adv => {
            planOptions.push({ value: adv, label: `Abonar ${adv}%` });
        });
    }

    if (planOptions.length > 0) {
        if (!orderSelections.paymentPlan || !planOptions.find(p => p.value === orderSelections.paymentPlan)) {
            orderSelections.paymentPlan = planOptions[0].value;
        }
        const planRadios = planOptions.map(opt => `
            <label class="flex-1 p-4 border rounded-lg cursor-pointer ${orderSelections.paymentPlan === opt.value ? 'border-green-500 bg-green-50' : 'border-slate-200'}">
                <input type="radio" name="paymentPlan" value="${opt.value}" class="hidden" ${orderSelections.paymentPlan === opt.value ? 'checked' : ''}>
                <span class="font-bold text-green-600">${opt.label}</span>
            </label>
        `).join('');

        paymentPlanSelectorHtml = `
            <div>
                <h4 class="text-md font-bold text-slate-700 mb-2">3. Elige tu plan de pago</h4>
                <div class="flex flex-wrap gap-4">
                    ${planRadios}
                </div>
            </div>
        `;
    } else {
        orderSelections.paymentPlan = '100'; // Si no hay opciones, es 100% por defecto
    }

    // 4. Selector de Delivery
    let deliverySelectorHtml = '';
    if (store.delivery_type && store.delivery_type !== 'none') {
        let deliveryText = '';
        switch(store.delivery_type) {
            case 'included':
                deliveryText = '<span class="font-medium text-green-600">Delivery incluido en su orden.</span>';
                orderSelections.wantsDelivery = true; // Se asume que lo quiere si está incluido
                break;
            case 'not_included':
                deliveryText = '<span class="font-medium text-red-600">Delivery NO incluido.</span>';
                orderSelections.wantsDelivery = false;
                break;
            case 'fixed':
                deliveryText = `Costo fijo de ${c} ${(Number(store.delivery_fixed_cost) || 0).toFixed(2)}`;
                break;
            case 'range':
                deliveryText = `Costo entre ${c} ${(Number(store.delivery_range_start) || 0).toFixed(2)} y ${c} ${(Number(store.delivery_range_end) || 0).toFixed(2)}`;
                break;
        }

        const deliveryCheckbox = (store.delivery_type === 'fixed' || store.delivery_type === 'range') ? `
            <label class="flex items-center p-4 border rounded-lg cursor-pointer ${orderSelections.wantsDelivery ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}">
                <input type="checkbox" name="wantsDelivery" class="h-5 w-5 rounded text-blue-600" ${orderSelections.wantsDelivery ? 'checked' : ''}>
                <span class="ml-3 font-bold text-blue-600">Sí, deseo solicitar el delivery</span>
            </label>
        ` : '';

        deliverySelectorHtml = `
            <div>
                <h4 class="text-md font-bold text-slate-700 mb-2">4. Delivery</h4>
                <div class="p-4 bg-slate-100 rounded-lg space-y-2">
                    <p class="text-sm text-slate-800">${deliveryText}</p>
                    ${deliveryCheckbox}
                </div>
            </div>
        `;
    }


    // --- Cálculo de Totales ---
    const selectedSubtotal = orderSelections.shippingMethod === 'sea' ? subtotalSea : subtotalAir;
    let extraCost = 0;
    let extraCostText = '';
    if (store.extraCost && store.extraCost.enabled) {
        const { value, type } = store.extraCost;
        if (type === 'percentage') {
            extraCost = selectedSubtotal * (Number(value) / 100);
        } else {
            extraCost = Number(value);
        }
        extraCostText = `<p class="text-xs text-slate-500">${escapeHTML(store.extraCost.description)}</p>`;
    }
    const grandTotal = selectedSubtotal + extraCost;
    const amountToPay = grandTotal * (Number(orderSelections.paymentPlan) / 100);

    // --- Renderizado del Resumen de Costos ---
    const summaryHtml = `
        <div class="mt-6 p-4 bg-slate-50 rounded-lg space-y-2">
            <div class="flex justify-between">
                <span class="text-slate-600">Subtotal de productos:</span>
                <span class="font-semibold text-slate-800">
${c} ${selectedSubtotal.toFixed(2)}</span>
            </div>
            ${extraCost > 0 ? `
            <div class="flex justify-between items-start">
                <div>
                    <span class="text-slate-600">Costo extra:</span>
                    ${extraCostText}
                </div>
                <span class="font-semibold text-slate-800">
${c} ${extraCost.toFixed(2)}</span>
            </div>
            ` : ''}
            <div class="flex justify-between font-bold text-slate-800 border-t pt-2 mt-2">
                <span>Total del Pedido:</span>
                <span>
${c} ${grandTotal.toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-xl font-bold text-indigo-700 border-t-2 border-dashed pt-2 mt-2">
                <span>MONTO A PAGAR (${orderSelections.paymentPlan}%):</span>
                <span>
${c} ${amountToPay.toFixed(2)}</span>
            </div>
        </div>
    `;

    // --- Lógica para activar el botón ---
    const isReady = orderSelections.shippingMethod && orderSelections.paymentMethod && orderSelections.paymentPlan;

    body.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr class="text-left text-slate-600">
              <th class="p-3 font-semibold">Producto</th>
              <th class="p-3 font-semibold text-center">Cant.</th>
              <th class="p-3 text-center">Peso U.</th>
              <th class="p-3 text-center text-sky-600">Valor U. (Aéreo)</th>
              <th class="p-3 text-center text-teal-600">Valor U. (Marítimo)</th>
              <th class="p-3 font-semibold text-center">Peso Total</th>
              <th class="p-3 font-bold text-center">Total (Aéreo)</th>
              <th class="p-3 font-bold text-center">Total (Marítimo)</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>
      </div>
      <div class="mt-6 p-4 bg-slate-50 rounded-lg grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-slate-600">Unidades Totales:</p>
          <p class="text-2xl font-bold text-slate-800">${totalUnits}</p>
        </div>
        <div>
          <p class="text-sm text-slate-600">Peso Total Estimado:</p>
          <p class="text-2xl font-bold text-slate-800">
${totalWeight.toFixed(2)} lb</p>
        </div>
      </div>
      
      <div id="cart-options" class="mt-6 space-y-6">
        ${shippingSelectorHtml}
        ${paymentMethodSelectorHtml}
        ${paymentPlanSelectorHtml}
        ${deliverySelectorHtml}
      </div>
      
      ${summaryHtml}

      <div class="mt-6 text-right">
        <button id="confirm-order-button" data-action="confirm-order" ${!isReady ? 'disabled' : ''} 
                class="${isReady ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-300 cursor-not-allowed'} text-white font-bold py-3 px-6 rounded-lg transition">
          Confirmar Pedido
        </button>
      </div>
    `;
}