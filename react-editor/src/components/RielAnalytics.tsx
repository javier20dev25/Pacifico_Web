// src/components/RielAnalytics.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '@/api/axiosConfig';
import useRielStore from '@/stores/rielStore';
import { Loader, ServerCrash, BarChart, Eye, Heart, XCircle, ShoppingCart } from 'lucide-react';

// Tipos para los datos de analíticas
interface AnalyticsData {
  total_visits: number;
  likes: Record<string, number>;
  nopes: Record<string, number>;
  added_to_cart: Record<string, number>;
}

interface ProcessedStat {
  productId: string;
  name: string;
  count: number;
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
    <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg">
      {icon}
    </div>
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const TopProductsList: React.FC<{ title: string; items: ProcessedStat[]; icon: React.ReactNode }> = ({ title, items, icon }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200">
    <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
      {icon}
      {title}
    </h3>
    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.slice(0, 5).map((item, index) => (
          <li key={item.productId} className="flex justify-between items-center text-sm p-2 rounded-md even:bg-slate-50">
            <span className="font-semibold text-slate-600 truncate">{index + 1}. {item.name}</span>
            <span className="font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded-full text-xs">{item.count}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-slate-400 text-center py-4">No hay datos suficientes.</p>
    )}
  </div>
);

const RielAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const products = useRielStore((state) => state.products);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.get('/riel/analytics');
        setData(response.data);
      } catch (err) {
        setError('No se pudieron cargar las analíticas.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const processStats = (stats: Record<string, number>): ProcessedStat[] => {
    return Object.entries(stats)
      .map(([productId, count]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product?.name || 'Producto no encontrado',
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="mt-3 text-slate-500 font-medium">Cargando estadísticas...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <ServerCrash className="w-12 h-12 text-red-400" />
        <p className="mt-3 text-red-600 font-semibold">{error || 'No se recibieron datos.'}</p>
      </div>
    );
  }

  const topLikes = processStats(data.likes);
  const topNopes = processStats(data.nopes);
  const topInCart = processStats(data.added_to_cart);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart />
            Resumen General
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Visitas Totales a la Tienda" value={data.total_visits} icon={<Eye />} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TopProductsList title="Top 5 Más Gustados" items={topLikes} icon={<Heart className="text-green-500" />} />
        <TopProductsList title="Top 5 Más Rechazados" items={topNopes} icon={<XCircle className="text-red-500" />} />
        <TopProductsList title="Top 5 Añadidos al Carrito" items={topInCart} icon={<ShoppingCart className="text-blue-500" />} />
      </div>
    </div>
  );
};

export default RielAnalytics;
