// src/pages/AdminRiel.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Link as LinkIcon, AlertCircle, Loader } from 'lucide-react';
import apiClient from '@/api/axiosConfig';

interface PreRegistration {
  id: number;
  whatsapp_number: string;
  created_at: string;
  status: 'pending' | 'claimed';
}

const AdminRiel: React.FC = () => {
  const [preregistrations, setPreregistrations] = useState<PreRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [whatsAppToSend, setWhatsAppToSend] = useState<string | null>(null);

  const fetchPreregistrations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/riel-preregistrations');
      setPreregistrations(response.data);
    } catch (err) {
      setError('No se pudieron cargar los pre-registros.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreregistrations();
  }, [fetchPreregistrations]);

  const handleCreateAndLink = async (preregistrationId: number, whatsappNumber: string) => {
    setGeneratedLink(null);
    setWhatsAppToSend(null);
    setIsCreating(preregistrationId);
    setError(null);
    
    try {
        const response = await apiClient.post('/admin/create-riel-account', { preregistration_id: preregistrationId });
        if (response.status === 201 && response.data.activationLink) {
            const fullUrl = `${window.location.origin}${response.data.activationLink}`;
            setGeneratedLink(fullUrl);
            setWhatsAppToSend(whatsappNumber); // Guardar el número para usarlo en el botón
            // Refrescar la lista para eliminar la solicitud procesada
            fetchPreregistrations();
        } else {
            throw new Error(response.data.error || 'Ocurrió un error al crear la cuenta.');
        }
    } catch (err: any) {
        setError(err.message || 'Error inesperado del servidor.');
    } finally {
        setIsCreating(null);
    }
  };

  const openWhatsApp = () => {
    if (!whatsAppToSend || !generatedLink) return;
    const number = whatsAppToSend.replace(/\D/g, '');
    const message = encodeURIComponent(`¡Hola! Tu cuenta gratuita de Riel está casi lista. Actívala haciendo clic en el siguiente enlace: ${generatedLink}`);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank');
  }
  
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Cuentas "Riel"</h1>
          <p className="text-slate-500">Crea cuentas para los usuarios que solicitaron la prueba gratuita.</p>
        </div>
      </div>

      {generatedLink && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-r-lg mb-6">
          <h3 className="font-bold">Enlace de Activación Generado</h3>
          <p className="text-sm mt-1">Copia el enlace o envíalo directamente por WhatsApp:</p>
          <div className="flex items-center gap-2 mt-2">
            <input 
              type="text"
              readOnly
              value={generatedLink}
              className="w-full p-2 bg-white border border-emerald-200 rounded text-sm flex-grow"
              onFocus={(e) => e.target.select()}
            />
            <button 
              onClick={openWhatsApp}
              className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors flex-shrink-0"
            >
              Enviar por WhatsApp
            </button>
          </div>
        </div>
      )}

      {error && <p className="p-4 text-center text-red-500 bg-red-50 rounded-lg mb-4">{error}</p>}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Solicitudes Pendientes</h2>
        </div>
        
        {isLoading && <div className="p-4 text-center text-slate-500"><Loader className="w-6 h-6 animate-spin mx-auto" /></div>}
        
        {!isLoading && (
          <ul className="divide-y divide-slate-100">
            {preregistrations.map(reg => (
              <li key={reg.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <p className="font-mono font-semibold text-slate-800">{reg.whatsapp_number}</p>
                  <p className="text-xs text-slate-400">
                    Solicitado: {new Date(reg.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleCreateAndLink(reg.id, reg.whatsapp_number)}
                  disabled={isCreating === reg.id}
                  className="mt-3 sm:mt-0 flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all active:scale-95 disabled:bg-gray-400"
                >
                  {isCreating === reg.id ? <Loader className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  {isCreating === reg.id ? 'Creando...' : 'Crear Cuenta y Generar Enlace'}
                </button>
              </li>
            ))}
            {preregistrations.length === 0 && (
              <li className="p-10 text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 font-medium">No hay solicitudes pendientes.</p>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AdminRiel;
