import React from 'react';
import { Link } from 'react-router-dom';
import { PlusIcon, PencilIcon, EyeIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/solid';

// --- TIPOS ---
type Store = {
  nombre?: string;
  shareableUrl?: string;
  activa?: boolean;
};

type StoreManagerProps = {
  stores: Store[];
  className?: string; // Add className prop
};

const StoreManager: React.FC<StoreManagerProps> = ({ stores, className }) => {
  const handleShare = async (url: string, title: string) => {
    const shareData = {
      title: `¡Echa un vistazo a mi tienda: ${title}!`,
      text: `Descubre los productos en ${title}.`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        console.log('Contenido compartido con éxito');
      } catch (err) {
        console.error('Error al compartir:', err);
        // Opcional: podrías mostrar una notificación de que el usuario canceló la acción
      }
    } else {
      // Fallback para navegadores que no soportan la Web Share API
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url)
          .then(() => alert('¡Enlace de la tienda copiado al portapapeles!'))
          .catch(() => alert('No se pudo copiar el enlace.'));
      } else {
        alert('La función de compartir no está disponible en tu navegador.');
      }
    }
  };

  const handleDelete = () => {
    // Lógica de borrado se implementará después
    if (window.confirm('¿Estás seguro de que quieres eliminar tu tienda? Esta acción no se puede deshacer.')) {
        console.log('TODO: Implementar borrado de tienda');
    }
  };

  // Caso 1: No hay tiendas
  if (!stores || stores.length === 0) {
    return (
      <div className={`text-center bg-gray-100 shadow-md rounded-lg p-8 neumorphic-flat ${className}`}>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Mi Tienda</h2>
        <p className="text-gray-600 mb-6">Aún no has creado tu tienda.</p>
        <Link to="/editor" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 inline-flex items-center justify-center neumorphic-button">
          <PlusIcon className="h-5 w-5 mr-2" /> Crear mi Primera Tienda
        </Link>
      </div>
    );
  }

  // Caso 2: Ya existe una tienda
  const store = stores[0];
  const storeName = store.nombre || 'Mi Tienda';
  const publicUrl = store.shareableUrl || '#';

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">{storeName}</h2>
      <div className="bg-gray-100 shadow-md rounded-lg p-4 neumorphic-flat">
        <div className="aspect-w-16 aspect-h-9 border-2 border-gray-200 rounded-lg overflow-hidden mb-4 bg-gray-50 neumorphic-flat-inner">
          {publicUrl !== '#' ? (
            <iframe src={publicUrl} className="w-full h-64 md:h-96" title="Vista previa de la tienda" />
          ) : (
            <div className="w-full h-64 md:h-96 flex items-center justify-center"><p className="text-gray-600">La tienda no tiene un enlace público aún.</p></div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Link to="/editor" className="flex-1 sm:flex-none text-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 inline-flex items-center justify-center">
              <PencilIcon className="h-5 w-5 mr-2" /> Editar Tienda
            </Link>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none text-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 inline-flex items-center justify-center">
            <EyeIcon className="h-5 w-5 mr-2" /> Ver Tienda
          </a>
          <button onClick={() => handleShare(publicUrl, storeName)} className="flex-1 sm:flex-none bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 inline-flex items-center justify-center">
            <ShareIcon className="h-5 w-5 mr-2" /> Compartir
          </button>
          <button onClick={handleDelete} className="flex-1 sm:flex-none bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600 inline-flex items-center justify-center">
            <TrashIcon className="h-5 w-5 mr-2" /> Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreManager;