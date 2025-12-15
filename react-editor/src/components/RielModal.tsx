// src/components/RielModal.tsx
import React, { useState } from 'react';
import useAppStore from '@/stores/store';
import apiClient from '@/api/axiosConfig';
import { X, Loader, MessageSquare } from 'lucide-react';
import Cookies from 'js-cookie';

const RielModal: React.FC = () => {
  const { isRielModalOpen, closeRielModal } = useAppStore();
  const [name, setName] = useState(''); // <-- AÑADIDO
  const [whatsappNumber, setWhatsappNumber] = useState('+505');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const normalizedNumber = whatsappNumber.replace(/\D/g, '');
      const response = await apiClient.post('/riel/preregister', {
        name: name, // <-- AÑADIDO
        whatsapp_number: normalizedNumber,
      });

      if (response.status === 201 && response.data.identifier) {
        Cookies.set('riel_identifier', response.data.identifier, { expires: 30 });
        
        const ownerNumber = '50588378547';
        const message = encodeURIComponent(`Hola, mi nombre es ${name}. Quiero una cuenta Riel gratuita para crear mi tienda online.`);
        window.location.href = `https://wa.me/${ownerNumber}?text=${message}`;
        
        closeRielModal();
      } else {
        throw new Error(response.data.error || 'No se pudo completar el pre-registro.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRielModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Prueba Riel Gratis</h2>
          <button onClick={closeRielModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Tu Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="Ej: Astaroth"
              required
            />
          </div>
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 mb-1">
              Tu número de WhatsApp
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Te contactaremos por este medio para enviarte el enlace de activación de tu tienda.
            </p>
            <input
              id="whatsapp"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="+505 8888-8888"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-md hover:bg-indigo-700 transition-all disabled:bg-gray-400"
          >
            {isLoading ? <Loader className="animate-spin w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            {isLoading ? 'Procesando...' : 'Registrar y Enviar Mensaje'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RielModal;
