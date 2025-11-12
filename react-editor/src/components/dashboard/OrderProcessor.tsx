import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';

import useAppStore from '@/stores/store';

// Lógica de parseo mejorada para que busque en los productos existentes
function parseOrderText(text, storeProducts) {
  const order = { products: [], raw_message: text };
  const headerRegex = /^ \[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+):/m;
  const headerMatch = text.match(headerRegex);
  order.order_date = headerMatch ? new Date(headerMatch[1].split('/').reverse().join('-') + 'T' + headerMatch[2]) : new Date();
  order.customer_name = headerMatch ? headerMatch[3] : 'Desconocido';

  const productRegex = /- (.+?) \(x(\d+)\) - [A-Z]{3} (\d[\d,.]*\d)/g;
  let productMatch;
  while ((productMatch = productRegex.exec(text)) !== null) {
    const productName = productMatch[1].trim();
    const quantity = parseInt(productMatch[2], 10);
    const linePrice = parseFloat(productMatch[3].replace(/,/g, ''));
    const existingProduct = storeProducts.find(p => p.nombre.toLowerCase() === productName.toLowerCase());

    order.products.push({
      name: productName,
      quantity: quantity,
      price: linePrice, // Precio total de la línea
      unit_price: quantity > 0 ? linePrice / quantity : linePrice, // Precio por unidad
      // Enriquecer con datos del producto encontrado
      foundProduct: existingProduct || null,
    });
  }

  const totalRegex = /\*\s*TOTAL A PAGAR\s*:\*\s*[A-Z]{3}\s*(\d[\d,.]*\d)/i;
  const totalMatch = text.match(totalRegex);
  order.total_price = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, '')) : 0;

  const shippingRegex = /\*\s*Método de Envío\s*:\*\s*(.*)/i;
  const paymentPlanRegex = /\*\s*Plan de Pago\s*:\*\s*(.*)/i;
  const shippingMatch = text.match(shippingRegex);
  const paymentPlanMatch = text.match(paymentPlanRegex);
  order.shipping_method = shippingMatch ? shippingMatch[1].trim() : 'No especificado';
  order.payment_plan = paymentPlanMatch ? paymentPlanMatch[1].trim() : 'No especificado';

  const paymentMethodRegex = /\*\s*Método de Pago\s*:\*\s*(.*)/i;
  const paymentMethodMatch = text.match(paymentMethodRegex);
  order.payment_method = paymentMethodMatch ? paymentMethodMatch[1].trim() : 'No especificado';

  if (order.products.length === 0) {
    throw new Error('No se encontraron productos con el formato esperado.');
  }
  return order;
}

const OrderProcessor = () => {
  const [orderText, setOrderText] = useState('');
  const [processedOrder, setProcessedOrder] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const invoiceRef = useRef(null);
  const storeProducts = useAppStore((state) => state.products);

  const handleHeaderChange = (e, field) => {
    setProcessedOrder(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleProcessOrder = async () => {
    if (!orderText) {
      setError('Por favor, pega el texto del pedido de WhatsApp.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const parsedOrder = parseOrderText(orderText, storeProducts);
      setProcessedOrder(parsedOrder);
    } catch (err) {
      const errorMessage = err.message || 'Error al procesar el pedido.';
      setError(errorMessage);
      setProcessedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    const invoiceElement = invoiceRef.current;
    if (!invoiceElement) return;

    try {
      const canvas = await html2canvas(invoiceElement, { scale: 2, useCORS: true });
      const imageURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imageURL;
      downloadLink.download = 'factura_' + (processedOrder?.customer_name || 'cliente') + '_' + Date.now() + '.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch {
      setError('Hubo un error al generar la imagen.');
    }
  };

  const orderTotals = processedOrder ? processedOrder.products.reduce((acc, p) => {
    const unitWeight = p.foundProduct?.peso_lb || 0;
    acc.totalWeight += unitWeight * p.quantity;
    acc.totalPrice += p.price;
    return acc;
  }, { totalWeight: 0, totalPrice: 0 }) : { totalWeight: 0, totalPrice: 0 };

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-6">Gestor de Pedidos</h2>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 gap-8">
          <div>
            <h3 className="font-semibold mb-2">Pega aquí tu pedido de WhatsApp:</h3>
            <textarea
              className="w-full h-48 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Pega el texto completo del mensaje de WhatsApp aquí..."
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
            />
            <button onClick={handleProcessOrder} disabled={isLoading} className="mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
              {isLoading ? 'Procesando...' : 'Procesar Pedido'}
            </button>
          </div>
          
          {error && <p className="text-red-500 text-center">{error}</p>}

          {processedOrder && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Pedido Procesado:</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div ref={invoiceRef} className="p-4 bg-white border rounded-lg">
                  <h4 className="font-bold text-lg mb-4">Factura de Pedido</h4>
                  <div className="mb-2">
                    <label className="font-bold text-sm">Cliente: </label>
                    <input 
                      type="text" 
                      value={processedOrder.customer_name}
                      onChange={(e) => handleHeaderChange(e, 'customer_name')}
                      className="p-1 border rounded bg-gray-50 w-full"
                    />
                  </div>
                  <p><b>Fecha:</b> {new Date(processedOrder.order_date).toLocaleString()}</p>
                  <p><b>Método de Envío:</b> {processedOrder.shipping_method}</p>
                  <p><b>Plan de Pago:</b> {processedOrder.payment_plan}</p>
                  <p><b>Método de Pago:</b> {processedOrder.payment_method}</p>
                  <table className="w-full mt-4 text-sm text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2">Producto</th>
                        <th className="p-2">Cant.</th>
                        <th className="p-2">P. Unit.</th>
                        <th className="p-2">Peso Unit.</th>
                        <th className="p-2">P. Total</th>
                        <th className="p-2">Peso Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedOrder.products.map((p, index) => {
                        const unitWeight = p.foundProduct?.peso_lb || 0;
                        const totalWeight = unitWeight * p.quantity;
                        return (
                          <tr key={index}>
                            <td className="p-2 border-t">{p.name}</td>
                            <td className="p-2 border-t">{p.quantity}</td>
                            <td className="p-2 border-t">C${p.unit_price.toFixed(2)}</td>
                            <td className="p-2 border-t">{unitWeight.toFixed(2)} lb</td>
                            <td className="p-2 border-t">C${p.price.toFixed(2)}</td>
                            <td className="p-2 border-t">{totalWeight.toFixed(2)} lb</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="font-bold bg-gray-50">
                      <tr className="border-t-2">
                        <td className="p-2" colSpan="4">Totales Generales:</td>
                        <td className="p-2">C${orderTotals.totalPrice.toFixed(2)}</td>
                        <td className="p-2">{orderTotals.totalWeight.toFixed(2)} lb</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold mb-2">Acciones del Pedido</h4>
                <p className="text-xs text-gray-600 mb-3">Esta área sirve para que lleves un control del pedido y saber cuáles ya tienes encargados.</p>
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2">Producto</th>
                      <th className="p-2">Acción</th>
                      <th className="p-2">Estado de Tarea</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedOrder.products.map((p, index) => (
                      p.foundProduct && p.foundProduct.distributorLink && (
                        <tr key={index} className="border-t">
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">
                            <a href={p.foundProduct.distributorLink} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                              Ir a encargo
                            </a>
                          </td>
                          <td className="p-2">
                            <input type="checkbox" className="h-5 w-5 rounded border-gray-300" title="Marcar como encargado" />
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
              <button onClick={handleDownloadInvoice} className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600">
                Descargar Factura como Imagen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderProcessor;
