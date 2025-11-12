import React from 'react';
import { Link } from 'react-router-dom';const StoreManager = ({ stores }) => {  const handleShare = (url) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => alert('¡Enlace de la tienda copiado al portapapeles!'))
        .catch(() => alert('No se pudo copiar el enlace.'));
    } else {
      alert('La función de copiar no está disponible en tu navegador.');
    }
  };  const handleDelete = () => {
    // Lógica de borrado se implementará después
    if (window.confirm('¿Estás seguro de que quieres eliminar tu tienda? Esta acción no se puede deshacer.')) {
        console.log('TODO: Implementar borrado de tienda');
    }
  }  // Caso 1: No hay tiendas
  if (!stores || stores.length === 0) {
    return (
      <div className="text-center bg-white shadow-md rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Mi Tienda</h2>
        <p className="text-gray-500 mb-6">Aún no has creado tu tienda.</p>
        <Link to="/editor" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700">
          ➕ Crear mi Primera Tienda
        </Link>
      </div>
    );
  }  // Caso 2: Ya existe una tienda
  const store = stores[0];
  const storeName = store.nombre || 'Mi Tienda';
  const publicUrl = store.shareableUrl || '#';
  const isLaunched = store.activa === true;  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">{storeName}</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        <div className="aspect-w-16 aspect-h-9 border-2 border-gray-200 rounded-lg overflow-hidden mb-4 bg-gray-100">
          {publicUrl !== '#' ? (
            <iframe src={publicUrl} className="w-full h-64 md:h-96" title="Vista previa de la tienda" />
          ) : (
            <div className="w-full h-64 md:h-96 flex items-center justify-center"><p>La tienda no tiene un enlace público aún.</p></div>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/editor" className="flex-1 sm:flex-none text-center bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600">
              ✏️ Editar Tienda
            </Link>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="flex-1 sm:flex-none text-center bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600">
            👁️ Ver Tienda
          </a>
          <button onClick={() => handleShare(publicUrl)} className="flex-1 sm:flex-none bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-600">
            🔗 Compartir
          </button>
          <button onClick={handleDelete} className="flex-1 sm:flex-none bg-red-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-600">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};export default StoreManager;