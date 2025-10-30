import { useState, useEffect } from 'react';

import AdminStats from '../components/admin/AdminStats';
import CreateUserForm from '../components/admin/CreateUserForm';
import UsersTable from '../components/admin/UsersTable';
import RegistrationChart from '../components/admin/RegistrationChart';

import type { User } from '../types/user';
import apiClient from '../api/axiosConfig';
import { CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'; // Import Heroicons

interface Result {
  credentials: {
    correo: string;
    password: string;
  };
  clientMessage: string;
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ temp: 0, active: 0 });
  const [generatedCredentials, setGeneratedCredentials] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

                const fetchUsers = async () => {

                  // Envolvemos la lógica en una función que podamos reutilizar

                  try {

                    setLoading(true);

                    setGeneratedCredentials(null); // Clear credentials after refresh

                    const response = await apiClient.get('/admin/users');

                    const fetchedUsers: User[] = response.data || [];

                    setUsers(fetchedUsers);

              

                    let tempCount = 0;

                    let activeCount = 0;

                    fetchedUsers.forEach(user => {

                      if (user.status === 'temporary') tempCount++;

                      if (user.status === 'active') activeCount++;

                    });

                    setStats({ temp: tempCount, active: activeCount });

                  } catch (err) {

                    setError('No se pudo cargar la lista de usuarios.');

                    console.error('[AdminDashboard] Error cargando usuarios:', err);

                  } finally {

                    setLoading(false);

                  }

                };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando panel de administrador...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
  }

            const filteredUsers = users.filter(user =>
              user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (user.nombre && user.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
              user.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (user.plan && user.plan.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          
            const handleUserCreated = (credentials: Result | null) => {
              setGeneratedCredentials(credentials);
              fetchUsers(); // Refresh user list
            };
          return (
            <div className="min-h-screen bg-neutral-100 font-sans p-4 md:p-8">
              <h1 className="text-3xl font-bold text-googleBlue mb-6 text-center">Panel de Control</h1>
              <div className="container mx-auto bg-googleBlue-50 shadow-lg rounded-lg border-t-4 border-googleBlue p-6 md:p-10">
                <AdminStats stats={stats} />
                <CreateUserForm onUserCreated={handleUserCreated} />

                {generatedCredentials && (
                  <div className="mt-6 p-4 bg-googleGreen-50 border border-googleGreen rounded-lg shadow-md">
                    <h3 className="font-bold text-googleGreen inline-flex items-center mb-2">
                      <CheckCircleIcon className="h-5 w-5 mr-2" /> Usuario Creado - Comparte estas credenciales:
                    </h3>
                    <p className="text-neutral-700"><strong>Email:</strong> {generatedCredentials.credentials.correo}</p>
                    <p className="text-neutral-700"><strong>Contraseña Temporal:</strong> {generatedCredentials.credentials.password}</p>
                    <hr className="my-2 border-neutral-200" />
                    <h4 className="font-semibold text-neutral-800">Mensaje para el Cliente:</h4>
                    <textarea readOnly value={generatedCredentials.clientMessage}
                      className="w-full h-48 p-3 mt-2 border border-neutral-300 rounded-lg bg-neutral-50 text-neutral-800 outline-none"
                    />
                    <button onClick={() => {
                      if (generatedCredentials?.clientMessage) {
                        navigator.clipboard.writeText(generatedCredentials.clientMessage)
                          .then(() => alert('Mensaje copiado al portapapeles!'))
                          .catch(() => alert('Error al copiar el mensaje.'));
                      }
                    }}
                      className="mt-2 inline-flex items-center justify-center bg-googleBlue text-white font-semibold py-1 px-3 rounded-lg shadow-md hover:bg-googleBlue transition duration-300"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5 mr-2" /> Copiar Mensaje
                    </button>
                  </div>
                )}

                <div className="mt-8 mb-4">
                  <input
                    type="text"
                    placeholder="Buscar usuarios por correo, nombre, estado o plan..."
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-googleBlue focus:border-googleBlue outline-none transition duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <UsersTable users={filteredUsers} onUserAction={fetchUsers} />
                <RegistrationChart />
              </div>
            </div>
          );
        };

export default AdminDashboard;
