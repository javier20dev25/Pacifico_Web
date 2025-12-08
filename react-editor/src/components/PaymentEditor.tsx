import React, { useState } from 'react';
import useAppStore from '@/stores/store';
import { isValidPaypalLink, isValidStripeLink } from '@/utils/linkValidators';
import { Banknote, Wallet, Link as LinkIcon, Check, Plus, Trash2, CalendarClock } from 'lucide-react';

const PaymentEditor = () => {
  const store = useAppStore((state) => state.store);
  const setStoreDetails = useAppStore((state) => state.setStoreDetails);

  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [newInstallment, setNewInstallment] = useState({ type: 'monthly', max: 3 });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setStoreDetails({ [id]: checked });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setStoreDetails({ [id]: value });
  };

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setStoreDetails({ [id]: value });

    if (id === 'paypalLink') {
      if (value && !isValidPaypalLink(value)) {
        setPaypalError('Enlace de PayPal no válido. Usa un dominio oficial (paypal.com, paypal.me) y HTTPS.');
      } else {
        setPaypalError(null);
      }
    } else if (id === 'stripeLink') {
      if (value && !isValidStripeLink(value)) {
        setStripeError('Enlace de Stripe no válido. Usa un dominio oficial (buy.stripe.com, etc.) y HTTPS.');
      } else {
        setStripeError(null);
      }
    }
  };
  
  const handleAdvanceToggle = (key: string) => {
    const currentOptions = store.advance_options || {};
    const updatedOptions = { ...currentOptions, [key]: !currentOptions[key] };
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
    <>
      {/* SECCIÓN MÉTODOS DE PAGO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 font-bold text-sm">$</span>
          <h2 className="text-xl font-bold text-slate-900">Métodos de Cobro</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block">Pagos Directos</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => setStoreDetails({ acceptsCash: !store.acceptsCash })} className={`cursor-pointer flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${store.acceptsCash ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-emerald-200'}`}>
                  <div className={`p-2 rounded-lg ${store.acceptsCash ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Banknote className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">Efectivo</h3>
                    <p className="text-xs text-slate-500">Pago contra entrega</p>
                  </div>
                  {store.acceptsCash && <Check className="ml-auto w-5 h-5 text-emerald-600" />}
                </div>
                <div onClick={() => setStoreDetails({ acceptsTransfer: !store.acceptsTransfer })} className={`cursor-pointer flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${store.acceptsTransfer ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-200'}`}>
                  <div className={`p-2 rounded-lg ${store.acceptsTransfer ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}><Wallet className="w-6 h-6" /></div>
                  <div>
                    <h3 className="font-bold text-slate-900">Transferencia</h3>
                    <p className="text-xs text-slate-500">Depósito bancario / Otro</p>
                  </div>
                  {store.acceptsTransfer && <Check className="ml-auto w-5 h-5 text-indigo-600" />}
                </div>
              </div>
              {store.acceptsTransfer && (
                  <input type="text" id="transferDetails" placeholder="Detalles (Ej: BAC, Zelle, Wally)" value={store.transferDetails || ''} onChange={handleInputChange} className="mt-3 w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              )}
            </div>
            <div className="pt-4 border-t border-slate-100">
              <label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 block flex items-center gap-2"><LinkIcon className="w-4 h-4" /> Pasarelas de Pago (Opcional)</label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium group-focus-within:text-blue-600">PayPal</span>
                  <input id="paypalLink" type="text" placeholder="paypal.me/usuario" value={store.paypalLink || ''} onChange={handleLinkChange} className={`w-full pl-20 pr-4 py-3 rounded-lg border ${paypalError ? 'border-red-500' : 'border-slate-300'} focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all`} />
                  {paypalError && <p className="text-xs text-red-600 mt-1 px-1">{paypalError}</p>}
                </div>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium group-focus-within:text-indigo-600">Stripe</span>
                  <input id="stripeLink" type="text" placeholder="buy.stripe.com/..." value={store.stripeLink || ''} onChange={handleLinkChange} className={`w-full pl-16 pr-4 py-3 rounded-lg border ${stripeError ? 'border-red-500' : 'border-slate-300'} focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`} />
                  {stripeError && <p className="text-xs text-red-600 mt-1 px-1">{stripeError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CONDICIONES DE PAGO */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold text-sm">%</span>
          <h2 className="text-xl font-bold text-slate-900">Condiciones de Venta</h2>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
          <div className="p-5 flex items-start gap-3">
            <div className="mt-1"><input id="accepts_full_payment" type="checkbox" checked={store.accepts_full_payment || false} onChange={handleCheckboxChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" /></div>
            <div>
              <h3 className="font-semibold text-slate-900">Aceptar pago completo al ordenar</h3>
              <p className="text-sm text-slate-500">El cliente paga el 100% del valor al hacer el pedido.</p>
            </div>
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <input id="accepts_advance_payment" type="checkbox" checked={store.accepts_advance_payment || false} onChange={handleCheckboxChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                <div>
                  <h3 className="font-semibold text-slate-900">Aceptar anticipo para reservar</h3>
                  <p className="text-sm text-slate-500">Permite pagar una fracción para asegurar el pedido.</p>
                </div>
              </div>
            </div>
            {store.accepts_advance_payment && (
              <div className="ml-8 pl-4 border-l-2 border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Porcentajes aceptados</label>
                <div className="flex flex-wrap gap-2">
                  {['10', '25', '50'].map((pct) => (
                    <button key={pct} onClick={() => handleAdvanceToggle(pct)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${store.advance_options?.[pct] ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'}`}>
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <input id="accepts_installments" type="checkbox" checked={store.accepts_installments || false} onChange={handleCheckboxChange} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300" />
                <div>
                  <h3 className="font-semibold text-slate-900">Ofrecer Cuotas / Crédito</h3>
                  <p className="text-sm text-slate-500">Flexibilidad de pago para tus clientes.</p>
                </div>
              </div>
            </div>
            {store.accepts_installments && (
              <div className="ml-8 bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="mb-4 space-y-2">
                  {(store.installment_options || []).map((option, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2">
                         <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded"><CalendarClock className="w-4 h-4" /></div>
                         <span className="font-medium text-slate-700">Hasta <span className="font-bold">{option.max} cuotas</span> {option.type}s</span>
                      </div>
                      <button onClick={() => handleRemoveInstallmentOption(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Frecuencia</label>
                    <select value={newInstallment.type} onChange={(e) => setNewInstallment(p => ({...p, type: e.target.value}))} className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-sm outline-none focus:border-indigo-500"><option value="meses">Mensual</option><option value="quincenas">Quincenal</option><option value="semanas">Semanal</option></select>
                  </div>
                  <div className="w-24">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Cantidad</label>
                    <input type="number" value={newInstallment.max} onChange={(e) => setNewInstallment(p => ({...p, max: parseInt(e.target.value) || 0}))} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none focus:border-indigo-500" />
                  </div>
                  <button onClick={handleAddInstallmentOption} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
export default PaymentEditor;