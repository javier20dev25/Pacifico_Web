import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import apiClient from '../../api/axiosConfig';
import { ClipboardDocumentListIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Interfaces (sin cambios)
interface OrderProduct { name: string; quantity: number; price: number; }
interface Order { products: OrderProduct[]; raw_message: string; order_date: Date; customer_name: string; total_price: number; }
interface Store { id: string; data: { store_name: string; }; }
interface OrderProcessorProps { stores: Store[]; }

// Lógica de parseo (sin cambios)
function parseOrderText(text: string): Order {
  const order: Partial<Order> = { products: [], raw_message: text };
  const headerRegex = /^ \[(\d{1,2}\/\d{1,2}\/\d{2,4}), (\d{1,2}:\d{2}:\d{2})\] ([^:]+):/m;
  const headerMatch = text.match(headerRegex);
  order.order_date = headerMatch ? new Date(`${headerMatch[1].split('/').reverse().join('-')}T${headerMatch[2]}`) : new Date();
  order.customer_name = headerMatch ? headerMatch[3] : 'Desconocido';

  const productRegex = /- (.+?) \(x(\d+)\) - [A-Z]{3} (\d+\.\d{2})/g;
  let productMatch;
  while ((productMatch = productRegex.exec(text)) !== null) {
    order.products?.push({ name: productMatch[1].trim(), quantity: parseInt(productMatch[2], 10), price: parseFloat(productMatch[3]), });
  }

  const totalRegex = /\*Total a Pagar:\* [A-Z]{3} (\d+\.\d{2})/;
  const totalMatch = text.match(totalRegex);
  order.total_price = totalMatch ? parseFloat(totalMatch[1]) : 0;

  if (!order.products || order.products.length === 0) {
    throw new Error('No se encontraron productos con el formato esperado.');
  }
  return order as Order;
}

const OrderProcessor = ({ stores }: OrderProcessorProps) => {
  const [orderText, setOrderText] = useState('');
  const [processedOrder, setProcessedOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  // --- NUEVOS ESTADOS PARA PLAN DE PAGO ---
  const [planTipo, setPlanTipo] = useState('contado');
  const [planFrecuencia, setPlanFrecuencia] = useState('quincenal');
  const [planCuotas, setPlanCuotas] = useState('2');

  const handleProcessOrder = async () => {
    if (!selectedStoreId) {
      setError('Por favor, selecciona una tienda para asociar el pedido.');
      return;
    }
    if (!orderText) {
      setError('Por favor, pega el texto del pedido de WhatsApp.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const parsedOrder = parseOrderText(orderText);
      setProcessedOrder(parsedOrder);

      const newOrderPayload = {
        store_id: parseInt(selectedStoreId, 10),
        customer_info: { name: parsedOrder.customer_name },
        order_content: { products: parsedOrder.products, raw_message: parsedOrder.raw_message },
        total_amount: parsedOrder.total_price,
        // --- AÑADIR DATOS DEL PLAN DE PAGO AL PAYLOAD ---
        plan_tipo: planTipo,
        ...(planTipo === 'cuotas' && {
          plan_frecuencia: planFrecuencia,
          plan_cuotas: parseInt(planCuotas, 10),
        }),
      };

      await apiClient.post('/orders', newOrderPayload);
      
      alert('¡Pedido procesado y guardado con éxito en la base de datos!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Error al procesar el pedido.';
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
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-googleBlue mb-6">Gestor de Pedidos</h2>
      <div className="bg-googleBlue-50 shadow-lg rounded-lg border-t-4 border-googleBlue p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label htmlFor="store-select" className="font-semibold text-neutral-700 mb-2 block">1. Selecciona la Tienda</label>
              <select id="store-select" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)} className="w-full p-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-googleBlue focus:border-googleBlue outline-none transition duration-200">
                <option value="" disabled>-- Elige una tienda --</option>
                {stores && stores.map((store) => (<option key={store.id} value={store.id}>{store.data.store_name}</option>))}
              </select>
            </div>

            <h3 className="font-semibold text-neutral-700 mb-2">2. Pega aquí tu pedido de WhatsApp:</h3>
            <textarea className="w-full h-64 p-3 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-googleBlue focus:border-googleBlue outline-none transition duration-200" placeholder="Pega el texto completo del mensaje de WhatsApp aquí..." value={orderText} onChange={(e) => setOrderText(e.target.value)} />
            
            {/* --- NUEVOS CONTROLES PARA PLAN DE PAGO --- */}
            <div className="mt-4 p-4 border rounded-lg bg-white">
              <h3 className="font-semibold text-neutral-700 mb-3">3. Define el Plan de Pago</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1">Tipo de Plan</label>
                  <select value={planTipo} onChange={e => setPlanTipo(e.target.value)} className="w-full p-2 border rounded">
                    <option value="contado">Contado</option>
                    <option value="cuotas">Cuotas</option>
                  </select>
                </div>
                {planTipo === 'cuotas' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">Frecuencia</label>
                      <select value={planFrecuencia} onChange={e => setPlanFrecuencia(e.target.value)} className="w-full p-2 border rounded">
                        <option value="semanal">Semanal</option>
                        <option value="quincenal">Quincenal</option>
                        <option value="mensual">Mensual</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-600 mb-1">N° de Cuotas</label>
                      <input type="number" value={planCuotas} onChange={e => setPlanCuotas(e.target.value)} className="w-full p-2 border rounded" min="2" />
                    </div>
                  </>
                )}
              </div>
            </div>

            <button onClick={handleProcessOrder} disabled={isLoading} className="mt-4 w-full md:w-auto inline-flex items-center justify-center bg-googleBlue text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-googleBlue disabled:bg-neutral-300 disabled:text-neutral-500 transition duration-300">
              {isLoading ? 'Procesando...' : <><ClipboardDocumentListIcon className="h-5 w-5 mr-2" /> Procesar y Guardar Pedido</>}
            </button>
          </div>
          <div>
            <h3 className="font-semibold text-neutral-700 mb-2">Pedido Procesado:</h3>
            {error && <p className="text-googleRed">Error: {error}</p>}
            {processedOrder && (
              <div>
                <div ref={invoiceRef} className="p-4 bg-neutral-50 border border-googleBlue rounded-lg">
                  <h4 className="font-bold text-lg mb-4 text-googleBlue">Factura de Pedido</h4>
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
                    <tfoot className="font-bold text-googleBlue">
                      <tr className="border-t-2 border-neutral-300">
                        <td className="p-2" colSpan={2}>Total</td>
                        <td className="p-2">C${processedOrder.total_price.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <button onClick={handleDownloadInvoice} className="mt-4 w-full md:w-auto inline-flex items-center justify-center bg-googleGreen text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-googleGreen transition duration-300">
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
