import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { UserPlusIcon } from '@heroicons/react/24/outline'; // Import Heroicons

interface Plan {
  id: number;
  nombre: string;
}

interface Result {
  credentials: {
    correo: string;
    password: string;
  };
  clientMessage: string;
}

interface CreateUserFormProps {
  onUserCreated: (credentials: Result | null) => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onUserCreated }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [planNombre, setPlanNombre] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  // const [result, setResult] = useState<Result | null>(null); // Moved to parent

  // Cargar los planes disponibles al montar el componente
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiClient.get('/admin/plans');
        setPlans(response.data || []);
        if (response.data && response.data.length > 0) {
          setPlanNombre(response.data[0].nombre); // Seleccionar el primer plan por defecto
        }
      } catch (err: any) {
        setError('No se pudieron cargar los planes.');
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');


    try {
      const response = await apiClient.post('/admin/create-temporary-user', {
        nombre,
        correo,
        plan_nombre: planNombre,
      });

      const loginLink = window.location.origin + '/login'; // Apunta a la nueva ruta de React
      const clientMessage = `¡Hola ${nombre}!

Bienvenido a Pacífico Web. Hemos creado tu cuenta temporal para que puedas empezar.

Aquí tienes tus credenciales de acceso:
Enlace de entrada: ${loginLink}
Usuario: ${response.data.credentials.correo}
Contraseña Temporal: ${response.data.credentials.password}

Instrucciones:
1. Entra con tu usuario y contraseña temporal.
2. El sistema te pedirá que crees tu propia contraseña permanente.

Tu plan contratado es: ${planNombre}.`;

      const generatedResult = { ...response.data, clientMessage };
      onUserCreated(generatedResult); // Notificar al padre y pasar las credenciales
      // Limpiar formulario
      setNombre('');
      setCorreo('');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el usuario.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-neutral-800 mb-4">Crear Usuario Temporal</h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="user-nombre" className="block font-semibold text-neutral-700 mb-1">Nombre del Cliente</label>
            <input type="text" id="user-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition duration-200"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="block font-semibold text-neutral-700 mb-1">Correo Electrónico</label>
            <input type="email" id="user-email" value={correo} onChange={(e) => setCorreo(e.target.value)} required 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition duration-200"
            />
          </div>
          <div>
            <label htmlFor="user-plan" className="block font-semibold text-neutral-700 mb-1">Plan Contratado</label>
            <select id="user-plan" value={planNombre} onChange={(e) => setPlanNombre(e.target.value)} required 
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg bg-white focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none transition duration-200"
            >
              {plans.length === 0 ? (
                <option disabled>Cargando...</option>
              ) : (
                plans.map(plan => <option key={plan.id} value={plan.nombre}>{plan.nombre}</option>)
              )}
            </select>
          </div>
        </div>
        <button type="submit" disabled={isLoading} 
          className="w-full inline-flex items-center justify-center bg-googleBlue text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-googleBlue disabled:bg-neutral-300 disabled:text-neutral-500 transition duration-300"
        >
          {isLoading ? (
            'Generando...'
          ) : (
            <><UserPlusIcon className="h-5 w-5 mr-2" /> Generar Usuario Temporal</>
          )}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

            </div>
          );
};

export default CreateUserForm;
