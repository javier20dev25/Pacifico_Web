import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { ExclamationTriangleIcon } from '@heroicons/react/24/solid';

interface YellowListCustomer {
  customer_name: string;
  overdue_orders_count: number;
  total_overdue_amount: number;
}

const YellowListCustomers = () => {
  const [customers, setCustomers] = useState<YellowListCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchYellowList = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/stats/yellow-list-customers');
        setCustomers(response.data);
      } catch (err) {
        setError('No se pudo cargar la lista de clientes en alerta.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchYellowList();
  }, []);

  // No renderizar el componente si no hay clientes en alerta, para no ocupar espacio.
  if (loading || error || customers.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-lg shadow-lg mb-8">
      <div className="flex items-center mb-4">
        <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-4" />
        <h2 className="text-2xl font-bold">Clientes en Alerta (Pagos Retrasados)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
            <thead className="text-left text-yellow-900 opacity-75">
                <tr>
                    <th className="p-2 font-semibold">Cliente</th>
                    <th className="p-2 font-semibold text-center">Pedidos Retrasados</th>
                    <th className="p-2 font-semibold text-right">Monto Vencido</th>
                </tr>
            </thead>
            <tbody>
                {customers.map((customer, index) => (
                    <tr key={index} className="border-t border-yellow-300">
                        <td className="p-3 font-medium">{customer.customer_name}</td>
                        <td className="p-3 text-center font-bold">{customer.overdue_orders_count}</td>
                        <td className="p-3 text-right font-bold text-red-600">
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(customer.total_overdue_amount)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};

export default YellowListCustomers;
