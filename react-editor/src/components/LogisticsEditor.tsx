import React from 'react';
import useAppStore, { ExtraCost } from '@/stores/store';
import { Plane, Ship, Truck, MapPin, Anchor, ChevronDown, Percent, FilePlus } from 'lucide-react';

const LogisticsEditor = () => {
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setStoreDetails({ [id]: finalValue });
  };

  const handleExtraCostChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    
    setStoreDetails({
      extraCost: {
        ...store.extraCost,
        [id]: finalValue,
      },
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const numericValue = parseFloat(value);
    setStoreDetails({ [id]: isNaN(numericValue) ? 0 : numericValue });
  };

  const handleExtraCostBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const numericValue = parseFloat(value);
    setStoreDetails({
      extraCost: {
        ...store.extraCost,
        [id]: isNaN(numericValue) ? 0 : numericValue,
      },
    });
  };


  return (
    <>
      {/* SECCIÓN 3: LOGÍSTICA INTERNACIONAL */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
              {store.uuid ? '2' : '3'}
            </span>
            <h2 className="text-lg font-semibold text-slate-800">Logística Internacional</h2>
          </div>
          
          <label className="flex items-center cursor-pointer gap-2">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">Habilitar</span>
            <div className="relative">
              <input type="checkbox" id="isLogisticsDual" className="sr-only" checked={store.isLogisticsDual || false} onChange={handleInputChange} />
              <div className={`block w-12 h-7 rounded-full transition-colors ${store.isLogisticsDual ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${store.isLogisticsDual ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>

        <div className={`transition-all duration-300 ${store.isLogisticsDual ? 'opacity-100 max-h-[800px]' : 'opacity-50 max-h-0 overflow-hidden'}`}>
           <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8 relative">
             <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-px bg-slate-100"></div>
             {/* Aéreo */}
             <div className="space-y-4">
               <div className="flex items-center gap-2 mb-4 text-sky-600">
                 <Plane className="w-5 h-5" />
                 <h3 className="font-bold text-slate-800">Envío Aéreo</h3>
               </div>
               <div>
                  <label htmlFor="airRate" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tarifa por Libra ($)</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input id="airRate" type="text" inputMode="decimal" value={store.airRate} onChange={handleInputChange} onBlur={handleBlur} className="w-full pl-7 pr-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label htmlFor="airMinDays" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Días Mín.</label>
                      <input id="airMinDays" type="text" inputMode="decimal" value={store.airMinDays} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none" />
                  </div>
                  <div>
                      <label htmlFor="airMaxDays" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Días Máx.</label>
                      <input id="airMaxDays" type="text" inputMode="decimal" value={store.airMaxDays} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none" />
                  </div>
               </div>
             </div>
             {/* Marítimo */}
             <div className="space-y-4">
               <div className="flex items-center gap-2 mb-4 text-teal-600">
                 <Anchor className="w-5 h-5" />
                 <h3 className="font-bold text-slate-800">Envío Marítimo</h3>
               </div>
               <div>
                  <label htmlFor="seaRate" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tarifa por Libra ($)</label>
                  <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input id="seaRate" type="text" inputMode="decimal" value={store.seaRate} onChange={handleInputChange} onBlur={handleBlur} className="w-full pl-7 pr-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <div>
                      <label htmlFor="seaMinDays" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Días Mín.</label>
                      <input id="seaMinDays" type="text" inputMode="decimal" value={store.seaMinDays} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none" />
                  </div>
                  <div>
                      <label htmlFor="seaMaxDays" className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Días Máx.</label>
                      <input id="seaMaxDays" type="text" inputMode="decimal" value={store.seaMaxDays} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-3 py-2 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none" />
                  </div>
               </div>
             </div>
           </div>
        </div>
      </section>

      {/* SECCIÓN DE COSTO EXTRA */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
              +
            </span>
            <h2 className="text-lg font-semibold text-slate-800">Cargos Adicionales</h2>
          </div>
          <label className="flex items-center cursor-pointer gap-2">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">Habilitar</span>
            <div className="relative">
              <input type="checkbox" id="enabled" className="sr-only" checked={store.extraCost?.enabled || false} onChange={handleExtraCostChange} />
              <div className={`block w-12 h-7 rounded-full transition-colors ${store.extraCost?.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${store.extraCost?.enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
            </div>
          </label>
        </div>
        {store.extraCost?.enabled && (
          <div className="p-6 md:p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <FilePlus className="w-3.5 h-3.5" /> Valor del Cargo
                </label>
                <input id="value" type="text" inputMode="decimal" value={store.extraCost.value} onChange={handleExtraCostChange} onBlur={handleExtraCostBlur} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Cómo se aplica
                </label>
                <div className="relative">
                  <select id="type" value={store.extraCost.type || 'fixed_total'} onChange={handleExtraCostChange} className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white">
                    <option value="fixed_total">Monto Fijo (al total del pedido)</option>
                    <option value="fixed_per_product">Monto Fijo (por cada tipo de producto)</option>
                    <option value="percentage_total">Porcentaje (del total del pedido)</option>
                    <option value="percentage_per_product">Porcentaje (por cada unidad de producto)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripción del Cargo (para el cliente)
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Ej: Manejo en almacén de Miami previo al envío final"
                value={store.extraCost.description || ''}
                onChange={handleExtraCostChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-1.5">Esta nota aparecerá en el resumen del carrito de compras de tu cliente.</p>
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 4: DELIVERY LOCAL */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold">
            {store.uuid ? '3' : '4'}
          </span>
          <h2 className="text-lg font-semibold text-slate-800">Entrega Local (Delivery)</h2>
        </div>
        <div className="p-6 md:p-8 space-y-6">
           <div className="grid md:grid-cols-2 gap-6">
              <div>
                 <label htmlFor="delivery_type" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Tipo de Cobro
                 </label>
                 <div className="relative">
                  <select id="delivery_type" value={store.delivery_type || 'no'} onChange={handleInputChange} className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none bg-white">
                    <option value="no">No ofrezco delivery</option>
                    <option value="fixed">Costo Fijo</option>
                    <option value="range">Rango de Costo</option>
                    <option value="included">Incluído en el precio</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              {store.delivery_type === 'fixed' && (
                <div>
                   <label htmlFor="delivery_fixed_cost" className="block text-sm font-medium text-slate-700 mb-1.5">Costo Fijo de Delivery ($)</label>
                   <input id="delivery_fixed_cost" type="text" inputMode="decimal" value={store.delivery_fixed_cost} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                </div>
              )}
              {store.delivery_type === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="delivery_range_start" className="block text-sm font-medium text-slate-700 mb-1.5">Costo Mín. ($)</label>
                    <input id="delivery_range_start" type="text" inputMode="decimal" value={store.delivery_range_start} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"/>
                  </div>
                  <div>
                    <label htmlFor="delivery_range_end" className="block text-sm font-medium text-slate-700 mb-1.5">Costo Máx. ($)</label>
                    <input id="delivery_range_end" type="text" inputMode="decimal" value={store.delivery_range_end} onChange={handleInputChange} onBlur={handleBlur} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"/>
                  </div>
                </div>
              )}
           </div>
           <div>
              <label htmlFor="delivery_note" className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Nota Aclaratoria del Delivery
              </label>
              <input 
                id="delivery_note"
                type="text" 
                placeholder="Ej: El costo puede variar según la zona o accesibilidad" 
                value={store.delivery_note || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
           </div>
        </div>
      </section>
    </>
  );
};
export default LogisticsEditor;