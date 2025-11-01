import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface GenderDistribution {
  gender: string;
  count: number;
}

interface Demographics {
  genderDistribution: GenderDistribution[];
  averageAge: string | null;
}

const RegistrationChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Registros',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [demographics, setDemographics] = useState<Demographics | null>(null);
  const [loadingDemographics, setLoadingDemographics] = useState(true);
  const [demographicsError, setDemographicsError] = useState('');


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/admin/registration-stats');
        const stats = response.data;

        const labels = stats.map((s: any) => s.date);
        const data = stats.map((s: any) => s.count);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Registros',
              data,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        });
      } catch (err: any) {
        setError('Error al cargar las estadísticas de registro.');
      } finally {
        setLoading(false);
      }
    };

    const fetchDemographics = async () => {
      try {
        const response = await apiClient.get('/admin/demographics-stats');
        setDemographics(response.data);
      } catch (err: any) {
        setDemographicsError('Error al cargar las estadísticas demográficas.');
      } finally {
        setLoadingDemographics(false);
      }
    };

    fetchStats();
    fetchDemographics();
  }, []);

  if (loading || loadingDemographics) {
    return <div className="bg-white shadow-md rounded-lg p-6 mb-8 text-center"><p>Cargando estadísticas...</p></div>;
  }

  if (error || demographicsError) {
    return <div className="bg-white shadow-md rounded-lg p-6 mb-8 text-center text-red-600"><p>{error || demographicsError}</p></div>;
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Registros de Usuarios por Día',
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-lg border-t-4 border-googleBlue p-6 mb-8">
      <h2 className="text-2xl font-bold text-googleBlue mb-4">Estadísticas de Registro y Demografía</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Registros por Día</h3>
          <Bar options={options} data={chartData} />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-neutral-800 mb-4">Demografía de Usuarios</h3>
          {demographics && (
            <div className="space-y-4">
              <p className="text-lg"><strong>Edad Promedio:</strong> {demographics.averageAge || 'N/A'}</p>
              <div>
                <p className="text-lg mb-2"><strong>Distribución por Género:</strong></p>
                {demographics.genderDistribution.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {demographics.genderDistribution.map((item, index) => (
                      <li key={index}>{item.gender}: {item.count} usuarios</li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay datos de género disponibles.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationChart;
