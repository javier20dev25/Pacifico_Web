// src/components/dashboard/RielManager.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Eye, Share2, Trash2, Power, PowerOff } from 'lucide-react';
import apiClient from '@/api/axiosConfig';
import type { Store } from '@/types'; // Importar el tipo compartido

interface RielManagerProps {
  stores: Store[];
  className?: string;
}

const RielManager: React.FC<RielManagerProps> = ({ stores, className = '' }) => {
  const rielStore = stores.find(store => store.store_type === 'riel');
  const [isRielActive, setIsRielActive] = useState(rielStore?.activa || false);
  const [notification, setNotification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleActive = async () => {
    if (!rielStore || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await apiClient.put(`/riel/${rielStore.id}/toggle`);
      setIsRielActive(response.data.store.activa);
      setNotification(response.data.message);
    } catch (error) {
      console.error("Error al cambiar el estado de la tienda Riel", error);
      setNotification('Error al actualizar el estado.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const handleDeleteRiel = async () => {
    if (!rielStore || isSubmitting) return;
    if (window.confirm('¿Estás seguro de que quieres borrar tu tienda Riel? Esta acción no se puede deshacer.')) {
      setIsSubmitting(true);
      try {
        await apiClient.delete(`/riel/${rielStore.id}`);
        // Recargar la página para reflejar que el Riel ya no existe.
        window.location.reload();
      } catch (error) {
        console.error("Error al borrar la tienda Riel", error);
        setNotification('Error al borrar la tienda.');
        setIsSubmitting(false);
        setTimeout(() => setNotification(''), 3000);
      }
    }
  };

  const handleShare = () => {
    if (!rielStore) return;
    const rielUrl = `${window.location.origin}/store/${rielStore.slug}`;
    navigator.clipboard.writeText(rielUrl).then(() => {
        setNotification('¡URL copiada al portapapeles!');
        setTimeout(() => setNotification(''), 3000);
    });
  };

  // Si existe una tienda Riel, mostramos el panel de gestión.
  if (rielStore) {
    return (
      <div className={`bg-slate-800 p-6 rounded-2xl shadow-lg text-white ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-2xl flex items-center gap-2">
              <Sparkles className="text-yellow-300" />
              <span>Gestionar Tienda Riel</span>
            </h2>
            <p className="text-slate-400 mt-1 max-w-lg">
              Tu tienda Riel está lista. Usa estos controles para administrarla.
            </p>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-sm font-medium mr-2">{isRielActive ? 'Pública' : 'Inactiva'}</span>
            <button onClick={handleToggleActive} disabled={isSubmitting} className={`p-2 rounded-full transition-colors ${isRielActive ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} disabled:opacity-50`}>
                {isRielActive ? <Power size={20} /> : <PowerOff size={20} />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Link to={`/store/${rielStore.slug}`} target="_blank" className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg flex flex-col items-center justify-center text-center transition">
                <Eye size={24} className="mb-2" />
                <span className="text-sm font-semibold">Ver Tienda</span>
            </Link>
            <button onClick={handleShare} className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg flex flex-col items-center justify-center text-center transition">
                <Share2 size={24} className="mb-2" />
                <span className="text-sm font-semibold">Compartir</span>
            </button>
            <Link to="/riel/editor" className="bg-slate-700 hover:bg-slate-600 p-4 rounded-lg flex flex-col items-center justify-center text-center transition">
                <Sparkles size={24} className="mb-2" />
                <span className="text-sm font-semibold">Editar</span>
            </Link>
             <button onClick={handleDeleteRiel} disabled={isSubmitting} className="bg-red-800/50 hover:bg-red-700/60 p-4 rounded-lg flex flex-col items-center justify-center text-center transition text-red-300 hover:text-white disabled:opacity-50">
                <Trash2 size={24} className="mb-2" />
                <span className="text-sm font-semibold">Borrar Riel</span>
            </button>
        </div>
        {notification && <div className="text-center mt-4 text-green-400 font-semibold">{notification}</div>}
      </div>
    );
  }

  // Si no existe un Riel, mostramos el botón para crearlo.
  return (
    <div className={`bg-gradient-to-r from-purple-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-2xl flex items-center gap-2">
            <Sparkles className="text-yellow-300" />
            <span>Activa tu Tienda Riel</span>
          </h2>
          <p className="text-indigo-200 mt-1 max-w-lg">
            Expande tu alcance con una tienda interactiva tipo "swipe". Es una segunda vitrina para tus productos, ideal para promociones y captar nuevos clientes.
          </p>
        </div>
        <Link 
          to="/riel/editor"
          className="bg-white text-indigo-700 font-bold py-3 px-6 rounded-full shadow-md hover:bg-indigo-100 transition-transform transform hover:scale-105 flex items-center gap-2 whitespace-nowrap"
        >
          Crear un Riel
          <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
};

export default RielManager;
