import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import apiClient from '@/api/axiosConfig';

// --- REGISTRO DE COMPONENTES DE CHART.JS ---
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// --- TIPOS ---
type Stat = {
  registration_date: string;
  user_count: number;
};

type ChartData = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
};

const RegistrationChart = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get<Stat[]>('/admin/registration-stats');
        const stats = response.data || [];
        
        const labels = stats.map((s: Stat) => s.registration_date);
        const data = stats.map((s: Stat) => s.user_count);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Usuarios Registrados',
              data: data,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1,
              fill: true,
            },
          ],
        });
      } catch (err) {
        setError('No se pudieron cargar las estadísticas de registro.');
        console.error('Error fetching chart data:', err);
      }
    };

    fetchStats();
  }, []);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Histórico de Registros</h2>
      <div className="relative h-64 md:h-80">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <p>Cargando gráfica...</p>
        )}
      </div>
    </div>
  );
};

export default RegistrationChart;