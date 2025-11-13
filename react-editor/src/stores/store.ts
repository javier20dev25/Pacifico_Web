import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface StoreDetails {
  uuid?: string;
  storeType: 'by_order' | 'in_stock';
  nombre: string;
  descripcion: string;
  logoUrl: string | null;
  logoFile?: File | null;
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
  shareableUrl: string | null;
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
  peso_lb?: number;
  tags?: string[];
  imageUrl: string | null;
  imageFile?: File | null;
  distributorLink?: string;
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

interface InitialDataPayload {
  storeData?: {
    store?: Partial<StoreDetails>;
    products?: Product[];
  };
  shareableUrl?: string;
}

export interface AppState {
  store: StoreDetails;
  products: Product[];
  cart: CartState;
  isProductModalOpen: boolean;
  editingProductId: string | null;
  setStore: (store: StoreDetails) => void;
  setLogoFile: (file: File | null) => void;
  clearProductImageFiles: () => void;
  setStoreDetails: (details: Partial<StoreDetails>) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  setCart: (cart: CartState) => void;
  openProductModal: (productId?: string) => void;
  closeProductModal: () => void;
  setStoreType: (type: 'by_order' | 'in_stock') => void;
  loadInitialData: (data: InitialDataPayload) => void;
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
      store: {
        uuid: '',
        storeType: 'by_order',
        nombre: 'Mi Tienda',
        descripcion: '',
        logoUrl: null,
        logoFile: null,
        whatsapp: '',
        youtubeLink: '',
        currency: 'USD',
        isLogisticsDual: true,
        airRate: 5.5,
        airMinDays: 7,
        airMaxDays: 15,
        seaRate: 3.0,
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
        shareableUrl: null,
      },
      products: [],
      cart: {
        items: {},
        selectedShipping: 'air',
      },
      isProductModalOpen: false,
      editingProductId: null,
      setStore: (_store) => set({ store: _store }),
      setLogoFile: (_file) => set((state) => ({ store: { ...state.store, logoFile: _file } })),
      clearProductImageFiles: () => set((state) => ({
        products: state.products.map(p => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { imageFile, ...rest } = p;
          return rest;
        })
      })),
      setStoreDetails: (_details) => set((state) => ({ store: { ...state.store, ..._details } })),
      setProducts: (_products) => set({ products: _products }),
      addProduct: (_product) => set((state) => ({ products: [...state.products, _product] })),
      updateProduct: (_productId, _updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.idLocal === productId ? { ...p, ...updates } : p
          ),
        })),
      deleteProduct: (_productId) =>
        set((state) => ({ products: state.products.filter((p) => p.idLocal !== productId) })),
      setCart: (_cart) => set({ cart: _cart }),
      openProductModal: (_productId = null) => set({ isProductModalOpen: true, editingProductId: _productId }),
      closeProductModal: () => set({ isProductModalOpen: false, editingProductId: null }),
      setStoreType: (_type) => set((state) => ({ store: { ...state.store, storeType: _type } })),
      loadInitialData: (_data) => set((state) => {
        const storeData = data.storeData?.store || {};
        const productsData = data.storeData?.products || [];
        const shareableUrl = data.shareableUrl;
        return {
            store: { ...state.store, ...storeData, shareableUrl: shareableUrl },
            products: productsData
        }
      })
    }),
    {
      name: 'pacificoweb-draft',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        store: {
          ...state.store,
          logoFile: undefined,
        },
        products: state.products.map(p => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { imageFile, ...rest } = p;
          return rest;
        })
      }),
    }
  )
);

export default useAppStore;
