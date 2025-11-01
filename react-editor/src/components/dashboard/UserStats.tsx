import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { ArrowUpIcon, UsersIcon, ShoppingCartIcon, BanknotesIcon } from '@heroicons/react/24/outline';

interface Stats {
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
}

const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-googleBlue-100 p-3 rounded-full mr-4">
      {icon}
    </div>
    <div>
      <p className="text-sm text-neutral-500 font-semibold">{title}</p>
      <p className="text-2xl font-bold text-googleBlue">{value}</p>
    </div>
  </div>
);

const UserStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/stats/summary');
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <p>Cargando estadísticas...</p>;
  }

  if (!stats) {
    return null; // No mostrar nada si no hay estadísticas
  }

  return (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-googleBlue mb-6">Resumen General</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
                title="Ingresos Totales (Pagado)" 
                value={`C$${stats.totalRevenue.toFixed(2)}`} 
                icon={<BanknotesIcon className="h-6 w-6 text-googleBlue" />} 
            />
            <StatCard 
                title="Pedidos Totales" 
                value={stats.totalOrders} 
                icon={<ShoppingCartIcon className="h-6 w-6 text-googleBlue" />} 
            />
            <StatCard 
                title="Clientes Totales" 
                value={stats.totalCustomers} 
                icon={<UsersIcon className="h-6 w-6 text-googleBlue" />} 
            />
        </div>
    </div>
  );
};

export default UserStats;
