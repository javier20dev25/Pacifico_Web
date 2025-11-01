import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopProduct {
  product_name: string;
  total_quantity: number;
}

const TopProductsChart = () => {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/stats/top-products?limit=5');
        // Recharts prefiere los datos en orden ascendente para graficar de abajo hacia arriba
        setProducts(response.data.reverse());
      } catch (err) {
        setError('No se pudieron cargar los productos más vendidos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg border-t-4 border-blue-600 p-6">
      <h3 className="font-semibold text-lg text-blue-800 mb-4">Top 5 Productos Más Vendidos</h3>
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
            <XAxis type="number" />
            <YAxis dataKey="product_name" type="category" width={150} tick={{ fontSize: 12 }} />
            <Tooltip wrapperClassName="rounded-lg shadow-lg"/>
            <Legend />
            <Bar dataKey="total_quantity" name="Cantidad Vendida" fill="#4285F4" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default TopProductsChart;
