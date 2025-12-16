import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ExtraCost {
  enabled: boolean;
  value: number | string;
  type: 'fixed_total' | 'fixed_per_product' | 'percentage_total' | 'percentage_per_product';
  description: string;
  currency: 'USD';
}

export interface StoreDetails {
  uuid?: string;
  storeType: 'by_order' | 'in_stock';
  nombre: string;
  descripcion: string;
  logoUrl: string | null;
  logoFile?: File | null;
  whatsapp?: string;
  video_url?: string;
  currency: 'USD' | 'NIO';
  isLogisticsDual: boolean;
  airRate: number | string;
  airMinDays: number | string;
  airMaxDays: number | string;
  seaRate: number | string;
  seaMinDays: number | string;
  seaMaxDays: number | string;
  delivery_type: 'no' | 'fixed' | 'range' | 'included';
  delivery_fixed_cost: number | string;
  delivery_range_start: number | string;
  delivery_range_end: number | string;
  delivery_note: string;
  acceptsCash: boolean;
  acceptsTransfer: boolean;
  transferDetails: string;
  paypalLink: string;
  stripeLink: string;
  accepts_full_payment: boolean;
  accepts_advance_payment: boolean;
  advance_options: Record<string, boolean>;
  accepts_installments: boolean;
  installment_options: { type: string, max: number }[];
  shareableUrl: string | null | undefined;
  extraCost: ExtraCost;
  planName?: string;
  productLimit?: number;
}

export interface Product {
  idLocal: string;
  nombre: string;
  descripcion: string;
  youtubeLink?: string;
  precio_base?: number | string;
  impuesto_porcentaje?: number | string;
  impuestos_incluidos?: boolean;
  costo_base_final?: number;
  margen_valor?: number | string;
  margen_tipo?: 'fixed' | 'percent';
  precio_final_aereo?: number;
  precio_final_maritimo?: number;
  peso_lb?: number | string;
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
  isRielModalOpen: boolean;
  isSuccessModalOpen: boolean;
  successModalMessage: string;
  setStore: (store: StoreDetails) => void;
  setLogoFile: (file: File | null) => void;
  clearProductImageFiles: () => void;
  setStoreDetails: (details: Partial<StoreDetails>) => void;
  setPlanInfo: (planInfo: { plan: string; product_limit: number }) => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  setCart: (cart: CartState) => void;
  openProductModal: (productId?: string | null) => void;
  closeProductModal: () => void;
  openRielModal: () => void;
  closeRielModal: () => void;
  openSuccessModal: (message: string) => void;
  closeSuccessModal: () => void;
  setStoreType: (type: 'by_order' | 'in_stock') => void;
  loadInitialData: (data: InitialDataPayload) => void;
}

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
        video_url: '',
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
        acceptsCash: true,
        acceptsTransfer: false,
        transferDetails: '',
        paypalLink: '',
        stripeLink: '',
        accepts_full_payment: true,
        accepts_advance_payment: false,
        advance_options: { '50': false, '25': false, '10': false },
        accepts_installments: false,
        installment_options: [],
        shareableUrl: null,
        extraCost: {
          enabled: false,
          value: 0,
          type: 'fixed_total',
          description: '',
          currency: 'USD',
        },
        planName: 'emprendedor', // Valor por defecto
        productLimit: 20, // Valor por defecto
      },
      products: [],
      cart: {
        items: {},
        selectedShipping: 'air',
      },
      isProductModalOpen: false,
      editingProductId: null,
      isRielModalOpen: false,
      isSuccessModalOpen: false,
      successModalMessage: '',
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
      setPlanInfo: (planInfo) => set((state) => ({
        store: {
          ...state.store,
          planName: planInfo.plan,
          productLimit: planInfo.product_limit,
        }
      })),
      setProducts: (_products) => set({ products: _products }),
      addProduct: (_product) => set((state) => ({ products: [...state.products, _product] })),
      updateProduct: (_productId, _updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.idLocal === _productId ? { ...p, ..._updates } : p
          ),
        })),
      deleteProduct: (_productId) =>
        set((state) => ({ products: state.products.filter((p) => p.idLocal !== _productId) })),
      setCart: (_cart) => set({ cart: _cart }),
      openProductModal: (_productId = null) => set({ isProductModalOpen: true, editingProductId: _productId }),
      closeProductModal: () => set({ isProductModalOpen: false, editingProductId: null }),
      openRielModal: () => set({ isRielModalOpen: true }),
      closeRielModal: () => set({ isRielModalOpen: false }),
      openSuccessModal: (message) => set({ isSuccessModalOpen: true, successModalMessage: message }),
      closeSuccessModal: () => set({ isSuccessModalOpen: false, successModalMessage: '' }),
      setStoreType: (_type) => set((state) => ({ store: { ...state.store, storeType: _type } })),
      loadInitialData: (_data) => set((state) => {
        const storeData = _data.storeData?.store || {};
        const productsData = _data.storeData?.products || [];
        const shareableUrl = _data.shareableUrl;
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
