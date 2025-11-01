import { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import UserStats from '../components/dashboard/UserStats';
import PaymentPlanChart from '../components/dashboard/PaymentPlanChart'; // <-- Importar nuevo componente
import MonthlyFinancialsChart from '../components/dashboard/MonthlyFinancialsChart';
import UserInfo from '../components/dashboard/UserInfo';
import StoreManager from '../components/dashboard/StoreManager';
import CustomerManager from '../components/dashboard/CustomerManager';
import TopCustomersList from '../components/dashboard/TopCustomersList';
import TopProductsChart from '../components/dashboard/TopProductsChart';
import FastestPayersList from '../components/dashboard/FastestPayersList';
import YellowListCustomers from '../components/dashboard/YellowListCustomers';
import TopRevenueProductsChart from '../components/dashboard/TopRevenueProductsChart'; // <-- Importar nuevo componente
import OrderProcessor from '../components/dashboard/OrderProcessor';
import AiChat from '../components/dashboard/AiChat';
import OrderList from '../components/dashboard/OrderList';

const UserDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, storesResponse] = await Promise.all([
          apiClient.get('/user/profile'),
          apiClient.get('/user/stores'),
        ]);

        const profilePayload = profileResponse.data;
        setUser(profilePayload.user || profilePayload);
        setStores(storesResponse.data || []);

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
              <div className="min-h-screen bg-neutral-100 font-sans p-4 md:p-8">
                <h1 className="text-3xl font-bold text-googleBlue mb-6 text-center">Panel de Control</h1>
                <div className="container mx-auto">
                  {/* Renderizar la lista amarilla en la parte superior */}
                  <YellowListCustomers />
                  <div className="bg-googleBlue-50 shadow-lg rounded-lg border-t-4 border-googleBlue p-6 md:p-10">
                    <UserStats />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
                      <PaymentPlanChart />
                      <TopRevenueProductsChart />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
                      <TopCustomersList />
                      <TopProductsChart />
                      <FastestPayersList />
                    </div>
                    <UserInfo user={user} />
                    <StoreManager stores={stores} />
                    <CustomerManager />
                    <OrderProcessor stores={stores} />
                    <OrderList />
                    <AiChat />
                  </div>
                </div>
              </div>
            );};



export default UserDashboard;
