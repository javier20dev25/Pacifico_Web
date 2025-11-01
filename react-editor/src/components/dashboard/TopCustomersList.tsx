import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';

interface CustomerStats {
  customer_name: string;
  total_spent: number;
}

const TopCustomersList = () => {
  const [customers, setCustomers] = useState<CustomerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCustomers = async () => {
      try {
        const response = await apiClient.get('/stats/top-customers');
        setCustomers(response.data);
      } catch (err) {
        console.error('Failed to fetch top customers', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopCustomers();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Cargando clientes top...</div>;
  }

  if (customers.length === 0) {
    return <div className="text-center p-4 text-neutral-500">No hay clientes con pedidos registrados.</div>;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-googleBlue mb-4">Top 5 Clientes por Gasto</h3>
      <div className="bg-white shadow-lg rounded-lg border-t-4 border-googleBlue p-4">
        <ul className="divide-y divide-neutral-200">
          {customers.map((customer, index) => (
            <li key={index} className="py-3 flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-lg font-bold text-googleBlue mr-3">#{index + 1}</span>
                <p className="text-neutral-800 font-semibold">{customer.customer_name}</p>
              </div>
              <p className="text-neutral-600 font-medium">C${customer.total_spent.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TopCustomersList;
