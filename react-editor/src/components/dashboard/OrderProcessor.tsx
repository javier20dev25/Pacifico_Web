import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import apiClient from '../../api/axiosConfig';
import { ClipboardDocumentListIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'; // Import Heroicons

interface OrderProduct {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  products: OrderProduct[];
  raw_message: string;
  order_date: Date;
  customer_name: string;
  total_price: number;
}

// Lógica de parseo portada directamente del script original
function parseOrderText(text: string): Order {
  const order: Partial<Order> = { products: [], raw_message: text };
  const headerRegex = /^ \[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+):/m;
  const headerMatch = text.match(headerRegex);
  order.order_date = headerMatch ? new Date(`${headerMatch[1].split('/').reverse().join('-')}T${headerMatch[2]}`) : new Date();
  order.customer_name = headerMatch ? headerMatch[3] : 'Desconocido';

  const productRegex = /- (.+?) \(x(\d+)\) - [A-Z]{3} (\d+\.\d{2})/g;
  let productMatch;
  while ((productMatch = productRegex.exec(text)) !== null) {
    order.products?.push({
      name: productMatch[1].trim(),
      quantity: parseInt(productMatch[2], 10),
      price: parseFloat(productMatch[3]),
    });
  }

  const totalRegex = /\*Total a Pagar:\* [A-Z]{3} (\d+\.\d{2})/;
  const totalMatch = text.match(totalRegex);
  order.total_price = totalMatch ? parseFloat(totalMatch[1]) : 0;

  if (!order.products || order.products.length === 0) {
    throw new Error('No se encontraron productos con el formato esperado.');
  }
  return order as Order;
}

const OrderProcessor = () => {
  const [orderText, setOrderText] = useState('');
  const [processedOrder, setProcessedOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleProcessOrder = async () => {
    if (!orderText) {
      setError('Por favor, pega el texto del pedido de WhatsApp.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const parsedOrder = parseOrderText(orderText);
      setProcessedOrder(parsedOrder);
      await apiClient.post('/user/orders', parsedOrder);
      alert('¡Pedido procesado y guardado con éxito!');
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pedido.';
      setError(errorMessage);
      setProcessedOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2, useCORS: true });
      const imageURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = imageURL;
      downloadLink.download = `factura_${processedOrder?.customer_name || 'cliente'}_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (err: any) {
      setError('Hubo un error al generar la imagen.');
    }
  };

  return (
    <div className="mb-8"> {/* Consistent spacing */}
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">Gestor de Pedidos</h2>
      <div className="bg-white shadow-md rounded-lg p-6"> {/* Consistent card styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-neutral-700 mb-2">Pega aquí tu pedido de WhatsApp:</h3>
            <textarea
              className="w-full h-64 p-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition duration-200"
              placeholder="Pega el texto completo del mensaje de WhatsApp aquí..."
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
            />
            <button onClick={handleProcessOrder} disabled={isLoading} 
              className="mt-4 w-full md:w-auto inline-flex items-center justify-center bg-primary-DEFAULT text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark disabled:bg-neutral-300 disabled:text-neutral-500 transition duration-300"
            >
              {isLoading ? (
                'Procesando...'
              ) : (
                <><ClipboardDocumentListIcon className="h-5 w-5 mr-2" /> Procesar Pedido</>
              )}
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-700 mb-2">Pedido Procesado:</h3>
            {error && <p className="text-red-600">{error}</p>}
            {processedOrder && (
              <div>
                <div ref={invoiceRef} className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                  <h4 className="font-bold text-lg mb-4 text-neutral-800">Factura de Pedido</h4>
                  <p className="text-neutral-700"><b>Cliente:</b> {processedOrder.customer_name}</p>
                  <p className="text-neutral-700"><b>Fecha:</b> {new Date(processedOrder.order_date).toLocaleString()}</p>
                  <table className="w-full mt-4 text-sm text-left border-collapse">
                    <thead className="bg-neutral-100">
                      <tr>
                        <th className="p-2 border-b border-neutral-300">Producto</th>
                        <th className="p-2 border-b border-neutral-300">Cant.</th>
                        <th className="p-2 border-b border-neutral-300">Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedOrder.products.map((p: OrderProduct, index: number) => (
                        <tr key={index}>
                          <td className="p-2 border-t border-neutral-200">{p.name}</td>
                          <td className="p-2 border-t border-neutral-200">{p.quantity}</td>
                          <td className="p-2 border-t border-neutral-200">C${p.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-bold text-neutral-800">
                      <tr className="border-t-2 border-neutral-300">
                        <td className="p-2" colSpan={2}>Total</td>
                        <td className="p-2">C${processedOrder.total_price.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button onClick={handleDownloadInvoice} 
                  className="mt-4 w-full md:w-auto inline-flex items-center justify-center bg-secondary-DEFAULT text-white font-semibold py-2 px-4 rounded-lg hover:bg-secondary-dark transition duration-300"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Descargar como Imagen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderProcessor;
