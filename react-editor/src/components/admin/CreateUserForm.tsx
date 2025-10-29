import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axiosConfig';

const CreateUserForm = ({ onUserCreated }) => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [planNombre, setPlanNombre] = useState('');
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Cargar los planes disponibles al montar el componente
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await apiClient.get('/admin/plans');
        setPlans(response.data || []);
        if (response.data && response.data.length > 0) {
          setPlanNombre(response.data[0].nombre); // Seleccionar el primer plan por defecto
        }
      } catch (err) {
        setError('No se pudieron cargar los planes.');
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e) => {
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

    } catch (err) {
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
          <p><strong>Email:</strong> {result.credentials.correo}</p>
          <p><strong>Contraseña Temporal:</strong> {result.credentials.password}</p>
          <hr className="my-2" />
          <h4 className="font-semibold">Mensaje para el Cliente:</h4>
          <textarea readOnly value={result.clientMessage} className="w-full h-48 p-2 mt-2 border rounded bg-gray-50" />
          <button onClick={copyToClipboard} className="mt-2 bg-gray-200 text-black font-semibold py-1 px-3 rounded-lg hover:bg-gray-300">Copiar Mensaje</button>
        </div>
      )}
    </div>
  );
};

export default CreateUserForm;
