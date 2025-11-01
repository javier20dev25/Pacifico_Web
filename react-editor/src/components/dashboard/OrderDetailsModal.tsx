import { useState, useEffect, useRef } from 'react';
import apiClient from '../../api/axiosConfig';
import html2canvas from 'html2canvas';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// --- Interfaces ---
interface Product { name: string; quantity: number; price: number; }
interface Order {
  id: number;
  customer_info: { name: string };
  total_amount: number;
  order_content: { products: Product[] };
  plan_tipo?: 'contado' | 'cuotas';
  plan_frecuencia?: 'semanal' | 'quincenal' | 'mensual';
  plan_cuotas?: number;
  store_name?: string; // <-- NUEVO
}
interface Abono { id: number; amount: number; payment_method: string; notes: string; created_at: string; }
interface Props { isOpen: boolean; onClose: () => void; order: Order | null; onPaymentAdded: () => void; }

// --- Componente de Factura para Captura ---
const InvoiceTemplate = ({ order, abonos, totalAbonado, saldoPendiente, innerRef }: any) => (
  <div ref={innerRef} className="p-8 bg-white text-black w-[600px]">
    <h1 className="text-3xl font-bold mb-2">Factura</h1>
    <p className="text-lg font-semibold text-neutral-700 mb-6">{order.store_name || 'Mi Tienda'}</p>
    
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div>
        <h2 className="font-bold text-neutral-800">CLIENTE:</h2>
        <p>{order.customer_info.name}</p>
      </div>
      <div className="text-right">
        <p><b>N° de Pedido:</b> #{order.id}</p>
        <p><b>Fecha:</b> {new Date().toLocaleDateString()}</p>
      </div>
    </div>

    <h3 className="font-bold text-lg mb-3">Detalles del Pedido</h3>
    <table className="w-full text-sm mb-6">
      <thead className="bg-neutral-100"><tr><th className="p-2 text-left">Producto</th><th className="p-2 text-center">Cant.</th><th className="p-2 text-right">Precio</th></tr></thead>
      <tbody>
        {order.order_content.products.map((p: any, i: number) => <tr key={i} className="border-b"><td className="p-2">{p.name}</td><td className="p-2 text-center">{p.quantity}</td><td className="p-2 text-right">C${p.price.toFixed(2)}</td></tr>)} 
      </tbody>
    </table>

    <h3 className="font-bold text-lg mb-3">Historial de Pagos</h3>
    <table className="w-full text-sm mb-6">
      <thead className="bg-neutral-100"><tr><th className="p-2 text-left">Fecha</th><th className="p-2 text-left">Método</th><th className="p-2 text-right">Monto</th></tr></thead>
      <tbody>
        {abonos.map((abono: any) => <tr key={abono.id} className="border-b"><td className="p-2">{new Date(abono.created_at).toLocaleDateString()}</td><td className="p-2">{abono.payment_method || 'N/A'}</td><td className="p-2 text-right">C${abono.amount.toFixed(2)}</td></tr>)}
        {abonos.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-neutral-500">No hay pagos registrados.</td></tr>}
      </tbody>
    </table>

    <div className="flex justify-end">
      <div className="w-1/2">
        <div className="flex justify-between"><span className="font-semibold">Subtotal:</span><span>C${order.total_amount.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="font-semibold">Total Abonado:</span><span>- C${totalAbonado.toFixed(2)}</span></div>
        <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t-2"><span className="">Saldo Pendiente:</span><span>C${saldoPendiente.toFixed(2)}</span></div>
      </div>
    </div>
  </div>
);


const OrderDetailsModal = ({ isOpen, onClose, order, onPaymentAdded }: Props) => {
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [planTipo, setPlanTipo] = useState('contado');
  const [planFrecuencia, setPlanFrecuencia] = useState('quincenal');
  const [planCuotas, setPlanCuotas] = useState('2');
  const [isSaving, setIsSaving] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null); // <-- Ref para la factura

  useEffect(() => {
    if (isOpen && order) {
      setAmount(''); setPaymentMethod(''); setNotes(''); setError(null);
      setPlanTipo(order.plan_tipo || 'contado');
      setPlanFrecuencia(order.plan_frecuencia || 'quincenal');
      setPlanCuotas(String(order.plan_cuotas || 2));

      setLoading(true);
      apiClient.get(`/orders/${order.id}/abonos`)
        .then(response => setAbonos(response.data))
        .catch(err => { setError('No se pudieron cargar los pagos.'); })
        .finally(() => setLoading(false));
    }
  }, [isOpen, order]);

  const handleAddAbono = async (e: React.FormEvent) => { /* ... sin cambios ... */ };
  const handleUpdateOrderPlan = async () => { /* ... sin cambios ... */ };

  // --- NUEVO: Lógica para descargar la factura ---
  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imageURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageURL;
      link.download = `factura_pedido_${order?.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating invoice', err);
      setError('No se pudo generar la factura.');
    }
  };

  if (!isOpen || !order) return null;

  const totalAbonado = abonos.reduce((sum, abono) => sum + abono.amount, 0);
  const saldoPendiente = order.total_amount - totalAbonado;

  return (
    <>
      {/* Contenedor oculto para la plantilla de la factura */}
      <div className="fixed -left-[9999px] top-0">
          <InvoiceTemplate innerRef={invoiceRef} order={order} abonos={abonos} totalAbonado={totalAbonado} saldoPendiente={saldoPendiente} />
      </div>

      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-4xl m-4 flex flex-col">
          <div className="flex-grow overflow-y-auto pr-2">
            {/* ... Contenido del modal sin cambios ... */}
          </div>

          {/* --- Acciones del Modal --- */}
          <div className="flex-shrink-0 border-t mt-8 pt-4 flex justify-between items-center">
            <button onClick={onClose} className="bg-neutral-200 text-neutral-800 py-2 px-4 rounded hover:bg-neutral-300">Cerrar</button>
            <div>
              <button onClick={handleDownloadInvoice} className="bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 mr-4 inline-flex items-center">
                <ArrowDownTrayIcon className="h-5 w-5 mr-2"/>
                Descargar Factura
              </button>
              <button onClick={handleUpdateOrderPlan} disabled={isSaving} className="bg-blue-600 text-white font-semibold py-2 px-5 rounded hover:bg-blue-700 disabled:bg-neutral-400">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsModal;
