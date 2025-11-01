import useAppStore, { type Product } from '../stores/store';

// Sub-componente para un único producto
const ProductItem = ({ product }: { product: Product }) => {
  const storeType = useAppStore((state) => state.store.storeType);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const openModal = useAppStore((state) => state.openProductModal);

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${product.nombre}"?`)) {
      deleteProduct(product.idLocal);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-neumoBg shadow-neumo flex justify-between items-start"> {/* Neumorphic card style */}
        <div className="flex-grow pr-4">
          <h3 className="font-bold text-lg text-gray-800">{product.nombre}</h3>
          <p className="text-sm text-gray-600 mb-2">{product.descripcion}</p>

          {/* Display calculated prices for 'by_order' products */}
          {storeType === 'by_order' && (
            <div className="text-xs text-gray-700 space-y-1 mt-2 p-3 bg-neumoBg rounded-lg shadow-neumoInset"> {/* Neumorphic inset style */}
              <div className="grid grid-cols-3 gap-x-4">
                <span>Costo: <strong>${parseFloat(String(product.costo_base_final)).toFixed(2) || '0.00'}</strong></span>
                <span>Peso: <strong>{parseFloat(String(product.peso_lb)).toFixed(2) || '0.00'} lb</strong></span>
                <span>Margen: <strong>{product.margen_tipo === 'fixed' ? `$${parseFloat(String(product.margen_valor)).toFixed(2)}` : `${parseFloat(String(product.margen_valor)).toFixed(2)}%`}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 pt-2 mt-2 border-t border-gray-300">
                <p className="font-semibold text-blue-600">✈️ Aéreo: ${product.precio_final_aereo?.toFixed(2) || 'N/A'}</p>
                <p className="font-semibold text-green-600">🚢 Marítimo: ${product.precio_final_maritimo?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
          )}
          {storeType === 'in_stock' && (
            <div className="text-xs text-gray-700 space-y-1 mt-2 p-3 bg-neumoBg rounded-lg shadow-neumoInset"> {/* Neumorphic inset style */}
                <p>Precio Base: <strong>${parseFloat(String(product.precio_base)).toFixed(2) || '0.00'}</strong></p>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col gap-2 ml-4">
          <button onClick={() => openModal(product.idLocal)} className="btn px-3 py-1 bg-yellow-400 text-white rounded-full shadow-neumo hover:shadow-neumo-active active:shadow-neumo-inset text-sm w-full text-center">Editar</button>
          <button onClick={handleDelete} className="btn px-3 py-1 bg-red-500 text-white rounded-full shadow-neumo hover:shadow-neumo-active active:shadow-neumo-inset text-sm w-full text-center">Eliminar</button>
        </div>
    </div>
  );
};

const ProductEditor = () => {
  // Patrón correcto de Zustand: seleccionar estado y acciones por separado
  const products = useAppStore((state) => state.products);
  const openModal = useAppStore((state) => state.openProductModal);

  const handleAddProduct = () => {
    openModal(); // Abre el modal para un nuevo producto
  };

  return (
    <div className="mt-8 p-6 rounded-xl bg-neumoBg shadow-neumo"> {/* Neumorphic card style */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Productos</h2>
        <button
          onClick={handleAddProduct}
          className="btn px-4 py-2 bg-green-500 text-white font-semibold rounded-full shadow-neumo hover:shadow-neumo-active active:shadow-neumo-inset"
        >
          Añadir Producto
        </button>
      </div>

      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductItem key={product.idLocal} product={product} />
          ))
        ) : (
          <p className="text-gray-600 text-center py-4 rounded-lg bg-neumoBg shadow-neumoInset">No hay productos todavía. ¡Añade uno!</p>
        )}
      </div>
    </div>
  );
};

export default ProductEditor;