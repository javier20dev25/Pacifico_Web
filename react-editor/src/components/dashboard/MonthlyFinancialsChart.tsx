import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import apiClient from '../../api/axiosConfig';

interface MonthlyData {
  month: string;
  total_revenue: number;
  total_pending: number;
}

const MonthlyFinancialsChart = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await apiClient.get('/stats/monthly-financials');
        setData(response.data);
      } catch (err) {
        console.error('Failed to fetch monthly financials', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  if (loading) {
    return <div className="text-center p-4">Cargando gráfico de finanzas...</div>;
  }

  if (data.length === 0) {
    return <div className="text-center p-4 text-neutral-500">No hay datos financieros para mostrar.</div>;
  }

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-googleBlue mb-4">Resumen Financiero Mensual</h3>
      <div className="bg-white shadow-lg rounded-lg border-t-4 border-googleBlue p-4" style={{ height: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`C$${value.toFixed(2)}`, '']} />
            <Legend />
            <Bar dataKey="total_revenue" name="Ingresos (Pagado)" fill="#34A853" />
            <Bar dataKey="total_pending" name="Saldo Pendiente" fill="#FBBC05" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MonthlyFinancialsChart;
