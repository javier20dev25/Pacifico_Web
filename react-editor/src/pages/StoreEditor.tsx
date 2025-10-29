
import { useState } from 'react';
import useStore from '../stores/store';
import StoreInfoCard from '../components/StoreInfoCard';
import ProductEditor from '../components/ProductEditor';
import LogisticsEditor from '../components/LogisticsEditor';
import PaymentEditor from '../components/PaymentEditor';
import ProductModal from '../components/ProductModal';
import apiClient from '../api/axiosConfig';
import { useInitialData } from '../hooks/useInitialData';
import viewerHtml from '../assets/viewer_template.html?raw'; // Importar como string

// Helper para subir imágenes con progreso
const uploadImage = async (
  file: File,
  folder: string,
  fileId: string,
  onProgress: (progress: number) => void
): Promise<string | null> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  formData.append('fileId', fileId);

  try {
    const response = await apiClient.post('/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data.publicUrl;
  } catch (error) {
    console.error(`Error subiendo imagen a ${folder}:`, error);
    return null;
  }
};

function StoreEditor() {
  const store = useStore((state) => state.store);
  const shareableUrl = useStore((state) => state.store.shareableUrl);
  const setStoreType = useStore((state) => state.setStoreType);
  const products = useStore((state) => state.products);
  const setStoreDetails = useStore((state) => state.setStoreDetails);
  const isProductModalOpen = useStore((state) => state.isProductModalOpen);
  const { isLoading, isError } = useInitialData();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingMessage, setSavingMessage] = useState('Guardando...');

  const handleSave = async () => {
    setIsSaving(true);
    setUploadProgress(0);

    try {
      let updatedStore = { ...store };
      let updatedProducts = JSON.parse(JSON.stringify(products)); // Deep copy

      // 1. Subir logo de la tienda si ha cambiado
      if (updatedStore.logoFile) {
        setSavingMessage(`Subiendo logo de la tienda...`);
        const newLogoUrl = await uploadImage(
          updatedStore.logoFile,
          'store_logos',
          updatedStore.uuid || `store_${Date.now()}`,
          setUploadProgress
        );
        if (newLogoUrl) {
          updatedStore.logoUrl = newLogoUrl;
        }
      }
      delete updatedStore.logoFile;

      // 2. Subir imágenes de productos secuencialmente para mostrar progreso
      const productsToUpload = updatedProducts.filter((p: any) => p.imageFile);
      for (let i = 0; i < productsToUpload.length; i++) {
        const product = productsToUpload[i];
        setSavingMessage(`Subiendo imagen ${i + 1} de ${productsToUpload.length}: ${product.nombre}`);
        const newImageUrl = await uploadImage(
          product.imageFile,
          'product_images',
          product.idLocal,
          setUploadProgress
        );
        if (newImageUrl) {
          const originalIndex = updatedProducts.findIndex((p: any) => p.idLocal === product.idLocal);
          if (originalIndex !== -1) {
            updatedProducts[originalIndex].imageUrl = newImageUrl;
          }
        }
      }

      setSavingMessage('Limpiando y preparando datos...');
      updatedProducts = updatedProducts.map((p: any) => {
        const { imageFile, ...rest } = p;
        return rest;
      });

      // 3. Construir el payload final
      const finalPayload = {
        store: updatedStore,
        products: updatedProducts,
      };

      setSavingMessage('Guardando datos en el servidor...');
      setUploadProgress(100); // Simular fin de subida

      const response = store.uuid
        ? await apiClient.put(`/user/store-data`, { storeData: finalPayload })
        : await apiClient.post(`/stores`, { storeData: finalPayload }); // <--- CORREGIDO

      alert('¡Tienda guardada con éxito!');

      const newShareableUrl = response.data.shareableUrl;

      if (response.data.data) { // Ajustado para el payload de respuesta del PUT
        const responseData = response.data.data[0]; // El update devuelve un array
        if (responseData && responseData.data) {
            const updatedStoreDetails = {
              ...responseData.data.store,
              shareableUrl: newShareableUrl,
            };
            setStoreDetails(updatedStoreDetails);
            useStore.setState({ products: responseData.data.products || [] });
        }
      }

    } catch (error) {
      console.error('Error al guardar la tienda:', error);
      alert('Error al guardar la tienda. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
      setSavingMessage('Guardando...');
    }
  };

  const handlePreview = () => {
    try {
      let finalHtml = viewerHtml;
      const currentState = useStore.getState();
      const previewData = {
        store: currentState.store,
        products: currentState.products,
      };
      const supabaseConfig = {
        url: import.meta.env.VITE_SUPABASE_URL,
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        bucket: import.meta.env.VITE_STORAGE_BUCKET || 'imagenes',
      };
      const injectedScript = `<script>\n        window.STORE_DATA = ${JSON.stringify(previewData)};\n        window.SUPABASE_CONFIG = ${JSON.stringify(supabaseConfig)};\n      </script>`;
      finalHtml = finalHtml.replace('<!-- SERVER_DATA_INJECTION -->', injectedScript);

      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(finalHtml);
        previewWindow.document.close();
      } else {
        alert('No se pudo abrir la ventana de previsualización. Revisa si tu navegador bloquea las ventanas emergentes.');
      }
    } catch (error: unknown) {
      console.error('Error al generar la vista previa:', error);
      if (error instanceof Error) {
        alert(`Error al generar la vista previa: ${error.message}`);
      } else {
        alert(`Error al generar la vista previa: ${String(error)}`);
      }
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
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
           <p className="text-white text-2xl mt-2 font-bold">{uploadProgress}%</p>
        </div>
      )}

      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {store.uuid ? `Editor de Tienda: ${store.nombre}` : 'Crear Nueva Tienda'}
      </h1>

      {!store.uuid && (
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">1. Elige el tipo de tu tienda</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div
              className={`flex-1 p-4 border rounded-lg cursor-pointer ${store.storeType === 'by_order' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              onClick={() => setStoreType('by_order')}
            >
              <h3 className="font-bold text-lg text-gray-800">Por Encargo</h3>
              <p className="text-sm text-gray-600">Ideal si compras productos en línea para revender en tiendas como Shein, Amazon, etc.</p>
            </div>
            <div
              className={`flex-1 p-4 border rounded-lg cursor-pointer ${store.storeType === 'in_stock' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
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
            onClick={() => { if (shareableUrl) window.open(shareableUrl, '_blank'); }}
            disabled={isSaving || !shareableUrl}
            title={!shareableUrl ? 'Guarda la tienda para activar este botón' : 'Ver tu tienda como la ven tus clientes'}
            className="px-6 py-3 w-full sm:w-auto flex-1 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Vista Pública
          </button>
          <button
            onClick={handlePreview}
            disabled={isSaving}
            className="px-6 py-3 w-full sm:w-auto flex-1 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Vista Previa
          </button>
          <button
            onClick={handleSave}
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






