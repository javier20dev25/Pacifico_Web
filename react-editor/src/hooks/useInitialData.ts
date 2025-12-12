import { useState, useEffect } from 'react';
import useStore from '@/stores/store';
import apiClient from '../api/axiosConfig';

export function useInitialData() {
  const { setStoreDetails, setProducts, setPlanInfo } = useStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoading(true);
        setIsError(false);

        const response = await apiClient.get('/user/store-data');
        const { storeData, shareableUrl: rawUrl, planInfo } = response.data;

        if (storeData && storeData.store) {
          // Cache Busting: Añadir un timestamp a la URL para forzar la recarga
          const shareableUrl = rawUrl ? `${rawUrl}?v=${Date.now()}` : '';
          setStoreDetails({ ...storeData.store, shareableUrl });
        }
        if (storeData && storeData.products) {
          setProducts(storeData.products);
        }
        if (planInfo) {
          setPlanInfo(planInfo);
        }
      } catch (error) {
        console.error('Error al cargar los datos iniciales de la tienda:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [setStoreDetails, setProducts, setPlanInfo]);

  return { isLoading, isError };
}