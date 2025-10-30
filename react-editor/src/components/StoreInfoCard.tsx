import useAppStore from '../stores/store';

const StoreInfoCard = () => {
  // Patrón correcto de Zustand: seleccionar estado y acciones por separado
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);

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
      // Guardar tanto el archivo para la subida como la URL para la previsualización
      setStoreDetails({ logoFile: file, logoUrl });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 rounded-xl bg-neumoBg shadow-neumo mb-8"> {/* Neumorphic card style */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Información Principal</h2>
      </div>

      <div className="space-y-6"> {/* Increased space-y for better visual separation */}
        <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-700 text-center">Logo de la Tienda</label>
        <div className="w-28 h-28 rounded-full bg-neumoBg flex items-center justify-center border-2 border-dashed border-neumoDark mx-auto overflow-hidden cursor-pointer shadow-neumo-sm" onClick={() => document.getElementById('logo-upload')?.click()}>
          {store.logoUrl ? (
            <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full"/>
          ) : (
            <span className="text-gray-500 text-sm">Subir</span>
          )}
        </div>
        <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoChange} />

        <div>
          <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">Nombre de la tienda</label>
          <input id="nombre" type="text" className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"
                 value={store.nombre || ''} onChange={handleInputChange} />
        </div>

        <div>
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
          <textarea id="descripcion" className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark resize-y focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"
                    value={store.descripcion || ''} onChange={handleInputChange}></textarea>
        </div>

        <div>
          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
          <input id="whatsapp" type="tel" className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"
                 value={store.whatsapp || ''} onChange={handleInputChange} />
        </div>
        
        <div>
          <label htmlFor="youtubeLink" className="block text-sm font-medium text-gray-700 mb-2">Video de YouTube</label>
          <input id="youtubeLink" type="url" className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"
                 value={store.youtubeLink || ''} onChange={handleInputChange} />
          <p className="text-xs text-gray-600 mt-2">Es opcional, pero se recomienda que tu tienda tenga un video publicitario como del local, servicios, etc.</p>
        </div>
        
        <div className="pt-6 border-t border-gray-300">
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
            <select id="currency" className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"
                    value={store.currency || 'USD'} onChange={handleInputChange}>
                <option value="USD">Dólares Americanos ($)</option>
                <option value="NIO">Córdobas Nicaragüenses (C$)</option>
            </select>
        </div>
      </div>
    </div>
  );
};

export default StoreInfoCard;