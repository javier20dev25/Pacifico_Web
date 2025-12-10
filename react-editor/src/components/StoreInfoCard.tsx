import React from 'react';
import useAppStore from '../stores/store';
import { getPublicImageUrl } from '../lib/supabase-utils';
import { Upload, Video, Phone, DollarSign, Info, ChevronDown } from 'lucide-react';

const StoreInfoCard = () => {
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);
  const setLogoFile = useAppStore((state) => state.setLogoFile);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setStoreDetails({ [id]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      setLogoFile(file);
      setStoreDetails({ logoUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
          {store.uuid ? '1' : '2'}
        </span>
        <h2 className="text-lg font-semibold text-slate-800">Identidad de la Tienda</h2>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        <div className="flex flex-col items-center justify-center mb-6">
           <span className="text-sm font-medium text-slate-700 mb-3">Logo de la Tienda</span>
           <label className="group relative w-32 h-32 rounded-full cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
              {store.logoUrl ? (
                <img src={getPublicImageUrl(store.logoUrl)} alt="Logo preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1" />
                  <span className="text-xs text-slate-400 group-hover:text-indigo-500">Subir imagen</span>
                </>
              )}
              <input type="file" id="logo-upload" className="hidden" onChange={handleLogoChange} accept="image/*" />
           </label>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la tienda</label>
            <input 
              id="nombre"
              type="text" 
              placeholder="Ej: Moda y Estilo Nica" 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              value={store.nombre || ''}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
            <textarea 
              id="descripcion"
              rows={3}
              placeholder="¿Qué vendes? ¿Cuál es tu especialidad?" 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 resize-none"
              value={store.descripcion || ''}
              onChange={handleInputChange}
            ></textarea>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" /> WhatsApp
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">+505</span>
                <input 
                  id="whatsapp"
                  type="tel" 
                  placeholder="8888-8888" 
                  className="w-full pl-14 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={store.whatsapp || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Moneda Principal
              </label>
              <div className="relative">
                <select 
                  id="currency"
                  className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white"
                  value={store.currency || 'USD'}
                  onChange={handleInputChange}
                >
                  <option value="NIO">Córdobas Nicaragüenses (C$)</option>
                  <option value="USD">Dólares Americanos ($)</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="video_url" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              <Video className="w-3.5 h-3.5" /> Video Principal <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <input 
              id="video_url"
              type="url" 
              placeholder="Enlace de YouTube, Facebook, Instagram o TikTok" 
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              value={store.video_url || ''}
              onChange={handleInputChange}
            />
            <div className="mt-3 bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex gap-2 items-start">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Recomendación:</strong> Usa videos subidos por ti. Asegúrate de tener activada la opción "Permitir inserción" en la configuración del video para que se reproduzca correctamente en tu tienda.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
export default StoreInfoCard;