import { useState, useEffect } from 'react';
import apiClient from '@/api/axiosConfig';
import AdminStats from '@/components/admin/AdminStats';
import CreateUserForm from '@/components/admin/CreateUserForm';
import UsersTable from '@/components/admin/UsersTable';
import RegistrationChart from '@/components/admin/RegistrationChart';
import type { User } from '@/components/admin/UsersTable'; // Importamos el tipo User

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ temp: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
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
    <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Panel de Administrador</h1>
        <AdminStats stats={stats} />
        <CreateUserForm onUserCreated={fetchUsers} />
        <UsersTable users={users} onUserAction={fetchUsers} />
        <RegistrationChart />
    </div>
  );
};

export default AdminDashboard;
