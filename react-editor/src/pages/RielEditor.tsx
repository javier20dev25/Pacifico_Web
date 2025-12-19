// src/pages/RielEditor.tsx
import React, { useState, type ChangeEvent } from 'react';
import useRielStore, { type RielProduct } from '@/stores/rielStore';
import { useInitialRielData } from '@/hooks/useInitialRielData';
import { RielSuccessModal } from '@/components/SuccessModal';
import RielAnalytics from '@/components/RielAnalytics';
import { Plus, Trash2, UploadCloud, Save, Eye, Share2, Loader, ServerCrash, Edit, BarChart3 } from 'lucide-react';

// --- Sub-componente Tarjeta de Producto (sin cambios) ---
const RielProductCard: React.FC<{ product: RielProduct }> = ({ product }) => {
  const { updateProduct, removeProduct, setProductImage } = useRielStore();
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateProduct(product.id, { [name]: value });
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductImage(product.id, e.target.files[0]);
    }
  };
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-4">
      <div className="flex-shrink-0 w-full sm:w-32 h-32 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">
        <label htmlFor={`file-upload-${product.id}`} className="cursor-pointer text-center">
          {product.imagePreview ? (
            <img src={product.imagePreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-slate-500">
              <UploadCloud className="mx-auto w-8 h-8" />
              <span className="text-xs font-semibold">Subir Imagen</span>
            </div>
          )}
          <input id={`file-upload-${product.id}`} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>
      <div className="flex-grow space-y-3">
        <input type="text" name="name" value={product.name} onChange={handleInputChange} placeholder="Nombre del Producto" className="w-full p-2 border border-slate-300 rounded-md text-sm" />
        <div className="flex gap-2">
          <input type="number" name="price" value={product.price} onChange={handleInputChange} placeholder="Precio" className="w-full p-2 border border-slate-300 rounded-md text-sm" />
          <select name="currency" value={product.currency} onChange={handleInputChange} className="p-2 border border-slate-300 rounded-md text-sm bg-white">
            <option value="USD">USD</option>
            <option value="NIO">NIO</option>
          </select>
        </div>
      </div>
      <div className="flex-shrink-0 flex items-center sm:items-start">
        <button onClick={() => removeProduct(product.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};


// --- Componente Principal del Editor Riel (SIMPLIFICADO) ---
const RielEditor: React.FC = () => {
  const { isLoading, isError } = useInitialRielData();
  const { storeName, setStoreName, whatsapp, setWhatsapp, products, addProduct, saveStore, shareableUrl, openSuccessModal } = useRielStore();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'analytics'>('editor');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveStore();
      openSuccessModal('¡Tienda lanzada con éxito!');
    } catch (error) {
      alert('Error al lanzar la tienda. Por favor, revisa la consola.');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!shareableUrl) return;
    const shareData = {
      title: `Visita mi tienda: ${storeName}`,
      text: `Echa un vistazo a los productos en mi nueva tienda online: ${storeName}`,
      url: shareableUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareableUrl);
        alert('Enlace de la tienda copiado al portapapeles.');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      navigator.clipboard.writeText(shareableUrl);
      alert('No se pudo compartir, pero el enlace se copió al portapapeles.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="mt-4 text-slate-600 font-medium">Cargando datos de tu tienda...</p>
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
    <div className="min-h-screen bg-slate-50 font-sans pb-28">
      <RielSuccessModal />

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">Editor de Tienda Riel</h1>
          <p className="text-slate-500 mt-2">Gestiona tus productos y revisa el rendimiento de tu tienda.</p>
        </div>

        <div className="flex justify-center border-b border-slate-200">
            <button onClick={() => setActiveTab('editor')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'editor' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                <Edit className="w-5 h-5 inline-block mr-2" /> Editor
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 font-semibold transition-colors ${activeTab === 'analytics' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}>
                <BarChart3 className="w-5 h-5 inline-block mr-2" /> Estadísticas
            </button>
        </div>

        <div>
            {activeTab === 'editor' && (
                <div className="space-y-8">
                    {/* SECCIÓN SIMPLIFICADA: EL EDITOR SIEMPRE ES VISIBLE */}
                    <section className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                        <div>
                            <label htmlFor="storeName" className="block text-sm font-semibold text-slate-700 mb-1">Nombre de tu Tienda</label>
                            <input id="storeName" type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Ej: Novedades Astaroth" className="w-full p-3 border border-slate-300 rounded-lg text-base" />
                        </div>
                        <div>
                            <label htmlFor="whatsapp" className="block text-sm font-semibold text-slate-700 mb-1">Tu Número de WhatsApp</label>
                            <input id="whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ej: 50588887777" className="w-full p-3 border border-slate-300 rounded-lg text-base" />
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-slate-800">Tus Productos ({products.length}/15)</h2>
                            <button onClick={addProduct} disabled={products.length >= 15} className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed">
                                <Plus className="w-5 h-5" /> Añadir Producto
                            </button>
                        </div>
                        <div className="space-y-4">
                            {products.length > 0 ? (
                                products.map(p => <RielProductCard key={p.id} product={p} />)
                            ) : (
                                <div className="text-center p-10 border-2 border-dashed border-slate-300 rounded-xl">
                                    <p className="text-slate-500">Aún no has añadido productos. ¡Haz clic en "Añadir Producto" para empezar!</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'analytics' && (
                <RielAnalytics />
            )}
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <button onClick={handleSave} disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:bg-indigo-400">
                {isSaving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {isSaving ? 'Lanzando...' : 'Guardar y Lanzar'}
            </button>
            <button onClick={() => shareableUrl && window.open(shareableUrl, '_blank')} disabled={!shareableUrl || isSaving} className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
                <Eye className="w-5 h-5" /> Ver Tienda
            </button>
           <button onClick={handleShare} disabled={!shareableUrl || isSaving} className="flex-1 flex items-center justify-center gap-2 py-3 px-6 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold rounded-lg transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
                <Share2 className="w-5 h-5" /> Compartir
            </button>
         </div>
      </footer>
    </div>
  );
};

export default RielEditor;