import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import OrderDetailsModal from './OrderDetailsModal';

// --- Interfaces & Constants ---
interface Order {
  id: number;
  customer_info: { name: string };
  total_amount: number;
  payment_status: 'pendiente' | 'parcial' | 'pagado';
  delivery_status: 'pendiente' | 'en_proceso' | 'en_camino' | 'entregado' | 'cancelado';
  created_at: string;
  is_overdue: boolean; // <-- NUEVO CAMPO
}

const PAYMENT_STATUSES: Order['payment_status'][] = ['pendiente', 'parcial', 'pagado'];
const DELIVERY_STATUSES: Order['delivery_status'][] = ['pendiente', 'en_proceso', 'en_camino', 'entregado', 'cancelado'];

const getStatusChipClass = (status: string) => {
  switch (status) {
    case 'pagado': case 'entregado': return 'bg-green-200 text-green-800';
    case 'parcial': case 'en_proceso': case 'en_camino': return 'bg-yellow-200 text-yellow-800';
    case 'pendiente': return 'bg-blue-200 text-blue-800';
    case 'cancelado': return 'bg-red-200 text-red-800';
    default: return 'bg-neutral-200 text-neutral-800';
  }
};

// --- Componente Principal ---
const OrderList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/orders');
      setOrders(response.data);
    } catch (err) {
      setError('No se pudieron cargar los pedidos.');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: number, field: 'payment_status' | 'delivery_status', value: string) => {
    const originalOrders = [...orders];
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, [field]: value } as Order : o);
    setOrders(updatedOrders);

    try {
      await apiClient.put(`/orders/${orderId}`, { [field]: value });
      // No es necesario un fetchOrders completo, la UI ya es optimista.
    } catch (err) {
      console.error(`Failed to update order ${orderId}:`, err);
      setError(`Error al actualizar el pedido #${orderId}.`);
      setOrders(originalOrders); // Revertir en caso de error
    }
  };

  const handleOpenModal = (order: Order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  if (loading && orders.length === 0) return <p>Cargando pedidos...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">Historial de Pedidos</h2>
      <div className="bg-white shadow-lg rounded-lg border-t-4 border-blue-600 overflow-x-auto">
        {orders.length === 0 && !loading ? (
          <p className="p-6 text-center text-neutral-500">Aún no has registrado ningún pedido.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 text-neutral-600">
              <tr>
                <th className="p-4 font-semibold">ID</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Monto Total</th>
                <th className="p-4 font-semibold">Estado de Pago</th>
                <th className="p-4 font-semibold">Estado de Entrega</th>
                <th className="p-4 font-semibold">Fecha</th>
                <th className="p-4 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr 
                  key={order.id} 
                  className={`border-b border-neutral-200 hover:bg-blue-50 relative ${order.is_overdue ? 'bg-red-50' : ''}`}
                  title={order.is_overdue ? 'Este pedido tiene pagos retrasados' : ''}
                >
                  {/* --- NUEVO: Indicador visual de retraso --- */}
                  {order.is_overdue && <td className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></td>}
                  
                  <td className="p-4">#{order.id}</td>
                  <td className="p-4">{order.customer_info.name}</td>
                  <td className="p-4 font-medium">C${order.total_amount.toFixed(2)}</td>
                  <td className="p-4">
                    <select
                      value={order.payment_status}
                      onChange={(e) => handleStatusChange(order.id, 'payment_status', e.target.value)}
                      className={`px-2 py-1 text-xs font-bold rounded-full appearance-none border-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusChipClass(order.payment_status)}`}
                    >
                      {PAYMENT_STATUSES.map(status => (<option key={status} value={status} className="text-black bg-white">{status}</option>))}
                    </select>
                  </td>
                  <td className="p-4">
                     <select
                      value={order.delivery_status}
                      onChange={(e) => handleStatusChange(order.id, 'delivery_status', e.target.value)}
                      className={`px-2 py-1 text-xs font-bold rounded-full appearance-none border-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${getStatusChipClass(order.delivery_status)}`}
                    >
                      {DELIVERY_STATUSES.map(status => (<option key={status} value={status} className="text-black bg-white">{status}</option>))}
                    </select>
                  </td>
                  <td className="p-4 text-neutral-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <button onClick={() => handleOpenModal(order)} className="bg-blue-500 text-white text-xs font-semibold py-1 px-3 rounded-full hover:bg-blue-600 transition-colors">
                      Gestionar Pedido
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <OrderDetailsModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        order={selectedOrder} 
        onPaymentAdded={fetchOrders}
      />
    </div>
  );
};

export default OrderList;
