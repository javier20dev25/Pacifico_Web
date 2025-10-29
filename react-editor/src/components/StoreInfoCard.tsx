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
    <div className="p-4 border rounded-md bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Información Principal</h2>
      </div>

      <div className="space-y-4">
        <label htmlFor="logo-upload" className="block text-sm font-medium text-gray-500 text-center">Logo de la Tienda</label>
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed mx-auto overflow-hidden cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
          {store.logoUrl ? (
            <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover"/>
          ) : (
            <span className="text-gray-400 text-sm">Subir</span>
          )}
        </div>
        <input type="file" id="logo-upload" accept="image/*" className="hidden" onChange={handleLogoChange} />

        <label htmlFor="nombre" className="block text-sm font-medium text-gray-500">Nombre de la tienda</label>
        <input id="nombre" type="text" className="input w-full p-2 border rounded" 
               value={store.nombre || ''} onChange={handleInputChange} />

        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-500">Descripción</label>
        <textarea id="descripcion" className="input w-full p-2 border rounded resize-y"
                  value={store.descripcion || ''} onChange={handleInputChange}></textarea>

        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-500">WhatsApp</label>
        <input id="whatsapp" type="tel" className="input w-full p-2 border rounded"
               value={store.whatsapp || ''} onChange={handleInputChange} />
        
        <label htmlFor="youtubeLink" className="block text-sm font-medium text-gray-500">Video de YouTube</label>
        <input id="youtubeLink" type="url" className="input w-full p-2 border rounded"
               value={store.youtubeLink || ''} onChange={handleInputChange} />
        <p className="text-xs text-gray-500 mt-1">Es opcional, pero se recomienda que tu tienda tenga un video publicitario como del local, servicios, etc.</p>
        
        <div className="pt-4 border-t">
            <label htmlFor="currency" className="block text-sm font-medium text-gray-500">Moneda</label>
            <select id="currency" className="input w-full p-2 border rounded" 
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