import useAppStore from '../stores/store';

const LogisticsEditor = () => {
  // Patrón correcto de Zustand: seleccionar estado y acciones por separado
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value);
    setStoreDetails({ [id]: finalValue });
  };

  return (
    <div className="mt-8 p-6 rounded-xl bg-neumoBg shadow-neumo mb-8"> {/* Neumorphic card style */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Logística y Envíos</h2>
      </div>

      <div className="space-y-6"> {/* Increased space-y for better visual separation */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-neumoBg shadow-neumoInset"> {/* Neumorphic inset style for checkbox */}
            <input type="checkbox" id="isLogisticsDual" checked={store.isLogisticsDual || false} onChange={handleInputChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/>
            <label htmlFor="isLogisticsDual" className="font-medium text-gray-700">Ofrecer envío Aéreo y Marítimo</label>
        </div>

        {store.isLogisticsDual && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-neumoBg shadow-neumo"> {/* Neumorphic card style */}
                {/* Aéreo */}
                <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-4">Envío Aéreo</h3>
                    <label htmlFor="airRate" className="block text-sm font-medium text-gray-700 mb-2">Tarifa por Lb ($)</label>
                    <input type="number" id="airRate" value={store.airRate || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                    <label htmlFor="airMinDays" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Días Mín. Entrega</label>
                    <input type="number" id="airMinDays" value={store.airMinDays || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                    <label htmlFor="airMaxDays" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Días Máx. Entrega</label>
                    <input type="number" id="airMaxDays" value={store.airMaxDays || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                </div>
                {/* Marítimo */}
                <div>
                    <h3 className="font-bold text-xl text-gray-800 mb-4">Envío Marítimo</h3>
                    <label htmlFor="seaRate" className="block text-sm font-medium text-gray-700 mb-2">Tarifa por Lb ($)</label>
                    <input type="number" id="seaRate" value={store.seaRate || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                    <label htmlFor="seaMinDays" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Días Mín. Entrega</label>
                    <input type="number" id="seaMinDays" value={store.seaMinDays || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                    <label htmlFor="seaMaxDays" className="block text-sm font-medium text-gray-700 mt-4 mb-2">Días Máx. Entrega</label>
                    <input type="number" id="seaMaxDays" value={store.seaMaxDays || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                </div>
            </div>
        )}

        {/* Sección de Delivery */}
        <div className="pt-6 border-t border-gray-300">
          <h3 className="font-bold text-xl text-gray-800 mb-4">Entrega a Domicilio (Delivery)</h3>
          <label htmlFor="delivery_type" className="block text-sm font-medium text-gray-700 mb-2">Tipo de Entrega</label>
          <select id="delivery_type" value={store.delivery_type || 'no'} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800">
            <option value="no">No ofrezco delivery</option>
            <option value="fixed">Costo Fijo</option>
            <option value="range">Rango de Costo</option>
            <option value="included">Incluído en el precio</option>
          </select>

          {store.delivery_type === 'fixed' && (
            <div className="mt-6">
              <label htmlFor="delivery_fixed_cost" className="block text-sm font-medium text-gray-700 mb-2">Costo Fijo de Delivery ($)</label>
              <input type="number" id="delivery_fixed_cost" value={store.delivery_fixed_cost || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
            </div>
          )}

          {store.delivery_type === 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label htmlFor="delivery_range_start" className="block text-sm font-medium text-gray-700 mb-2">Costo Mínimo ($)</label>
                <input type="number" id="delivery_range_start" value={store.delivery_range_start || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
              </div>
              <div>
                <label htmlFor="delivery_range_end" className="block text-sm font-medium text-gray-700 mb-2">Costo Máximo ($)</label>
                <input type="number" id="delivery_range_end" value={store.delivery_range_end || 0} onChange={handleInputChange} className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
              </div>
            </div>
          )}

          <div className="mt-6">
            <label htmlFor="delivery_note" className="block text-sm font-medium text-gray-700 mb-2">Nota Aclaratoria del Delivery</label>
            <input type="text" id="delivery_note" value={store.delivery_note || ''} onChange={handleInputChange} placeholder="Ej: El costo puede variar según la zona" className="w-full p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LogisticsEditor;