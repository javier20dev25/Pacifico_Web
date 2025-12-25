import { useState, useEffect } from 'react';
import apiClient from '@/api/axiosConfig';
import { Link } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import AdminStats from '@/components/admin/AdminStats';
import CreateUserForm from '@/components/admin/CreateUserForm';
import UsersTable from '@/components/admin/UsersTable';
import RegistrationChart from '@/components/admin/RegistrationChart';
import type { User } from '@/components/admin/UsersTable';

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ temp: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      const response = await apiClient.get<User[]>('/admin/users');
      const fetchedUsers = response.data || [];
      setUsers(fetchedUsers);

      let tempCount = 0;
      let activeCount = 0;
      fetchedUsers.forEach((user: User) => {
        if (user.status === 'temporary') tempCount++;
        if (user.status === 'active') activeCount++;
      });
      setStats({ temp: tempCount, active: activeCount });
    } catch (err) {
      setError('No se pudo cargar la lista de usuarios.');
      console.error('[AdminDashboard] Error cargando usuarios:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUsers(true);
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando panel de administrador...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Administrador</h1>
        <AdminStats stats={stats} />
        
        {/* Card de Navegación a Riel Admin */}
        <div className="my-8">
          <Link to="/admin/riel" className="block p-6 bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Rocket className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-slate-800">Gestionar Cuentas "Riel"</h2>
                <p className="text-sm text-slate-500">Revisa las solicitudes de prueba gratuita y crea las cuentas para los nuevos usuarios.</p>
              </div>
            </div>
          </Link>
        </div>

        <CreateUserForm onUserCreated={fetchUsers} />
        <UsersTable users={users} onUserAction={fetchUsers} />
        <RegistrationChart />
    </div>
  );
};

export default AdminDashboard;
