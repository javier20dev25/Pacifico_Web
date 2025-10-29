import { useState, useEffect } from 'react';
import apiClient from '../../api/axiosConfig';
import { UserPlusIcon, ClipboardDocumentIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Import Heroicons

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
  onUserCreated: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onUserCreated }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [planNombre, setPlanNombre] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

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
    setResult(null);

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

      setResult({ ...response.data, clientMessage });
      onUserCreated(); // Notificar al padre para que refresque la lista de usuarios
      // Limpiar formulario
      setNombre('');
      setCorreo('');

    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.clientMessage) {
      navigator.clipboard.writeText(result.clientMessage)
        .then(() => alert('Mensaje copiado al portapapeles!'))
        .catch(() => alert('Error al copiar el mensaje.'));
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
          className="w-full inline-flex items-center justify-center bg-primary-DEFAULT text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark disabled:bg-neutral-300 disabled:text-neutral-500 transition duration-300"
        >
          {isLoading ? (
            'Generando...'
          ) : (
            <><UserPlusIcon className="h-5 w-5 mr-2" /> Generar Usuario Temporal</>
          )}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>

      {result && (
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h3 className="font-bold text-primary-700 inline-flex items-center mb-2"><CheckCircleIcon className="h-5 w-5 mr-2" /> Usuario Creado - Comparte estas credenciales:</h3>
          <p className="text-neutral-700"><strong>Email:</strong> {result.credentials.correo}</p>
          <p className="text-neutral-700"><strong>Contraseña Temporal:</strong> {result.credentials.password}</p>
          <hr className="my-2 border-neutral-200" />
          <h4 className="font-semibold text-neutral-800">Mensaje para el Cliente:</h4>
          <textarea readOnly value={result.clientMessage} 
            className="w-full h-48 p-3 mt-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 outline-none"
          />
          <button onClick={copyToClipboard} 
            className="mt-2 inline-flex items-center justify-center bg-neutral-200 text-neutral-800 font-semibold py-1 px-3 rounded-lg hover:bg-neutral-300 transition duration-300"
          >
            <ClipboardDocumentIcon className="h-5 w-5 mr-2" /> Copiar Mensaje
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateUserForm;
