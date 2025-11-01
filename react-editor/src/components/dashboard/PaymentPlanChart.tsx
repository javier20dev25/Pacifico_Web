import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlanUsage {
  plan_name: string;
  usage_count: number;
}

// Colores para el gráfico
const COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#A45D5D', '#5D5DA4'];

const PaymentPlanChart = () => {
  const [plans, setPlans] = useState<PlanUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanUsage = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/stats/plan-usage');
        setPlans(response.data);
      } catch (err) {
        setError('No se pudieron cargar las estadísticas de planes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanUsage();
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg border-t-4 border-blue-600 p-6">
      <h3 className="font-semibold text-lg text-blue-800 mb-4">Planes de Pago Más Usados</h3>
      {loading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : plans.length === 0 ? (
        <p className="text-neutral-500">No hay suficientes datos para mostrar.</p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={plans}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="usage_count"
              nameKey="plan_name"
            >
              {plans.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value} pedidos`} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default PaymentPlanChart;
