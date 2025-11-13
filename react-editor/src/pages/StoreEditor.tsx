import { useState } from 'react';
import useStore from '@/stores/store';
import StoreInfoCard from '@/components/StoreInfoCard';
import ProductEditor from '@/components/ProductEditor';
import LogisticsEditor from '@/components/LogisticsEditor';
import PaymentEditor from '@/components/PaymentEditor';
import ProductModal from '@/components/ProductModal';
import apiClient from '@/api/axiosConfig';
import { useInitialData } from '@/hooks/useInitialData';
import axios from 'axios';

function StoreEditor() {
  const store = useStore((state) => state.store);
  const shareableUrl = useStore((state) => state.store.shareableUrl);
  const setStoreType = useStore((state) => state.setStoreType);
  const products = useStore((state) => state.products);
  const isProductModalOpen = useStore((state) => state.isProductModalOpen);
  const setStore = useStore((state) => state.setStore);
  const setProducts = useStore((state) => state.setProducts);
  const { isLoading, isError } = useInitialData();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, ] = useState(0); // setUploadProgress no se usa
  const [savingMessage, setSavingMessage] = useState('Guardando...');

  // NOTA: El manejo de archivos (ej. logoFile) debería moverse al store de Zustand
  // para un manejo de estado más limpio, pero se mantiene local por simplicidad en este parche.

  const handleSave = async (launch = false) => {
    setIsSaving(true);
    setSavingMessage('Preparando datos para guardar...');

    try {
      const token = localStorage.getItem('sessionToken') || '';
      if (!token) {
        alert('Sesión no encontrada. Por favor inicia sesión de nuevo.');
        setIsSaving(false);
        return;
      }

      const formData = new FormData();

      // 1. Adjuntar el logo si ha sido modificado
      const logoFile = useStore.getState().store.logoFile;
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // 2. Adjuntar imágenes de productos si han sido modificadas
      const currentProducts = useStore.getState().products;
      currentProducts.forEach(product => {
        if (product.imageFile) {
          formData.append('products', product.imageFile, product.idLocal);
        }
      });

      // 3. Adjuntar los datos de la tienda y productos como un string JSON
      const payload = {
        store: { ...store },
        products: [...products],
      };
      delete payload.store.logoFile;
      payload.products.forEach(p => delete p.imageFile);

      formData.append('storeData', JSON.stringify(payload));
      formData.append('launch', String(launch));

      setSavingMessage('Enviando datos al servidor...');

      // 4. Enviar todo en una sola petición multipart
      const response = await apiClient.put('/user/store-data', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('>>> Respuesta de la API de guardado:', response?.status, response?.data);

      // 5. Actualizar el estado local con la respuesta del servidor
      if (response.data && response.data.storeData) {
        const { storeData, slug, shareableUrl } = response.data;
        
        // Actualizar el estado de la tienda
        setStore({ 
          ...storeData.store, 
          slug, 
          shareableUrl 
        });
        
        // Actualizar el estado de los productos
        setProducts(storeData.products || []);
        
        // Limpiar los archivos de imagen del estado para evitar re-subidas innecesarias
        useStore.getState().setLogoFile(null);
        useStore.getState().clearProductImageFiles();
      }

      alert('¡Tienda guardada con éxito!');

    } catch (err: unknown) {
      let serverMsg = 'Error desconocido';
      if (axios.isAxiosError(err) && err.response?.data) {
        serverMsg = err.response.data.error || err.response.data.detail || serverMsg;
      }
      console.error('Ocurrió un error durante el proceso de guardado:', err);
      alert('Error al guardar la tienda: ' + serverMsg);
    } finally {
      setIsSaving(false);
      setSavingMessage('');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-gray-700 text-lg">Cargando...</p></div>;
  }

  if (isError) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p className="text-red-500 text-lg">Error al cargar los datos de la tienda.</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <p className="text-white text-xl mb-2">{savingMessage}</p>
          <div className="w-3/4 max-w-lg bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: uploadProgress + '%' }}
            ></div>
          </div>
           <p className="text-white text-2xl mt-2 font-bold">{uploadProgress}%</p>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-6">{store.uuid ? 'Editor de Tienda: ' + store.nombre : 'Crear Nueva Tienda'}</h1>

      {!store.uuid && (
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">1. Elige el tipo de tu tienda</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div
              className={'flex-1 p-4 border rounded-lg cursor-pointer ' + (store.storeType === 'by_order' ? 'border-blue-600 bg-blue-50' : 'border-gray-300')}
              onClick={() => setStoreType('by_order')}
            >
              <h3 className="font-bold text-lg text-gray-800">Por Encargo</h3>
              <p className="text-sm text-gray-600">Ideal si compras productos en línea para revender en tiendas como Shein, Amazon, etc.</p>
            </div>
            <div
              className={'flex-1 p-4 border rounded-lg cursor-pointer ' + (store.storeType === 'in_stock' ? 'border-blue-600 bg-blue-50' : 'border-gray-300')}
              onClick={() => setStoreType('in_stock')}
            >
              <h3 className="font-bold text-lg text-gray-800">Con Stock Local</h3>
              <p className="text-sm text-gray-600">Ideal si tu proveedor es local o adquieres en tu localidad lo que vendes.</p>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">{store.uuid ? 'Edita los detalles de tu tienda' : '2. Completa los detalles de tu tienda'}</h2>
        <StoreInfoCard />
        {store.storeType === 'by_order' && <LogisticsEditor />}
        <PaymentEditor />
        <ProductEditor />
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.open(shareableUrl || '', '_blank')}
            disabled={isSaving || !shareableUrl}
            title={!shareableUrl ? 'Guarda la tienda para activar este botón' : 'Ver tu tienda como la ven tus clientes'}
            className="px-6 py-3 w-full sm:w-auto flex-1 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Ver Tienda
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="px-6 py-3 w-full sm:w-auto flex-1 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar y Publicar Cambios'}
          </button>
        </div>
      </div>

      {isProductModalOpen && <ProductModal />}
    </div>
  );
}

export default StoreEditor;