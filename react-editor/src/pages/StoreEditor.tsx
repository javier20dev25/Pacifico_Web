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
import { Package, Store as StoreIcon, CheckCircle2, Save, Eye } from 'lucide-react';

function StoreEditor() {
  const store = useStore((state) => state.store);
  const shareableUrl = useStore((state) => state.store.shareableUrl);
  const setStoreType = useStore((state) => state.setStoreType);
  const isProductModalOpen = useStore((state) => state.isProductModalOpen);
  const setStore = useStore((state) => state.setStore);
  const setProducts = useStore((state) => state.setProducts);
  const { isLoading, isError } = useInitialData();

  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, ] = useState(0);
  const [savingMessage, setSavingMessage] = useState('Guardando...');

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

      if (currentState.store.logoFile) {
        setSavingMessage('Subiendo logo...');
        const logoFormData = new FormData();
        logoFormData.append('image', currentState.store.logoFile);
        const uploadResponse = await axios.post('/api/uploads/upload-image', logoFormData);
        if (uploadResponse.data.success) {
          finalPayload.store.logoUrl = uploadResponse.data.url;
        } else {
          throw new Error('Falló la subida del logo.');
        }
      }

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

      delete finalPayload.store.logoFile;
      finalPayload.products.forEach((p: any) => delete p.imageFile);

      setSavingMessage('Guardando datos de la tienda...');
      const response = await apiClient.put('/user/store-data', {
        storeData: finalPayload,
        launch,
      });

      if (response.data && response.data.storeData) {
        const { storeData, slug, shareableUrl: rawUrl } = response.data;
        const shareableUrl = rawUrl ? `${rawUrl}?v=${Date.now()}` : '';
        setStore({ ...storeData.store, slug, shareableUrl });
        setProducts(storeData.products || []);
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
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-gray-700 text-lg">Cargando...</p></div>;
  }

  if (isError) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-red-500 text-lg">Error al cargar los datos de la tienda.</p></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
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

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">{store.uuid ? 'Editor de Tienda' : 'Crear Nueva Tienda'}</h1>
          <p className="text-slate-500 mt-2">{store.uuid ? store.nombre : 'Configura los detalles básicos para comenzar a vender.'}</p>
        </div>

        {/* SECCIÓN 1: TIPO DE TIENDA */}
        {!store.uuid && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">1</span>
              <h2 className="text-lg font-semibold text-slate-800">Elige el modelo de tu negocio</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div 
                onClick={() => setStoreType('by_order')}
                className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  store.storeType === 'by_order' 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-slate-200 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-3 rounded-lg ${store.storeType === 'by_order' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Package className="w-6 h-6" />
                  </div>
                  {store.storeType === 'by_order' && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Por Encargo</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ideal si compras productos en línea para revender en tiendas como Shein, Amazon, etc.
                </p>
              </div>
              <div 
                onClick={() => setStoreType('in_stock')}
                className={`cursor-pointer relative p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  store.storeType === 'in_stock' 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-slate-200 bg-white hover:border-indigo-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-3 rounded-lg ${store.storeType === 'in_stock' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <StoreIcon className="w-6 h-6" />
                  </div>
                  {store.storeType === 'in_stock' && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
                </div>
                <h3 className="font-bold text-slate-900 mb-1">Con Stock Local</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Ideal si tu proveedor es local o adquieres mercadería en tu localidad para venta inmediata.
                </p>
              </div>
            </div>
          </section>
        )}

        <StoreInfoCard />
        {store.storeType === 'by_order' && <LogisticsEditor />}
        <PaymentEditor />
        <ProductEditor />
      </main>

      {isProductModalOpen && <ProductModal />}

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:bg-indigo-400"
            >
               <Save className="w-5 h-5" /> {isSaving ? 'Guardando...' : 'Guardar y Publicar'}
            </button>
            <button 
              onClick={() => window.open(shareableUrl || '', '_blank')}
              disabled={isSaving || !shareableUrl}
              title={!shareableUrl ? 'Guarda la tienda para activar este botón' : 'Ver tu tienda como la ven tus clientes'}
              className="flex items-center justify-center gap-2 py-3 px-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
               <Eye className="w-5 h-5" /> Ver Tienda
            </button>
         </div>
      </div>
    </div>
  );
}

export default StoreEditor;