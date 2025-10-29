import React, { useState, useEffect } from 'react';
import apiClient from '@/api/axiosConfig';
import UserInfo from '@/components/dashboard/UserInfo';
import StoreManager from '@/components/dashboard/StoreManager';
import OrderProcessor from '@/components/dashboard/OrderProcessor';
import AiChat from '@/components/dashboard/AiChat';

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Usamos Promise.all para cargar datos en paralelo, como en el script original
        const [profileResponse, storesResponse] = await Promise.all([
          apiClient.get('/user/profile'),
          apiClient.get('/user/stores'),
        ]);

        const profilePayload = profileResponse.data;
        setUser(profilePayload.user || profilePayload);
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

  return (
    <div className="container mx-auto p-4 md:p-8">
        <UserInfo user={user} />
        <StoreManager stores={stores} />
        <OrderProcessor />
        <AiChat />
    </div>
  );
};

export default UserDashboard;
