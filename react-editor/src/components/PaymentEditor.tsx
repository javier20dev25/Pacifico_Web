import { useState } from 'react';
import useAppStore, { availablePaymentMethods } from '../stores/store'; // Corregir la ruta de importación

const PaymentEditor = () => {
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);

  // Estado local para el formulario de añadir nueva opción de cuota
  const [newInstallment, setNewInstallment] = useState({ type: 'monthly', max: 3 });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setStoreDetails({ [id]: checked });
  };

  const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.dataset.paymentKey;
    if (!key) return;
    const updatedMethods = { ...store.payment_methods, [key]: e.target.checked };
    setStoreDetails({ payment_methods: updatedMethods });
  };

  const handleAdvanceOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.dataset.advanceKey;
    if (!key) return;
    const updatedOptions = { ...store.advance_options, [key]: e.target.checked };
    setStoreDetails({ advance_options: updatedOptions });
  };

  const handleAddInstallmentOption = () => {
    if (newInstallment.max > 0) {
      const updatedOptions = [...(store.installment_options || []), newInstallment];
      setStoreDetails({ installment_options: updatedOptions });
    }
  };

  const handleRemoveInstallmentOption = (index: number) => {
    const updatedOptions = [...(store.installment_options || [])];
    updatedOptions.splice(index, 1);
    setStoreDetails({ installment_options: updatedOptions });
  };

  return (
    <div className="mt-8 p-6 rounded-xl bg-neumoBg shadow-neumo mb-8"> {/* Neumorphic card style */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Métodos y Condiciones de Pago</h2>

      {/* Métodos de Pago */}
      <div className="mb-6 p-6 rounded-xl bg-neumoBg shadow-neumoInset"> {/* Neumorphic inset style */}
        <h3 className="font-bold text-xl text-gray-800 mb-4">Métodos de Pago Aceptados</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4"> 
          {Object.entries(availablePaymentMethods).map(([key, name]) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer text-gray-700">
              <input type="checkbox" data-payment-key={key} checked={store.payment_methods?.[key] || false} onChange={handlePaymentMethodChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/>
              <span>{name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Condiciones de Pago */}
      <div className="space-y-6"> {/* Increased space-y for better visual separation */}
        <div className="p-6 rounded-xl bg-neumoBg shadow-neumoInset"> {/* Neumorphic inset style */}
          <label className="flex items-center gap-4 cursor-pointer text-gray-700">
            <input type="checkbox" id="accepts_full_payment" checked={store.accepts_full_payment || false} onChange={handleCheckboxChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/>
            <span className="font-medium">Aceptar pago completo al ordenar</span>
          </label>
        </div>

        <div className="p-6 rounded-xl bg-neumoBg shadow-neumoInset"> {/* Neumorphic inset style */}
          <label className="flex items-center gap-4 cursor-pointer text-gray-700">
            <input type="checkbox" id="accepts_advance_payment" checked={store.accepts_advance_payment || false} onChange={handleCheckboxChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/>
            <div>
              <span className="font-medium">Aceptar anticipo para ordenar</span>
            </div>
          </label>
          {store.accepts_advance_payment && (
            <div className="pl-8 mt-4 space-y-2">
              <h4 className="text-lg font-bold text-gray-800 mb-3">Opciones de Anticipo (%)</h4>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" data-advance-key="50" checked={store.advance_options?.['50'] || false} onChange={handleAdvanceOptionChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/> 50%</label>
                <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" data-advance-key="25" checked={store.advance_options?.['25'] || false} onChange={handleAdvanceOptionChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/> 25%</label>
                <label className="flex items-center gap-2 text-gray-700"><input type="checkbox" data-advance-key="10" checked={store.advance_options?.['10'] || false} onChange={handleAdvanceOptionChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/> 10%</label>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 rounded-xl bg-neumoBg shadow-neumoInset"> {/* Neumorphic inset style */}
          <label className="flex items-center gap-4 cursor-pointer text-gray-700">
            <input type="checkbox" id="accepts_installments" checked={store.accepts_installments || false} onChange={handleCheckboxChange} className="h-5 w-5 rounded-md text-primary-DEFAULT focus:ring-primary-light border-neumoDark bg-neumoBg shadow-neumo-sm"/>
            <div>
              <span className="font-medium">Aceptar cuotas / crédito</span>
              <p className="text-xs text-gray-600">Ideal si eres flexible con el pago, pero es opcional.</p>
            </div>
          </label>
          {store.accepts_installments && (
            <div className="pl-8 mt-4 space-y-4">
              {/* Lista de opciones de cuotas existentes */}
              <div className="space-y-2">
                {store.installment_options?.map((option, index) => (
                  <div key={index} className="flex items-center justify-between bg-neumoBg shadow-neumo-sm p-3 rounded-lg border border-neumoDark"> {/* Neumorphic item style */}
                    <span className="text-gray-700">Hasta <strong>{option.max}</strong> cuotas de frecuencia <strong>{option.type}</strong></span>
                    <button onClick={() => handleRemoveInstallmentOption(index)} className="btn text-red-500 hover:text-red-700 px-3 py-1 rounded-full shadow-neumo-sm hover:shadow-neumo-active active:shadow-neumo-inset">Quitar</button>
                  </div>
                ))}
              </div>
              {/* Formulario para añadir nueva opción */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-gray-300">
                <select value={newInstallment.type} onChange={(e) => setNewInstallment(p => ({...p, type: e.target.value}))} className="w-full sm:w-auto p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800">
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                </select>
                <input type="number" placeholder="Máx. cuotas" value={newInstallment.max} onChange={(e) => setNewInstallment(p => ({...p, max: parseInt(e.target.value) || 0}))} className="w-full sm:w-auto p-3 rounded-lg bg-neumoBg shadow-neumoInset border border-neumoDark focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-800"/>
                <button onClick={handleAddInstallmentOption} className="btn px-4 py-2 bg-green-500 text-white rounded-full shadow-neumo hover:shadow-neumo-active active:shadow-neumo-inset">Añadir</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentEditor;