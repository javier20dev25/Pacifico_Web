import { useState, useEffect } from 'react';
import apiClient from '@/api/axiosConfig';
import UserInfo from '@/components/dashboard/UserInfo';
import StoreManager from '@/components/dashboard/StoreManager';
import OrderProcessor from '@/components/dashboard/OrderProcessor';
import AiChat from '@/components/dashboard/AiChat';
import RielManager from '@/components/dashboard/RielManager';
import type { Store } from '@/types'; // Importar el tipo compartido

interface User {
  nombre: string;
  plan: string;
  status: string;
}

const UserDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [profileResponse, storesResponse] = await Promise.all([
          apiClient.get('/user/profile'),
          apiClient.get('/user/stores'),
        ]);

        // La respuesta de /user/profile anida el usuario en { user: ... }
        setUser(profileResponse.data.user || profileResponse.data);
        setStores(storesResponse.data);
      } catch (err) {
        setError('No se pudieron cargar los datos del dashboard. Intenta iniciar sesión de nuevo.');
        console.error('[UserDashboard] Error cargando datos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando dashboard...</p></div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-500">{error}</p></div>;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrderProcessor />;
      case 'chat':
        return <AiChat />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <UserInfo user={user} className="mb-8" />
      <StoreManager stores={stores} className="mb-8" />

      {/* Tarea 4: Lógica para mostrar el gestor de Riel a planes 'ejecutivo' */}
      {user?.plan === 'ejecutivo' && <RielManager stores={stores} className="mb-8" />}

      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setActiveTab(activeTab === 'orders' ? null : 'orders')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-gray-700 shadow-md'}`}
        >
          Gestor de Pedidos
        </button>
        <button
          onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 shadow-md'}`}
        >
          Asistente de IA
        </button>
      </div>

      <div className="mt-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default UserDashboard;