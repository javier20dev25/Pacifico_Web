import { useState } from 'react';
import useAppStore, { availablePaymentMethods } from '@/stores/store';

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
    <div className="mt-8 p-4 border rounded-md bg-gray-50">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Métodos y Condiciones de Pago</h2>

      {/* Métodos de Pago */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Métodos de Pago Aceptados</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-white">
          {Object.entries(availablePaymentMethods).map(([key, name]) => (
            <label key={key} className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" data-payment-key={key} checked={store.payment_methods?.[key] || false} onChange={handlePaymentMethodChange} className="h-4 w-4 rounded"/>
              <span>{name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Condiciones de Pago */}
      <div className="space-y-4">
        <label className="flex items-center gap-4 cursor-pointer">
          <input type="checkbox" id="accepts_full_payment" checked={store.accepts_full_payment || false} onChange={handleCheckboxChange} className="h-5 w-5 rounded"/>
          <span className="font-medium text-gray-600">Aceptar pago completo al ordenar</span>
        </label>

        <div className="p-4 border rounded-lg bg-white">
          <label className="flex items-center gap-4 cursor-pointer">
            <input type="checkbox" id="accepts_advance_payment" checked={store.accepts_advance_payment || false} onChange={handleCheckboxChange} className="h-5 w-5 rounded"/>
            <span className="font-medium text-gray-600">Aceptar anticipo para ordenar</span>
          </label>
          {store.accepts_advance_payment && (
            <div className="pl-8 mt-4 space-y-2">
              <h4 className="text-md font-semibold">Opciones de Anticipo (%)</h4>
              <div className="flex gap-6">
                <label className="flex items-center gap-2"><input type="checkbox" data-advance-key="50" checked={store.advance_options?.[50] || false} onChange={handleAdvanceOptionChange} className="h-4 w-4 rounded"/> 50%</label>
                <label className="flex items-center gap-2"><input type="checkbox" data-advance-key="25" checked={store.advance_options?.[25] || false} onChange={handleAdvanceOptionChange} className="h-4 w-4 rounded"/> 25%</label>
                <label className="flex items-center gap-2"><input type="checkbox" data-advance-key="10" checked={store.advance_options?.[10] || false} onChange={handleAdvanceOptionChange} className="h-4 w-4 rounded"/> 10%</label>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border rounded-lg bg-white">
          <label className="flex items-center gap-4 cursor-pointer">
            <input type="checkbox" id="accepts_installments" checked={store.accepts_installments || false} onChange={handleCheckboxChange} className="h-5 w-5 rounded"/>
            <div>
              <span className="font-medium text-gray-600">Aceptar cuotas / crédito</span>
              <p className="text-xs text-gray-500">Ideal si eres flexible con el pago, pero es opcional.</p>
            </div>
          </label>
          {store.accepts_installments && (
            <div className="pl-8 mt-4 space-y-4">
              {/* Lista de opciones de cuotas existentes */}
              <div className="space-y-2">
                {store.installment_options?.map((option, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                    <span>Hasta <strong>{option.max}</strong> cuotas de frecuencia <strong>{option.type}</strong></span>
                    <button onClick={() => handleRemoveInstallmentOption(index)} className="text-red-500 hover:text-red-700">Quitar</button>
                  </div>
                ))}
              </div>
              {/* Formulario para añadir nueva opción */}
              <div className="flex items-center gap-2 pt-4 border-t">
                <select value={newInstallment.type} onChange={(e) => setNewInstallment(p => ({...p, type: e.target.value}))} className="input p-2 border rounded">
                  <option value="monthly">Mensual</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="weekly">Semanal</option>
                </select>
                <input type="number" placeholder="Máx. cuotas" value={newInstallment.max} onChange={(e) => setNewInstallment(p => ({...p, max: parseInt(e.target.value) || 0}))} className="input w-full p-2 border rounded"/>
                <button onClick={handleAddInstallmentOption} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Añadir</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentEditor;