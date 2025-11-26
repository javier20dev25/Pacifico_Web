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
    setSavingMessage('Iniciando proceso de guardado...');

    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        alert('Sesión no encontrada. Por favor inicia sesión de nuevo.');
        setIsSaving(false);
        return;
      }

      const currentState = useStore.getState();
      const finalPayload = JSON.parse(JSON.stringify({
        store: currentState.store,
        products: currentState.products,
      }));

      // 1. Subir el logo si existe
      if (currentState.store.logoFile) {
        setSavingMessage('Subiendo logo...');
        const logoFormData = new FormData();
        logoFormData.append('image', currentState.store.logoFile);
        
        // Usamos axios directo para la subida de archivos
        const uploadResponse = await axios.post('/api/uploads/upload-image', logoFormData);
        if (uploadResponse.data.success) {
          finalPayload.store.logoUrl = uploadResponse.data.url;
        } else {
          throw new Error('Falló la subida del logo.');
        }
      }

      // 2. Subir imágenes de productos si existen
      const productsToUpload = currentState.products.filter(p => p.imageFile);
      if (productsToUpload.length > 0) {
        setSavingMessage(`Subiendo ${productsToUpload.length} imágenes de productos...`);
        
        const uploadPromises = productsToUpload.map(product => {
          const productFormData = new FormData();
          productFormData.append('image', product.imageFile!);
          return axios.post('/api/uploads/upload-image', productFormData).then(response => ({
            idLocal: product.idLocal,
            url: response.data.url,
          }));
        });

        const uploadedImages = await Promise.all(uploadPromises);
        
        uploadedImages.forEach(uploadedImage => {
          const productIndex = finalPayload.products.findIndex((p:any) => p.idLocal === uploadedImage.idLocal);
          if (productIndex > -1) {
            finalPayload.products[productIndex].imageUrl = uploadedImage.url;
          }
        });
      }

      // 3. Limpiar el payload final de archivos locales
      delete finalPayload.store.logoFile;
      finalPayload.products.forEach((p: any) => delete p.imageFile);

      // 4. Guardar los datos de la tienda (ahora como JSON)
      setSavingMessage('Guardando datos de la tienda...');
      const response = await apiClient.put('/user/store-data', {
        storeData: finalPayload,
        launch,
      });

      // 5. Actualizar el estado local con la respuesta del servidor
      if (response.data && response.data.storeData) {
        const { storeData, slug, shareableUrl: rawUrl } = response.data;
        
        // Cache Busting: Añadir un timestamp a la URL para forzar la recarga
        const shareableUrl = rawUrl ? `${rawUrl}?v=${Date.now()}` : '';

        setStore({ ...storeData.store, slug, shareableUrl });
        setProducts(storeData.products || []);
        
        // Limpiar los archivos del estado para evitar re-subidas
        useStore.getState().setLogoFile(null);
        useStore.getState().clearProductImageFiles();
      }

      alert('¡Tienda guardada con éxito!');

    } catch (err: unknown) {
      let serverMsg = 'Error desconocido';
      if (axios.isAxiosError(err) && err.response?.data) {
        serverMsg = err.response.data.error || err.response.data.detail || err.message;
      } else if (err instanceof Error) {
        serverMsg = err.message;
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