import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopRevenueProduct {
  product_name: string;
  total_revenue: number;
}

const TopRevenueProductsChart = () => {
  const [products, setProducts] = useState<TopRevenueProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopRevenueProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/stats/top-products-by-revenue?limit=5');
        setProducts(response.data.reverse());
      } catch (err) {
        setError('No se pudieron cargar los productos más rentables.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopRevenueProducts();
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg border-t-4 border-blue-600 p-6">
      <h3 className="font-semibold text-lg text-blue-800 mb-4">Top 5 Productos (por Ingresos)</h3>
      {loading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : products.length === 0 ? (
        <p className="text-neutral-500">No hay suficientes datos para mostrar.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            layout="vertical"
            data={products}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(value) => `$${value}`} />
            <YAxis dataKey="product_name" type="category" width={150} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD' }).format(value)} wrapperClassName="rounded-lg shadow-lg"/>
            <Legend />
            <Bar dataKey="total_revenue" name="Ingresos Generados" fill="#34A853" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopRevenueProductsChart;
