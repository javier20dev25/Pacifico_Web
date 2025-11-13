import React, { useState, useEffect } from 'react';
import useAppStore, { type Product } from '@/stores/store';

// --- TIPOS PARA PROPS ---
type FormRowProps = {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  description?: string;
};

type ByOrderFormProps = {
  productData: Partial<Product>;
  handleFormChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, _field: keyof Product, _isCheckbox?: boolean) => void;
};

type InStockFormProps = {
  productData: Partial<Product>;
  handleFormChange: (_e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, _field: keyof Product, _isCheckbox?: boolean) => void;
};


// --- COMPONENTES DE FORMULARIO EXTRAÍDOS Y TIPADOS ---
const FormRow = ({ label, htmlFor, children, description }: FormRowProps) => (
  <div>
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-800">{label}</label>
    <div className="flex items-start gap-4">
      <div className="flex-grow">{children}</div>
      {description && <p className="text-xs text-gray-500 pt-2 w-1/3">{description}</p>}
    </div>
  </div>
);

const ByOrderForm = ({ productData, handleFormChange }: ByOrderFormProps) => {
  const { costo_base_final, peso_lb, margen_valor, margen_tipo, distributorLink } = productData;

  return (
    <>
      <fieldset className="border p-4 rounded-md space-y-4">
        <legend className="text-lg font-semibold px-2">Cálculo de Precio (Por Encargo)</legend>
        <FormRow label="Costo Base ($)" htmlFor="costo_base_final" description="Es lo que vale tu producto en la plataforma donde lo estás comprando.">
          <input id="costo_base_final" type="number" value={costo_base_final || ''} onChange={(e) => handleFormChange(e, 'costo_base_final')} className="input w-full p-2 border rounded" />
        </FormRow>
        <FormRow label="Peso (Lb)" htmlFor="peso_lb" description="Revisa la información del producto en la web del proveedor para encontrar este dato.">
          <input id="peso_lb" type="number" value={peso_lb || ''} onChange={(e) => handleFormChange(e, 'peso_lb')} className="input w-full p-2 border rounded" />
        </FormRow>
        <FormRow label="Margen de Ganancia" htmlFor="margen_valor" description="La ganancia a añadir. Puede ser un monto fijo ($) o un porcentaje (%).">
          <div className="flex items-center gap-2">
            <input id="margen_valor" type="number" value={margen_valor || ''} onChange={(e) => handleFormChange(e, 'margen_valor')} className="input w-full p-2 border rounded" />
            <select id="margen_tipo" value={margen_tipo || 'fixed'} onChange={(e) => handleFormChange(e, 'margen_tipo')} className="input p-2 border rounded bg-gray-100">
              <option value="fixed">$ (Fijo)</option>
              <option value="percent">% (Porcentaje)</option>
            </select>
          </div>
        </FormRow>
        <FormRow label="Enlace del Proveedor (Secreto)" htmlFor="distributorLink" description="El enlace a la página del producto en el sitio de tu proveedor (ej. Shein, AliExpress). No será visible para tus clientes.">
          <input id="distributorLink" type="text" value={distributorLink || ''} onChange={(e) => handleFormChange(e, 'distributorLink')} className="input w-full p-2 border rounded" />
        </FormRow>
      </fieldset>
    </>
  );
};

const InStockForm = ({ productData, handleFormChange }: InStockFormProps) => {
  const { precio_base, impuesto_porcentaje, impuestos_incluidos } = productData;
  return (
    <fieldset className="border p-4 rounded-md space-y-4">
      <legend className="text-lg font-semibold px-2">Precio (Stock Local)</legend>
      <FormRow label="Precio Base ($)" htmlFor="precio_base" description="El precio de venta final del producto, con tu ganancia ya incluida.">
        <input id="precio_base" type="number" value={precio_base || ''} onChange={(e) => handleFormChange(e, 'precio_base')} className="input w-full p-2 border rounded" />
      </FormRow>
      <FormRow label="Impuestos (%)" htmlFor="impuesto_porcentaje" description="Opcional. Un porcentaje de impuestos que se añadirá al precio base.">
        <input id="impuesto_porcentaje" type="number"value={impuesto_porcentaje || ''} onChange={(e) => handleFormChange(e, 'impuesto_porcentaje')} className="input w-full p-2 border rounded" />
      </FormRow>
      <FormRow label="¿Impuestos ya incluidos?" htmlFor="impuestos_incluidos" description="Marca esta casilla si el precio base ya incluye los impuestos.">
        <input id="impuestos_incluidos" type="checkbox" checked={impuestos_incluidos || false} onChange={(e) => handleFormChange(e, 'impuestos_incluidos', true)} className="h-6 w-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
      </FormRow>
    </fieldset>
  );
};

const getInitialProductData = (): Product => ({
  idLocal: 'product_' + Date.now(),
  nombre: '',
  descripcion: '',
  youtubeLink: '',
  imageUrl: null,
  imageFile: null,
  costo_base_final: undefined,
  peso_lb: undefined,
  margen_valor: undefined,
  margen_tipo: 'fixed',
  precio_base: undefined,
  impuesto_porcentaje: undefined,
  impuestos_incluidos: false,
  distributorLink: '',
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
    if (productToEdit) {
      // Ya no se necesitan conversiones a String, los tipos ahora coinciden
      setProductData({ ...getInitialProductData(), ...productToEdit });
    } else {
      setProductData(getInitialProductData());
    }
  }, [editingProductId, products]);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    field: keyof Product,
    isCheckbox = false
  ) => {
    const { type, value } = e.target;
    
    let finalValue: string | number | boolean | undefined;

    if (isCheckbox) {
      finalValue = (e.target as HTMLInputElement).checked;
    } else {
      finalValue = value;
    }

    if (type === 'number' && value !== '') {
      finalValue = parseFloat(value);
    }

    setProductData(prev => ({ ...prev, [field]: finalValue }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setProductData(prev => ({ ...prev, imageUrl, imageFile: file }));
      // También actualizamos el store para que el editor principal tenga el archivo
      if (editingProductId) {
        updateProduct(editingProductId, { imageUrl, imageFile: file });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!productData.nombre) { alert('El nombre del producto es obligatorio.'); return; }

    const dataToSave: Partial<Product> = { ...productData };

    if (store.storeType === 'by_order') {
      const cost = dataToSave.costo_base_final || 0;
      const weight = dataToSave.peso_lb || 0;
      const margin = dataToSave.margen_valor || 0;
      const airShippingCost = store.airRate * weight;
      const seaShippingCost = store.seaRate * weight;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b">{editingProductId ? 'Editar Producto' : 'Añadir Producto'}</h2>
        <div className="p-6 space-y-6 overflow-y-auto">
          <fieldset className="border p-4 rounded-md space-y-4">
            <legend className="text-lg font-semibold px-2">Información Básica</legend>
            <div className="w-48 h-32 bg-gray-100 flex items-center justify-center border-2 border-dashed mx-auto overflow-hidden cursor-pointer" onClick={() => document.getElementById('image-upload')?.click()}>
              {productData.imageUrl ? <img src={productData.imageUrl} alt="Preview" className="w-full h-full object-cover"/> : <span className="text-gray-400 text-sm">Subir Imagen</span>}
            </div>
            <input type="file" id="image-upload" accept="image/*" className="hidden" onChange={handleImageChange} />
            <input id="nombre" type="text" placeholder="Nombre del Producto" value={productData.nombre} onChange={(e) => handleFormChange(e, 'nombre')} className="input w-full p-2 border rounded" />
            <textarea id="descripcion" placeholder="Descripción" value={productData.descripcion} onChange={(e) => handleFormChange(e, 'descripcion')} className="input w-full p-2 border rounded"></textarea>
            <input id="youtubeLink" type="text" placeholder="Enlace de Video de YouTube (Opcional)" value={productData.youtubeLink || ''} onChange={(e) => handleFormChange(e, 'youtubeLink')} className="input w-full p-2 border rounded" />
          </fieldset>

          {store.storeType === 'by_order' ? 
            <ByOrderForm productData={productData} handleFormChange={handleFormChange} /> : 
            <InStockForm productData={productData} handleFormChange={handleFormChange} />}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
