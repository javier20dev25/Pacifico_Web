import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import useAppStore, { type Product } from '@/stores/store';

// --- TIPOS E INTERFACES ---

type OrderProduct = {
  name: string;
  quantity: number;
  price: number;
  unit_price: number;
  foundProduct: Product | null;
};

type ProcessedOrder = {
  products: OrderProduct[];
  raw_message: string;
  order_date: Date;
  customer_name: string;
  total_price: number;
  shipping_method: string;
  payment_plan: string;
  payment_method: string;
};

// --- LÓGICA DE PARSEO TIPADA ---

function parseOrderText(text: string, storeProducts: Product[]): ProcessedOrder {
  const order: Partial<ProcessedOrder> = { products: [], raw_message: text };
  
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
    const existingProduct = storeProducts.find(p => p.nombre.toLowerCase() === productName.toLowerCase()) || null;

    order.products?.push({
      name: productName,
      quantity: quantity,
      price: linePrice,
      unit_price: quantity > 0 ? linePrice / quantity : linePrice,
      foundProduct: existingProduct,
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

  if (!order.products || order.products.length === 0) {
    throw new Error('No se encontraron productos con el formato esperado.');
  }
  
  return order as ProcessedOrder;
}

// --- COMPONENTE PRINCIPAL ---

type OrderProcessorProps = {
  className?: string;
};

const OrderProcessor: React.FC<OrderProcessorProps> = ({ className }) => {
  const [orderText, setOrderText] = useState('');
  const [processedOrder, setProcessedOrder] = useState<ProcessedOrder | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const storeProducts = useAppStore((state) => state.products);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ProcessedOrder) => {
    if (!processedOrder) return;
    setProcessedOrder(prev => ({ ...prev!, [field]: e.target.value }));
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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al procesar el pedido.';
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
      downloadLink.download = `factura_${processedOrder?.customer_name || 'cliente'}_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch {
      setError('Hubo un error al generar la imagen.');
    }
  };

  const orderTotals = processedOrder ? processedOrder.products.reduce((acc, p) => {
    const unitWeight = p.foundProduct?.peso_lb || 0;
    acc.totalWeight += (typeof unitWeight === 'number' ? unitWeight : 0) * p.quantity;
    acc.totalPrice += p.price;
    return acc;
  }, { totalWeight: 0, totalPrice: 0 }) : { totalWeight: 0, totalPrice: 0 };

  return (
    <div className={`w-full max-w-xl mx-auto ${className}`}>
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 tracking-tight">
          Gestor de Pedidos
        </h1>
        <p className="text-gray-500 mt-2 text-lg">Optimiza tus ventas de WhatsApp</p>
      </header>

      <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-2xl transition duration-500 hover:shadow-3xl border border-gray-100 neon-border">
        <div className="flex items-center space-x-3 mb-6">
          <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.52 3.42 1.51 4.86l-1.57 5.75 5.88-1.53c1.42.85 3.06 1.31 4.1 1.31h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zm0 18.06c-1.35 0-2.73-.37-3.91-1.09l-.28-.16-2.92.76.77-2.83-.18-.29c-.77-1.23-1.18-2.65-1.18-4.08 0-4.5 3.67-8.17 8.17-8.17 2.2 0 4.2.86 5.73 2.38 1.52 1.53 2.38 3.53 2.38 5.73s-.86 4.2-2.38 5.73c-1.53 1.52-3.53 2.38-5.73 2.38zm3.62-5.48c-.2-.09-1.2-.59-1.39-.66-.18-.08-.32-.12-.45.12-.13.25-.51.66-.63.79-.12.13-.25.14-.49.07-.23-.07-1.03-.38-1.96-1.21-.73-.65-1.22-1.46-1.36-1.7-.14-.23-.01-.36.1-.51.1-.14.23-.37.35-.55.12-.17.16-.32.25-.49.09-.17.04-.32-.02-.45-.06-.13-.45-1.07-.61-1.46-.15-.38-.3-.33-.45-.33-.14 0-.3.02-.45.02s-.39.06-.6.31c-.2.25-.76.75-.76 1.84 0 1.09.78 2.13.89 2.27.12.14 1.54 2.37 3.73 3.32 2.2.95 2.62.83 3.1.77.49-.06 1.2-.49 1.36-.96.16-.47.16-.87.11-.96-.06-.09-.2-.14-.4-.22z"/>
          </svg>
          <h2 className="text-2xl font-semibold text-gray-800">
            Pega tu Pedido
          </h2>
        </div>

        <p className="text-gray-600 mb-4">
          Simplemente copia y pega el texto completo del chat de WhatsApp en el área de abajo.
        </p>

        <textarea
          id="whatsapp-input"
          rows={8}
          className="w-full p-4 text-gray-800 bg-gray-50 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition duration-300 placeholder-gray-400"
          placeholder="Ejemplo:
Pedido de Juan Pérez (ID: 123)
- 2x Tazas de Café Latte
- 1x Croissant de Jamón y Queso
- 1x Jugo de Naranja Natural
Dirección: Calle Falsa 123, Ciudad"
          value={orderText}
          onChange={(e) => setOrderText(e.target.value)}
        />

        <button
          type="button"
          onClick={handleProcessOrder}
          disabled={isLoading}
          className="mt-6 w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-500 focus:ring-opacity-50 transition transform duration-150 ease-in-out hover:scale-[1.01] active:scale-100"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944c6.832 0 10.252 5.46 9.177 9.873a11.942 11.942 0 01-1.74 3.791m-14.734-.149A11.942 11.942 0 012.823 12.817C1.748 8.404 5.168 2.944 12 2.944m0 0v-2.016m0 20.016v-2.016"/>
          </svg>
          {isLoading ? 'Procesando...' : 'Procesar Pedido'}
        </button>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        {processedOrder && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Detalles del Pedido Procesado</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div ref={invoiceRef} className="p-6 bg-white border border-gray-200 rounded-lg shadow-md">
                <h4 className="font-bold text-xl mb-4 text-center">Factura de Pedido</h4>
                <div className="mb-3">
                  <label className="font-bold text-sm text-gray-600">Cliente: </label>
                  <input
                    type="text"
                    value={processedOrder.customer_name}
                    onChange={(e) => handleHeaderChange(e, 'customer_name')}
                    className="p-2 border rounded bg-gray-50 w-full focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <p className="text-gray-700"><b>Fecha:</b> {new Date(processedOrder.order_date).toLocaleString()}</p>
                <p className="text-gray-700"><b>Método de Envío:</b> {processedOrder.shipping_method}</p>
                <p className="text-gray-700"><b>Plan de Pago:</b> {processedOrder.payment_plan}</p>
                <p className="text-gray-700"><b>Método de Pago:</b> {processedOrder.payment_method}</p>
                <table className="w-full mt-4 text-sm text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border-b-2 border-gray-300">Producto</th>
                      <th className="p-2 border-b-2 border-gray-300">Cant.</th>
                      <th className="p-2 border-b-2 border-gray-300">P. Unit.</th>
                      <th className="p-2 border-b-2 border-gray-300">Peso Unit.</th>
                      <th className="p-2 border-b-2 border-gray-300">P. Total</th>
                      <th className="p-2 border-b-2 border-gray-300">Peso Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedOrder.products.map((p, index) => {
                      const unitWeight = typeof p.foundProduct?.peso_lb === 'number' ? p.foundProduct.peso_lb : 0;
                      const totalWeight = unitWeight * p.quantity;
                      return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">{p.quantity}</td>
                          <td className="p-2">C${p.unit_price.toFixed(2)}</td>
                          <td className="p-2">{unitWeight.toFixed(2)} lb</td>
                          <td className="p-2">C${p.price.toFixed(2)}</td>
                          <td className="p-2">{totalWeight.toFixed(2)} lb</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="font-bold bg-gray-50">
                    <tr className="border-t-2 border-gray-300">
                      <td className="p-2" colSpan={4}>Totales Generales:</td>
                      <td className="p-2">C${orderTotals.totalPrice.toFixed(2)}</td>
                      <td className="p-2">{orderTotals.totalWeight.toFixed(2)} lb</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-inner">
                <h4 className="font-semibold text-xl mb-4">Acciones del Pedido</h4>
                <p className="text-sm text-gray-600 mb-4">Esta área sirve para que lleves un control del pedido y saber cuáles ya tienes encargados.</p>
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 border-b-2 border-gray-300">Producto</th>
                      <th className="p-2 border-b-2 border-gray-300">Acción</th>
                      <th className="p-2 border-b-2 border-gray-300">Estado de Tarea</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedOrder.products.map((p, index) => (
                      p.foundProduct && p.foundProduct.distributorLink && (
                        <tr key={index} className="border-b border-gray-100 hover:bg-white">
                          <td className="p-2">{p.name}</td>
                          <td className="p-2">
                            <a href={p.foundProduct.distributorLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-full hover:bg-emerald-600 transition-colors shadow-md">
                              Ir a encargo
                            </a>
                          </td>
                          <td className="p-2">
                            <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" title="Marcar como encargado" />
                          </td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <button onClick={handleDownloadInvoice} className="mt-8 w-full flex items-center justify-center px-6 py-3 border border-transparent text-lg font-bold rounded-xl shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 transition transform duration-150 ease-in-out hover:scale-[1.01] active:scale-100">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Descargar Factura como Imagen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderProcessor;
