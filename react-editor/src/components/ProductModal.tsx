import React, { useState, useEffect } from 'react';
import useAppStore, { type Product } from '@/stores/store';
import { getPublicImageUrl } from '../lib/supabase-utils';
import { Upload, Info, X, Save } from 'lucide-react';

// --- COMPONENTES DE FORMULARIO EXTRAÍDOS Y TIPADOS ---
const FormRow = ({ label, htmlFor, children, description }: { label: string, htmlFor?: string, children: React.ReactNode, description?: string }) => (
  <div>
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    {children}
    {description && <p className="text-xs text-slate-500 mt-1.5">{description}</p>}
  </div>
);

const ByOrderForm = ({ productData, handleFormChange, handleBlur }: { productData: Partial<Product>, handleFormChange: Function, handleBlur: Function }) => (
  <fieldset className="border-t border-slate-200 pt-6">
    <legend className="text-base font-semibold text-slate-800 mb-4">Cálculo de Precio (Por Encargo)</legend>
    <div className="space-y-6">
      <FormRow label="Costo Base ($)" htmlFor="costo_base_final" description="Lo que vale tu producto en la plataforma donde lo compras.">
        <input id="costo_base_final" type="text" inputMode="decimal" value={String(productData.costo_base_final ?? '')} onChange={(e) => handleFormChange(e, 'costo_base_final')} onBlur={(e) => handleBlur(e, 'costo_base_final')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
      </FormRow>
      <FormRow label="Peso (Lb)" htmlFor="peso_lb" description="Revisa la info del producto en la web del proveedor.">
        <input id="peso_lb" type="text" inputMode="decimal" value={String(productData.peso_lb ?? '')} onChange={(e) => handleFormChange(e, 'peso_lb')} onBlur={(e) => handleBlur(e, 'peso_lb')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
      </FormRow>
      <FormRow label="Margen de Ganancia" htmlFor="margen_valor" description="Tu ganancia, en monto fijo ($) o porcentaje (%).">
        <div className="flex items-center gap-2">
          <input id="margen_valor" type="text" inputMode="decimal" value={String(productData.margen_valor ?? '')} onChange={(e) => handleFormChange(e, 'margen_valor')} onBlur={(e) => handleBlur(e, 'margen_valor')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          <select id="margen_tipo" value={productData.margen_tipo || 'fixed'} onChange={(e) => handleFormChange(e, 'margen_tipo')} className="px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="fixed">$</option>
            <option value="percent">%</option>
          </select>
        </div>
      </FormRow>
      <FormRow label="Enlace del Proveedor (Secreto)" htmlFor="distributorLink" description="El enlace al producto en Shein, AliExpress, etc. No será visible para tus clientes.">
        <input id="distributorLink" type="text" value={productData.distributorLink || ''} onChange={(e) => handleFormChange(e, 'distributorLink')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
      </FormRow>
    </div>
  </fieldset>
);

const InStockForm = ({ productData, handleFormChange, handleBlur }: { productData: Partial<Product>, handleFormChange: Function, handleBlur: Function }) => (
  <fieldset className="border-t border-slate-200 pt-6">
    <legend className="text-base font-semibold text-slate-800 mb-4">Precio (Stock Local)</legend>
    <div className="space-y-6">
      <FormRow label="Precio Base ($)" htmlFor="precio_base" description="El precio de venta final del producto, con tu ganancia ya incluida.">
        <input id="precio_base" type="text" inputMode="decimal" value={String(productData.precio_base ?? '')} onChange={(e) => handleFormChange(e, 'precio_base')} onBlur={(e) => handleBlur(e, 'precio_base')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
      </FormRow>
      <FormRow label="Impuestos (%)" htmlFor="impuesto_porcentaje" description="Opcional. Un porcentaje de impuestos que se añadirá al precio base.">
        <input id="impuesto_porcentaje" type="text" inputMode="decimal" value={String(productData.impuesto_porcentaje ?? '')} onChange={(e) => handleFormChange(e, 'impuesto_porcentaje')} onBlur={(e) => handleBlur(e, 'impuesto_porcentaje')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
      </FormRow>
      <label className="flex items-center gap-3 cursor-pointer">
        <input id="impuestos_incluidos" type="checkbox" checked={productData.impuestos_incluidos || false} onChange={(e) => handleFormChange(e, 'impuestos_incluidos', true)} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm font-medium text-slate-700">El precio base ya incluye los impuestos.</span>
      </label>
    </div>
  </fieldset>
);

const getInitialProductData = (): Product => ({
  idLocal: 'product_' + Date.now(), nombre: '', descripcion: '', youtubeLink: '', imageUrl: null, imageFile: null, costo_base_final: 0, peso_lb: 0, margen_valor: 0, margen_tipo: 'fixed', precio_base: 0, impuesto_porcentaje: 0, impuestos_incluidos: false, distributorLink: '',
});

const ProductModal = () => {
  const store = useAppStore((state) => state.store);
  const products = useAppStore((state) => state.products);
  const editingProductId = useAppStore((state) => state.editingProductId);
  const closeModal = useAppStore((state) => state.closeProductModal);
  const addProduct = useAppStore((state) => state.addProduct);
  const updateProduct = useAppStore((state) => state.updateProduct);
  const [productData, setProductData] = useState<Product>(() => getInitialProductData());

  useEffect(() => {
    const productToEdit = editingProductId ? products.find(p => p.idLocal === editingProductId) : null;
    setProductData(productToEdit ? { ...getInitialProductData(), ...productToEdit } : getInitialProductData());
  }, [editingProductId, products]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, field: keyof Product, isCheckbox = false) => {
    const { value } = e.target;
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
    setProductData(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, field: keyof Product) => {
    const { value } = e.target;
    const numericValue = parseFloat(value);
    setProductData(prev => ({ ...prev, [field]: isNaN(numericValue) ? 0 : numericValue }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setProductData(prev => ({ ...prev, imageUrl, imageFile: file }));
      if (editingProductId) updateProduct(editingProductId, { imageUrl, imageFile: file });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!productData.nombre) { alert('El nombre del producto es obligatorio.'); return; }
    
    // Crea una copia limpia de los datos para guardar, asegurando que todos los valores numéricos sean números.
    const dataToSave: Partial<Product> = {
      ...productData,
      costo_base_final: parseFloat(String(productData.costo_base_final)) || 0,
      peso_lb: parseFloat(String(productData.peso_lb)) || 0,
      margen_valor: parseFloat(String(productData.margen_valor)) || 0,
      precio_base: parseFloat(String(productData.precio_base)) || 0,
      impuesto_porcentaje: parseFloat(String(productData.impuesto_porcentaje)) || 0,
    };

    if (store.storeType === 'by_order') {
      const cost = dataToSave.costo_base_final as number;
      const weight = dataToSave.peso_lb as number;
      const margin = dataToSave.margen_valor as number;
      const airRate = typeof store.airRate === 'string' ? parseFloat(store.airRate) || 0 : store.airRate;
      const seaRate = typeof store.seaRate === 'string' ? parseFloat(store.seaRate) || 0 : store.seaRate;
      
      const airShippingCost = airRate * weight;
      const seaShippingCost = seaRate * weight;

      dataToSave.precio_final_aereo = cost + airShippingCost + (dataToSave.margen_tipo === 'fixed' ? margin : (cost + airShippingCost) * (margin / 100));
      dataToSave.precio_final_maritimo = cost + seaShippingCost + (dataToSave.margen_tipo === 'fixed' ? margin : (cost + seaShippingCost) * (margin / 100));
    }

    if (editingProductId) {
      updateProduct(editingProductId, dataToSave);
    } else {
      addProduct(dataToSave as Product);
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">{editingProductId ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
          <button onClick={closeModal} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
        </header>
        <main className="p-6 space-y-6 overflow-y-auto">
          <fieldset>
            <legend className="text-base font-semibold text-slate-800 mb-4">Información Básica</legend>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center">
                 <label className="group relative w-48 h-32 rounded-lg cursor-pointer border-2 border-dashed border-slate-300 hover:border-indigo-500 transition-colors bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
                    {productData.imageUrl ? <img src={getPublicImageUrl(productData.imageUrl)} alt="Preview" className="w-full h-full object-cover" /> : <><Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-1" /><span className="text-xs text-slate-400 group-hover:text-indigo-500">Subir Imagen</span></>}
                    <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
                 </label>
              </div>
              <FormRow label="Nombre del Producto" htmlFor="nombre">
                <input id="nombre" type="text" placeholder="Ej: Camiseta Premium" value={productData.nombre} onChange={(e) => handleFormChange(e, 'nombre')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </FormRow>
              <FormRow label="Descripción" htmlFor="descripcion">
                <textarea id="descripcion" placeholder="Detalles, material, etc." value={productData.descripcion} onChange={(e) => handleFormChange(e, 'descripcion')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none" rows={3}></textarea>
              </FormRow>
              <FormRow label="Enlace de Video (Opcional)" htmlFor="youtubeLink">
                <input id="youtubeLink" type="text" placeholder="URL de YouTube, Facebook, IG, TikTok" value={productData.youtubeLink || ''} onChange={(e) => handleFormChange(e, 'youtubeLink')} className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
                <div className="mt-2 bg-blue-50 text-blue-700 text-xs p-3 rounded-lg flex gap-2 items-start">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Para la mejor experiencia, usa videos propios y activa la "inserción" en la configuración del video.</p>
                </div>
              </FormRow>
            </div>
          </fieldset>
          {store.storeType === 'by_order' ? <ByOrderForm productData={productData} handleFormChange={handleFormChange} handleBlur={handleBlur} /> : <InStockForm productData={productData} handleFormChange={handleFormChange} handleBlur={handleBlur} />}
        </main>
        <footer className="p-5 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={closeModal} className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 font-medium rounded-lg border border-slate-200 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md shadow-indigo-200 transition-all active:scale-95"><Save className="w-4 h-4" /> Guardar Producto</button>
        </footer>
      </div>
    </div>
  );
};

export default ProductModal;
