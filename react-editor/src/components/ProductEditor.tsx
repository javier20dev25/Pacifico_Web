import useAppStore, { type Product } from '@/stores/store';// Sub-componente para un único producto
const ProductItem = ({ product }: { product: Product }) => {
  const storeType = useAppStore((state) => state.store.storeType);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const openModal = useAppStore((state) => state.openProductModal);  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar "' + product.nombre + '"?')) {
      deleteProduct(product.idLocal);
    }
  };  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm flex justify-between items-start">
        <div className="flex-grow pr-4">
          <h3 className="font-bold text-lg">{product.nombre}</h3>
          <p className="text-sm text-gray-600 mb-2">{product.descripcion}</p>          {/* Display calculated prices for 'by_order' products */}
          {storeType === 'by_order' && (
            <div className="text-xs text-gray-500 space-y-1 mt-2 p-2 bg-gray-50 rounded-md border">
              <div className="grid grid-cols-3 gap-x-4">
                <span>Costo: <strong>${parseFloat(product.costo_base_final).toFixed(2) || '0.00'}</strong></span>
                <span>Peso: <strong>{parseFloat(product.peso_lb).toFixed(2) || '0.00'} lb</strong></span>
                <span>Margen: <strong>{product.margen_tipo === 'fixed' ? '$' + parseFloat(product.margen_valor).toFixed(2) : parseFloat(product.margen_valor).toFixed(2) + '%'}</strong></span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 pt-2 mt-2 border-t">
                <p className="font-semibold text-blue-600">✈️ Aéreo: ${product.precio_final_aereo?.toFixed(2) || 'N/A'}</p>
                <p className="font-semibold text-green-600">🚢 Marítimo: ${product.precio_final_maritimo?.toFixed(2) || 'N/A'}</p>
              </div>
            </div>
          )}
          {storeType === 'in_stock' && (
            <div className="text-xs text-gray-500 space-y-1 mt-2 p-2 bg-gray-50 rounded-md border">
                <p>Precio Base: <strong>${parseFloat(product.precio_base).toFixed(2) || '0.00'}</strong></p>
            </div>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col gap-2 ml-4">
          <button onClick={() => openModal(product.idLocal)} className="px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm w-full text-center">Editar</button>
          <button onClick={handleDelete} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm w-full text-center">Eliminar</button>
        </div>
    </div>
  );
};const ProductEditor = () => {
  // Patrón correcto de Zustand: seleccionar estado y acciones por separado
  const products = useAppStore((state) => state.products);
  const openModal = useAppStore((state) => state.openProductModal);  const handleAddProduct = () => {
    openModal(); // Abre el modal para un nuevo producto
  };  return (
    <div className="mt-8 p-4 border rounded-md bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Productos</h2>
        <button
          onClick={handleAddProduct}
          className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg shadow-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        >
          Añadir Producto
        </button>
      </div>      <div className="space-y-4">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductItem key={product.idLocal} product={product} />
          ))
        ) : (
          <p className="text-gray-500 text-center">No hay productos todavía. ¡Añade uno!</p>
        )}
      </div>
    </div>
  );
};export default ProductEditor;