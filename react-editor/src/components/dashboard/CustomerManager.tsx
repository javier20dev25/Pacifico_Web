import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';

// --- Interfaces ---
interface Customer { id: number; name: string; phone: string; email: string; address: string; notes: string; }
interface Order {
  id: number;
  created_at: string;
  payment_status: 'pendiente' | 'parcial' | 'pagado';
  delivery_status: 'pendiente' | 'en_proceso' | 'en_camino' | 'entregado' | 'cancelado';
  total_amount: number;
  total_abonado: number;
  saldo_pendiente: number;
}

// --- Sub-componentes ---

const CreateCustomerForm = ({ onCustomerCreated }: { onCustomerCreated: () => void }) => { /* ... sin cambios ... */ };

const CustomerList = ({ customers, onCustomerSelect, selectedCustomerId }: { customers: Customer[], onCustomerSelect: (customer: Customer) => void, selectedCustomerId: number | null }) => { /* ... sin cambios ... */ };

// --- NUEVO: Sub-componente para estadísticas del cliente ---
const CustomerStats = ({ orders }: { orders: Order[] }) => {
  const totalComprado = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalAbonado = orders.reduce((sum, order) => sum + order.total_abonado, 0);
  const saldoTotalPendiente = totalComprado - totalAbonado;

  const StatCard = ({ title, value, colorClass }: { title: string, value: number, colorClass: string }) => (
    <div className={`p-4 rounded-lg text-center ${colorClass}`}>
      <p className="text-sm font-semibold opacity-80">{title}</p>
      <p className="text-2xl font-bold">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value)}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
      <StatCard title="Total Histórico Comprado" value={totalComprado} colorClass="bg-blue-100 text-blue-800" />
      <StatCard title="Total Histórico Pagado" value={totalAbonado} colorClass="bg-green-100 text-green-800" />
      <StatCard title="Saldo Pendiente Total" value={saldoTotalPendiente} colorClass="bg-red-100 text-red-800" />
    </div>
  );
};

// --- Sub-componente de historial de pedidos mejorado ---
const OrderHistory = ({ orders, isLoading, customerName }: { orders: Order[], isLoading: boolean, customerName: string }) => {
    if (isLoading) {
        return <div className="mt-6 text-center p-4">Cargando historial de pedidos...</div>;
    }

    const getStatusChipClass = (status: string) => {
        switch (status) {
            case 'pagado': case 'entregado': return 'bg-green-200 text-green-800';
            case 'parcial': case 'en_proceso': case 'en_camino': return 'bg-yellow-200 text-yellow-800';
            case 'pendiente': return 'bg-blue-200 text-blue-800';
            case 'cancelado': return 'bg-red-200 text-red-800';
            default: return 'bg-neutral-200 text-neutral-800';
        }
    };

    return (
        <div className="mt-8 pt-6 border-t">
            <h3 className="font-semibold text-lg mb-4">Historial de Pedidos para <span className="text-blue-600">{customerName}</span></h3>
            {orders.length === 0 ? (
                <p className="text-neutral-500 p-3">Este cliente no tiene pedidos registrados.</p>
            ) : (
                <>
                    <CustomerStats orders={orders} />
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-neutral-100 text-neutral-600">
                                <tr>
                                    <th className="p-3 font-semibold">ID</th>
                                    <th className="p-3 font-semibold">Fecha</th>
                                    <th className="p-3 font-semibold">E. Pago</th>
                                    <th className="p-3 font-semibold">E. Entrega</th>
                                    <th className="p-3 font-semibold text-right">Total Pedido</th>
                                    <th className="p-3 font-semibold text-right">Saldo Pendiente</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} className="border-b">
                                        <td className="p-3">#{order.id}</td>
                                        <td className="p-3">{new Date(order.created_at).toLocaleDateString()}</td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusChipClass(order.payment_status)}`}>{order.payment_status}</span></td>
                                        <td className="p-3"><span className={`px-2 py-1 text-xs font-bold rounded-full ${getStatusChipClass(order.delivery_status)}`}>{order.delivery_status}</span></td>
                                        <td className="p-3 text-right">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(order.total_amount)}</td>
                                        <td className={`p-3 text-right font-bold ${order.saldo_pendiente > 0 ? 'text-red-600' : 'text-green-600'}`}>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(order.saldo_pendiente)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};


// --- Componente Principal ---
const CustomerManager = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchCustomers = async (query: string = '') => { /* ... sin cambios ... */ };

  const handleCustomerSelect = async (customer: Customer) => {
    if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer(null);
        setOrders([]);
        return;
    }
    setSelectedCustomer(customer);
    setLoadingOrders(true);
    setOrders([]);
    try {
      const response = await apiClient.get<Order[]>(`/customers/${customer.id}/orders`);
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { /* ... debounce sin cambios ... */ }, [searchTerm]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">Gestión de Clientes</h2>
      <div className="bg-white shadow-lg rounded-lg border-t-4 border-blue-600 p-6">
        <CreateCustomerForm onCustomerCreated={() => fetchCustomers()} />
        <div className="mb-4">{/* ... input de búsqueda sin cambios ... */}</div>

        {loading ? <p>Buscando...</p> : <CustomerList customers={customers} onCustomerSelect={handleCustomerSelect} selectedCustomerId={selectedCustomer?.id || null} />}
        {error && <p className="text-red-600">{error}</p>}

        {selectedCustomer && (
            <OrderHistory orders={orders} isLoading={loadingOrders} customerName={selectedCustomer.name} />
        )}
      </div>
    </div>
  );
};

export default CustomerManager;
