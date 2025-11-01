import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Interfaces para tipado seguro
export interface StoreDetails {
  uuid?: string;
  storeType: 'by_order' | 'in_stock';
  nombre: string;
  descripcion: string;
  logoUrl?: string;
  logoFile?: File;
  whatsapp?: string;
  youtubeLink?: string;
  currency: 'USD' | 'NIO';
  isLogisticsDual: boolean;
  airRate: number;
  airMinDays: number;
  airMaxDays: number;
  seaRate: number;
  seaMinDays: number;
  seaMaxDays: number;
  delivery_type: 'no' | 'fixed' | 'range' | 'included';
  delivery_fixed_cost: number;
  delivery_range_start: number;
  delivery_range_end: number;
  delivery_note: string;
  payment_methods: Record<string, boolean>;
  accepts_full_payment: boolean;
  accepts_advance_payment: boolean;
  advance_options: Record<string, boolean>;
  accepts_installments: boolean;
  installment_options: { type: string, max: number }[];
  slug?: string;
  shareableUrl?: string; // <--- AÑADIDO
  chatbot_enabled?: boolean;
}

export interface Product {
  idLocal: string;
  nombre: string;
  descripcion: string;
  youtubeLink?: string;
  precio_base?: number;
  impuesto_porcentaje?: number;
  impuestos_incluidos?: boolean;
  costo_base_final?: number;
  margen_valor?: number;
  margen_tipo?: 'fixed' | 'percent';
  precio_final_aereo?: number;
  precio_final_maritimo?: number;
  precio_final_stock?: number; // Nuevo campo para el precio final de productos en stock
  peso_lb?: number;
  tags?: string[];
  imageUrl?: string | null;
  imageFile?: File | null;
}

export interface CartItem {
  quantity: number;
}

export interface CartState {
  items: Record<string, CartItem>;
  selectedShipping: 'air' | 'sea';
  selectedPaymentMethod?: string;
  selectedAdvance?: string;
  selectedInstallments?: number;
}

interface AppState {
  store: StoreDetails;
  products: Product[];
  cart: CartState;
  isProductModalOpen: boolean;
  editingProductId: string | null;
  setStoreDetails: (details: Partial<StoreDetails>) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  setCart: (cart: CartState) => void;
  openProductModal: (productId?: string | null) => void;
  closeProductModal: () => void;
  setStoreType: (type: 'by_order' | 'in_stock') => void;
  loadInitialData: (data: any) => void; // <--- Tipo de payload flexibilizado
  setChatbotEnabled: (enabled: boolean) => void;
}

export const availablePaymentMethods: Record<string, string> = {
    'banpro': 'Banpro',
    'lafise': 'LAFISE',
    'bac': 'BAC',
    'ficohsa': 'Ficohsa',
    'billetera_movil': 'Billetera Móvil',
    'envio_veloz': 'Envío Veloz',
    'paypal': 'PayPal',
    'payoneer': 'Payoneer',
    'western_union': 'Western Union',
    'efectivo': 'Efectivo'
};

const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Estado Inicial
      store: {
        storeType: 'by_order',
        nombre: 'Mi Tienda',
        descripcion: '',
        currency: 'USD',
        isLogisticsDual: true,
        airRate: 5.5,
        seaRate: 3.0,
        airMinDays: 7,
        airMaxDays: 15,
        seaMinDays: 30,
        seaMaxDays: 45,
        delivery_type: 'no',
        delivery_fixed_cost: 0,
        delivery_range_start: 0,
        delivery_range_end: 0,
        delivery_note: '',
        payment_methods: {},
        accepts_full_payment: true,
        accepts_advance_payment: false,
        advance_options: { '50': false, '25': false, '10': false },
        accepts_installments: false,
        installment_options: [],
        chatbot_enabled: false,
      },
      products: [],
      cart: {
        items: {},
        selectedShipping: 'air',
      },
      isProductModalOpen: false,
      editingProductId: null,

      // Acciones para modificar el estado
      setStoreDetails: (details) => set((state) => ({ store: { ...state.store, ...details } })),
      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (productId, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.idLocal === productId ? { ...p, ...updates } : p
          ),
        })),
      deleteProduct: (productId) =>
        set((state) => ({ products: state.products.filter((p) => p.idLocal !== productId) })),
      setCart: (cart) => set({ cart }),
      openProductModal: (productId = null) => set({ isProductModalOpen: true, editingProductId: productId }),
      closeProductModal: () => set({ isProductModalOpen: false, editingProductId: null }),
      setStoreType: (type) => set((state) => ({ store: { ...state.store, storeType: type } })), 
      setChatbotEnabled: (enabled) => set((state) => ({ store: { ...state.store, chatbot_enabled: enabled } })), 

      // Lógica de carga de datos actualizada
      loadInitialData: (data) => set((state) => {
        const storeData = data.storeData?.store || {};
        const productsData = data.storeData?.products || [];
        const shareableUrl = data.shareableUrl; // <--- Extraer URL
        const chatbot_enabled = data.chatbot_enabled; // Extraer el nuevo flag
        
        return {
            store: { 
              ...state.store, 
              ...storeData, 
              shareableUrl: shareableUrl,
              chatbot_enabled: chatbot_enabled, // Guardar el flag en el estado
            },
            products: productsData
        }
      })
    }),
    {
      name: 'pacificoweb-draft',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useAppStore;
