import useAppStore, { type Product } from '@/stores/store';
import { Package, Plus, Edit2, Trash2, Plane, Anchor } from 'lucide-react';

const ProductItem = ({ product }: { product: Product }) => {
  const storeType = useAppStore((state) => state.store.storeType);
  const deleteProduct = useAppStore((state) => state.deleteProduct);
  const openModal = useAppStore((state) => state.openProductModal);

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar "' + product.nombre + '"?')) {
      deleteProduct(product.idLocal);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start justify-between border-b border-slate-50">
         <div>
            <h3 className="font-bold text-slate-900 text-lg">{product.nombre}</h3>
            <p className="text-slate-400 text-sm font-medium">{product.idLocal}</p>
         </div>
         <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openModal(product.idLocal)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
               <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
               <Trash2 className="w-4 h-4" />
            </button>
         </div>
      </div>

      {storeType === 'by_order' && (
        <>
          <div className="grid grid-cols-3 divide-x divide-slate-100 bg-slate-50/30">
             <div className="p-3 text-center">
                <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Costo</span>
                <span className="font-mono font-semibold text-slate-700">${(Number(product.costo_base_final) || 0).toFixed(2)}</span>
             </div>
             <div className="p-3 text-center">
                <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Peso (lb)</span>
                <span className="font-mono font-semibold text-slate-700">{(Number(product.peso_lb) || 0).toFixed(2)}</span>
             </div>
             <div className="p-3 text-center">
                <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Margen</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {product.margen_tipo === 'fixed' ? `+${(Number(product.margen_valor) || 0).toFixed(2)}` : `+${product.margen_valor || 0}%`}
                </span>
             </div>
          </div>
          <div className="p-3 bg-indigo-50/30 flex justify-between items-center text-sm border-t border-slate-100">
              <div className="flex items-center gap-2 text-sky-700">
                  <Plane className="w-4 h-4" /> 
                  <span className="font-bold">${(Number(product.precio_final_aereo) || 0).toFixed(2)}</span>
                  <span className="text-xs text-sky-400">Aéreo</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="flex items-center gap-2 text-teal-700">
                  <Anchor className="w-4 h-4" />
                  <span className="font-bold">${(Number(product.precio_final_maritimo) || 0).toFixed(2)}</span>
                  <span className="text-xs text-teal-400">Marítimo</span>
              </div>
          </div>
        </>
      )}
      {storeType === 'in_stock' && (
        <div className="p-3 text-center bg-slate-50/30">
            <span className="block text-xs uppercase text-slate-400 font-bold tracking-wider">Precio de Venta</span>
            <span className="font-mono font-semibold text-slate-700">${(Number(product.precio_base) || 0).toFixed(2)}</span>
        </div>
      )}
    </div>
  );
};

const ProductEditor = () => {
  const products = useAppStore((state) => state.products);
  const openModal = useAppStore((state) => state.openProductModal);
  const productLimit = useAppStore((state) => state.store.productLimit);
  const planName = useAppStore((state) => state.store.planName);

  // Consider a limit of 0 or undefined as unlimited.
  // CORRECCIÓN: Usar '!!' para asegurar que el resultado sea un booleano estricto.
  const hasLimit = !!(productLimit && productLimit > 0);
  const limitReached = hasLimit && products.length >= productLimit;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 text-sky-600 font-bold text-sm"><Package className="w-4 h-4" /></span>
          <h2 className="text-xl font-bold text-slate-900">Catálogo de Productos</h2>
        </div>
        <button 
          onClick={() => openModal()} 
          disabled={limitReached}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2.5 px-4 rounded-lg shadow-md shadow-emerald-200 transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
        >
          <Plus className="w-4 h-4" /> Añadir Producto
        </button>
      </div>

      {hasLimit && (
        <div className={`p-3 rounded-lg text-sm font-medium text-center ${limitReached ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
          <span>Has usado <strong>{products.length}</strong> de <strong>{productLimit}</strong> productos permitidos en tu plan <strong>'{planName}'</strong>.</span>
        </div>
      )}

      <div className="grid gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductItem key={product.idLocal} product={product} />
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">Aún no hay productos</p>
              <p className="text-slate-400 text-sm mt-1">Haz clic en "Añadir Producto" para empezar.</p>
          </div>
        )}
      </div>
    </section>
  );
};
export default ProductEditor;