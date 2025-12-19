import { useState } from 'react';
import useStore from '@/stores/store';
import StoreInfoCard from '@/components/StoreInfoCard';
import ProductEditor from '@/components/ProductEditor';
import LogisticsEditor from '@/components/LogisticsEditor';
import PaymentEditor from '@/components/PaymentEditor';
import ProductModal from '@/components/ProductModal';
import { MainSuccessModal } from '@/components/SuccessModal'; // <-- AÑADIDO
import { useInitialData } from '@/hooks/useInitialData';
import { Package, Store as StoreIcon, CheckCircle2, Save, Eye, Loader, ServerCrash } from 'lucide-react';
import apiClient from '@/api/axiosConfig';
import { AxiosError } from 'axios';

function StoreEditor() {
  const store = useStore((state) => state.store);
  const shareableUrl = useStore((state) => state.store.shareableUrl);
  const setStoreType = useStore((state) => state.setStoreType);
  const isProductModalOpen = useStore((state) => state.isProductModalOpen);
  const openSuccessModal = useStore((state) => state.openSuccessModal);
  const { isLoading, isError } = useInitialData();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (launch = false) => {
    setIsSaving(true);

    try {
      const storeData = useStore.getState().getStoreDataForAPI();
      const payload = { storeData, launch };
      
      const response = await apiClient.put('/user/store-data', payload);

      if (response.data && response.data.shareableUrl) {
        useStore.getState().setShareableUrl(response.data.shareableUrl);
      }
      
      openSuccessModal(response.data.message || '¡Tienda guardada con éxito!');

    } catch (err: unknown) {
      const error = err as AxiosError<{ message?: string }>;
      alert('Error al guardar: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-slate-600 font-medium">Cargando tu editor...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="text-center">
            <ServerCrash className="w-16 h-16 mx-auto text-red-500" />
            <h1 className="text-2xl font-bold text-slate-800 mt-4">Error al Cargar</h1>
            <p className="text-slate-600 mt-2">No pudimos cargar los datos de tu tienda. Por favor, refresca la página para intentarlo de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <MainSuccessModal />
      {isSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50 backdrop-blur-sm">
          <p className="text-white text-xl mb-2">Guardando...</p>
          <div className="w-3/4 max-w-lg bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: '50%' }} // Placeholder for progress
            ></div>
          </div>
           <p className="text-white text-2xl mt-2 font-bold">50%</p>
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