import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axiosConfig';
import { AxiosError } from 'axios';

// --- TIPOS ---
type Plan = {
  id: number;
  nombre: string;
};

type ResultData = {
  copyPasteMessage: string;
  credentials: {
    correo: string;
    password?: string;
  };
};

type CreateUserFormProps = {
  onUserCreated: () => void;
};

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onUserCreated }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [planNombre, setPlanNombre] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiClient.get('/admin/plans');
        const data = response.data || [];
        setPlans(data);
        if (data.length > 0) {
          setPlanNombre(data[0].nombre);
        }
      } catch {
        setError('No se pudieron cargar los planes.');
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await apiClient.post<ResultData>('/admin/create-temporary-user', {
        nombre,
        correo,
        plan_nombre: planNombre,
      });
      
      setResult(response.data);
      onUserCreated(); 
      setNombre('');
      setCorreo('');
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.error || 'Error al crear el usuario.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.copyPasteMessage) {
      navigator.clipboard.writeText(result.copyPasteMessage)
        .then(() => alert('Mensaje copiado al portapapeles!'))
        .catch(() => alert('Error al copiar el mensaje.'));
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Crear Usuario Temporal</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="user-nombre" className="block font-semibold text-gray-700 mb-1">Nombre del Cliente</label>
            <input type="text" id="user-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label htmlFor="user-email" className="block font-semibold text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" id="user-email" value={correo} onChange={(e) => setCorreo(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label htmlFor="user-plan" className="block font-semibold text-gray-700 mb-1">Plan Contratado</label>
            <select id="user-plan" value={planNombre} onChange={(e) => setPlanNombre(e.target.value)} required className="w-full px-3 py-2 border rounded-lg bg-white">
              {plans.length === 0 ? (
                <option disabled>Cargando...</option>
              ) : (
                plans.map(plan => <option key={plan.id} value={plan.nombre}>{plan.nombre}</option>)
              )}
            </select>
          </div>
        </div>
        <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
          {isLoading ? 'Generando...' : 'Generar Usuario Temporal'}
        </button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>

      {result && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-green-700">✅ Usuario Creado - Comparte estas credenciales:</h3>
          <p><strong>Email:</strong> {result?.credentials?.correo ?? 'No disponible'}</p>
          <p><strong>Contraseña Temporal:</strong> {result?.credentials?.password ?? 'No disponible'}</p>
          <hr className="my-2" />
          <h4 className="font-semibold">Mensaje para el Cliente:</h4>
          <textarea readOnly value={result?.copyPasteMessage ?? ''} className="w-full h-48 p-2 mt-2 border rounded bg-gray-50" />
          <button onClick={copyToClipboard} className="mt-2 bg-gray-200 text-black font-semibold py-1 px-3 rounded-lg hover:bg-gray-300">Copiar Mensaje</button>
        </div>
      )}
    </div>
  );
};

export default CreateUserForm;