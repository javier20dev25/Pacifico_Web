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
import apiClient from '../../api/axiosConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }[];
}

const RegistrationChart = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin/registration-stats');
        const stats = response.data || [];

        const labels = stats.map((s: any) => s.registration_date);
        const data = stats.map((s: any) => s.user_count);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Usuarios Registrados',
              data: data,
              borderColor: '#1976D2', // primary.DEFAULT
              backgroundColor: 'rgba(25, 118, 210, 0.2)', // primary.DEFAULT with 0.2 opacity
              tension: 0.3, // Slightly smoother line
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
    plugins: {
      legend: {
        labels: {
          color: '#424242', // neutral-800
        },
      },
      title: {
        display: true,
        text: 'Histórico de Registros',
        color: '#424242', // neutral-800
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#616161', // neutral-700
        },
        grid: {
          color: '#E0E0E0', // neutral-300
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#616161', // neutral-700
        },
        grid: {
          color: '#E0E0E0', // neutral-300
        },
      },
    },
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8"> {/* Added mb-8 for consistent spacing */}
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">Histórico de Registros</h2>
      <div className="relative h-64 md:h-80">
        {error ? (
          <p className="text-red-600 text-center py-4">{error}</p>
        ) : chartData ? (
          <Line options={options} data={chartData} />
        ) : (
          <p className="text-neutral-500 text-center py-4">Cargando gráfica...</p>
        )}
      </div>
    </div>
  );
};

export default RegistrationChart;
