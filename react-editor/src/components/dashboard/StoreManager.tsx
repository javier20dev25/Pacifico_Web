import { Link } from 'react-router-dom';
import { PlusCircleIcon, PencilIcon, EyeIcon, ShareIcon, TrashIcon, LockClosedIcon } from '@heroicons/react/24/outline'; // Import Heroicons

interface Store {
  nombre: string;
  slug: string;
  activa: boolean;
}

interface StoreManagerProps {
  stores: Store[];
}

const StoreManager: React.FC<StoreManagerProps> = ({ stores }) => {

  const handleShare = (url: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('¡Enlace de la tienda copiado al portapapeles!'))
        .catch(() => alert('No se pudo copiar el enlace.'));
    } else {
      alert('La función de copiar no está disponible en tu navegador.');
    }
  };

  const handleDelete = () => {
    // Lógica de borrado se implementará después
    if (window.confirm('¿Estás seguro de que quieres eliminar tu tienda? Esta acción no se puede deshacer.')) {
        console.log('TODO: Implementar borrado de tienda');
    }
  }

  // Caso 1: No hay tiendas
  if (!stores || stores.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-8 text-center mb-8"> {/* Added mb-8 for consistent spacing */}
        <h2 className="text-2xl font-bold text-neutral-800 mb-4">Mi Tienda</h2>
        <p className="text-neutral-600 mb-6">Aún no has creado tu tienda.</p>
        <Link to="/editor" className="inline-flex items-center bg-primary-DEFAULT text-white font-semibold py-3 px-6 rounded-lg hover:bg-primary-dark transition duration-300">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Crear mi Primera Tienda
        </Link>
      </div>
    );
  }

  // Caso 2: Ya existe una tienda
  const store = stores[0];
  const storeName = store.nombre || 'Mi Tienda';
  const publicUrl = store.slug ? `${window.location.origin}/store/${store.slug}` : '#';
  const isLaunched = store.activa === true;

  return (
    <div className="mb-8"> {/* Added mb-8 for consistent spacing */}
      <h2 className="text-2xl font-bold text-neutral-800 mb-6">{storeName}</h2>
      <div className="bg-white shadow-md rounded-lg p-6"> {/* Increased padding for consistency */}
        <div className="aspect-w-16 aspect-h-9 border-2 border-neutral-200 rounded-lg overflow-hidden mb-4 bg-neutral-100">
          {publicUrl !== '#' ? (
            <iframe src={publicUrl} className="w-full h-64 md:h-96" title="Vista previa de la tienda" />
          ) : (
            <div className="w-full h-64 md:h-96 flex items-center justify-center text-neutral-500"><p>La tienda no tiene un enlace público aún.</p></div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {isLaunched ? (
            <button 
              className="flex-1 sm:flex-none inline-flex items-center justify-center bg-neutral-200 text-neutral-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed transition duration-300"
              disabled 
              title="Tu tienda ya fue lanzada y no puede ser editada."
            >
              <LockClosedIcon className="h-5 w-5 mr-2" />
              Editar (Bloqueado)
            </button>
          ) : (
            <Link to="/editor" className="flex-1 sm:flex-none inline-flex items-center justify-center text-center bg-primary-DEFAULT text-white font-semibold py-2 px-4 rounded-lg hover:bg-primary-dark transition duration-300">
              <PencilIcon className="h-5 w-5 mr-2" />
              Editar Tienda
            </Link>
          )}
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none inline-flex items-center justify-center text-center bg-secondary-DEFAULT text-white font-semibold py-2 px-4 rounded-lg hover:bg-secondary-dark transition duration-300">
            <EyeIcon className="h-5 w-5 mr-2" />
            Ver Tienda
          </a>
          <button onClick={() => handleShare(publicUrl)} className="flex-1 sm:flex-none inline-flex items-center justify-center bg-neutral-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-neutral-600 transition duration-300">
            <ShareIcon className="h-5 w-5 mr-2" />
            Compartir
          </button>
          <button onClick={handleDelete} className="flex-1 sm:flex-none inline-flex items-center justify-center bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300">
            <TrashIcon className="h-5 w-5 mr-2" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreManager;
