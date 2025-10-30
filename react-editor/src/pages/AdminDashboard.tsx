import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import AdminStats from '../components/admin/AdminStats';
import CreateUserForm from '../components/admin/CreateUserForm';
import UsersTable from '../components/admin/UsersTable';
import RegistrationChart from '../components/admin/RegistrationChart';

import type { User } from '../types/user';

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ temp: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchUsers = async () => {
    // Envolvemos la lógica en una función que podamos reutilizar
    try {
      setLoading(true);
                    const response = await apiClient.get('/admin/users');
                    const fetchedUsers: User[] = response.data || [];
                    setUsers(fetchedUsers);
      
                    let tempCount = 0;
                    let activeCount = 0;
                    fetchedUsers.forEach(user => {
                      if (user.status === 'temporary') tempCount++;
                      if (user.status === 'active') activeCount++;
                    });      setStats({ temp: tempCount, active: activeCount });

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

  return (
    <div className="min-h-screen bg-neutral-100 font-sans p-4 md:p-8">
      <div className="container mx-auto bg-white shadow-md rounded-lg p-6 md:p-10">
        <h1 className="text-3xl font-bold text-neutral-800 mb-6">Panel de Administrador</h1>
        <AdminStats stats={stats} />
        <CreateUserForm onUserCreated={fetchUsers} />
        <UsersTable users={users} onUserAction={fetchUsers} />
        <RegistrationChart />
      </div>
    </div>
  );
};

export default AdminDashboard;
