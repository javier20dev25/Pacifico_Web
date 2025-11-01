import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';

interface FastestPayer {
  customer_name: string;
  avg_payment_duration: any; // Postgres INTERVAL can be complex, handle as object
}

// Helper to format the Postgres INTERVAL object/string
const formatDuration = (duration: any): string => {
    if (!duration) return 'N/A';

    let days = 0;
    if (duration.days) {
        days = duration.days;
    } else if (typeof duration === 'string') {
        const match = duration.match(/(\d+)\s+days?/);
        if (match) days = parseInt(match[1], 10);
    }

    if (days > 0) {
        return `~${days} día${days > 1 ? 's' : ''}`;
    }
    // Handle cases less than a day
    return 'Menos de 1 día';
};

const FastestPayersList = () => {
  const [payers, setPayers] = useState<FastestPayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFastestPayers = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/stats/fastest-payers?limit=5');
        setPayers(response.data);
      } catch (err) {
        setError('No se pudo cargar la lista de clientes.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFastestPayers();
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-lg border-t-4 border-green-600 p-6">
      <h3 className="font-semibold text-lg text-green-800 mb-4">Top 5 Clientes (Pago Rápido)</h3>
      {loading ? (
        <p>Cargando datos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : payers.length === 0 ? (
        <p className="text-neutral-500">No hay suficientes datos para mostrar.</p>
      ) : (
        <ol className="space-y-3">
          {payers.map((payer, index) => (
            <li key={index} className="flex justify-between items-center text-sm">
              <span className="font-medium text-neutral-700">{index + 1}. {payer.customer_name}</span>
              <span className="font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">{formatDuration(payer.avg_payment_duration)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default FastestPayersList;
