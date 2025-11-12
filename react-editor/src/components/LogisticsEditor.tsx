import useAppStore from '@/stores/store';const LogisticsEditor = () => {
  // Patrón correcto de Zustand: seleccionar estado y acciones por separado
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value);
    setStoreDetails({ [id]: finalValue });
  };  return (
    <div className="mt-8 p-4 border rounded-md bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Logística y Envíos</h2>
      </div>      <div className="space-y-4">
        <div className="flex items-center gap-4">
            <input type="checkbox" id="isLogisticsDual" checked={store.isLogisticsDual || false} onChange={handleInputChange} className="h-5 w-5 rounded"/>
            <label htmlFor="isLogisticsDual" className="font-medium text-gray-600">Ofrecer envío Aéreo y Marítimo</label>
        </div>        {store.isLogisticsDual && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-white">
                {/* Aéreo */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Envío Aéreo</h3>
                    <label htmlFor="airRate">Tarifa por Lb ($)</label>
                    <input type="number" id="airRate" value={store.airRate || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
                    <label htmlFor="airMinDays" className="mt-2">Días Mín. Entrega</label>
                    <input type="number" id="airMinDays" value={store.airMinDays || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
                    <label htmlFor="airMaxDays" className="mt-2">Días Máx. Entrega</label>
                    <input type="number" id="airMaxDays" value={store.airMaxDays || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
                </div>
                {/* Marítimo */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Envío Marítimo</h3>
                    <label htmlFor="seaRate">Tarifa por Lb ($)</label>
                    <input type="number" id="seaRate" value={store.seaRate || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
                    <label htmlFor="seaMinDays" className="mt-2">Días Mín. Entrega</label>
                    <input type="number" id="seaMinDays" value={store.seaMinDays || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
                    <label htmlFor="seaMaxDays" className="mt-2">Días Máx. Entrega</label>
                    <input type="number" id="seaMaxDays" value={store.seaMaxDays || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
                </div>
            </div>
        )}        {/* Sección de Delivery */}
        <div className="pt-4 border-t mt-6">
          <h3 className="font-semibold text-lg mb-2">Entrega a Domicilio (Delivery)</h3>
          <label htmlFor="delivery_type">Tipo de Entrega</label>
          <select id="delivery_type" value={store.delivery_type || 'no'} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1">
            <option value="no">No ofrezco delivery</option>
            <option value="fixed">Costo Fijo</option>
            <option value="range">Rango de Costo</option>
            <option value="included">Incluído en el precio</option>
          </select>          {store.delivery_type === 'fixed' && (
            <div className="mt-4">
              <label htmlFor="delivery_fixed_cost">Costo Fijo de Delivery ($)</label>
              <input type="number" id="delivery_fixed_cost" value={store.delivery_fixed_cost || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
            </div>
          )}          {store.delivery_type === 'range' && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label htmlFor="delivery_range_start">Costo Mínimo ($)</label>
                <input type="number" id="delivery_range_start" value={store.delivery_range_start || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
              </div>
              <div>
                <label htmlFor="delivery_range_end">Costo Máximo ($)</label>
                <input type="number" id="delivery_range_end" value={store.delivery_range_end || 0} onChange={handleInputChange} className="input w-full p-2 border rounded mt-1"/>
              </div>
            </div>
          )}          <div className="mt-4">
            <label htmlFor="delivery_note">Nota Aclaratoria del Delivery</label>
            <input type="text" id="delivery_note" value={store.delivery_note || ''} onChange={handleInputChange} placeholder="Ej: El costo puede variar según la zona" className="input w-full p-2 border rounded mt-1"/>
          </div>
        </div>      </div>
    </div>
  );
};export default LogisticsEditor;