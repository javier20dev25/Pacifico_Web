import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../../api/axiosConfig';

interface StatusData {
  status: string;
  count: number;
}

// Asignar colores consistentes con los chips de estado que ya usamos
const STATUS_COLORS: { [key: string]: string } = {
  entregado: '#34A853', // googleGreen
  en_proceso: '#FBBC05', // googleYellow
  en_camino: '#FBBC05', // googleYellow
  pendiente: '#4285F4', // googleBlue
  cancelado: '#EA4335', // googleRed
};

const OrderStatusChart = () => {
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await apiClient.get('/stats/orders-by-status');
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch chart data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Cargando gráfico...</div>;
  }

  if (data.length === 0) {
    return <div className="text-center p-4 text-neutral-500">No hay datos de pedidos para mostrar.</div>;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-googleBlue mb-4">Pedidos por Estado</h3>
      <div className="bg-white shadow-lg rounded-lg border-t-4 border-googleBlue p-4" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="count"
              nameKey="status"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#808080'} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} pedidos`, `${name.charAt(0).toUpperCase() + name.slice(1)}`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OrderStatusChart;
