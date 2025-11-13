import { fmt } from '../../lib/format';
import React, { useEffect, useState } from 'react';

// Mock apiClient para el ejemplo, reemplaza con tu instancia real de Axios
const apiClient = {
  get: async (url: string) => {
    // Simula una llamada a la API, en tu caso esto sería una llamada real
    // con tu instancia de Axios configurada.
    // Este es solo un placeholder.
    console.log('axios.get(\'' + url + '\')');
    // Devuelve datos de ejemplo para que el componente no falle en la demo
    return Promise.resolve({ data: { totalRevenue: 1234.56, totalOrders: 42, totalCustomers: 18 } });
  }
};

// --- TIPOS ---
type StatCardProps = {
  title: string;
  value: string | number;
};

type UserStatsData = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
};

const StatCard: React.FC<StatCardProps> = ({ title, value }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
  </div>
);

const UserStats: React.FC = () => {
  const [stats, setStats] = useState<UserStatsData>({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get('/api/stats/summary');
        if (!mounted) return;
        setStats({
          totalRevenue: Number(res.data?.totalRevenue ?? 0),
          totalOrders: Number(res.data?.totalOrders ?? 0),
          totalCustomers: Number(res.data?.totalCustomers ?? 0)
        });
      } catch (e: unknown) {
        console.error('Failed to fetch stats', e);
        if (mounted) setStats({ totalRevenue: 0, totalOrders: 0, totalCustomers: 0 });
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <StatCard title="Ingresos" value={'C$' + fmt(stats.totalRevenue)} />
      <StatCard title="Pedidos" value={String(stats.totalOrders ?? 0)} />
      <StatCard title="Clientes" value={String(stats.totalCustomers ?? 0)} />
    </div>
  );
};

export default UserStats;