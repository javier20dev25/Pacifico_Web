// src/stores/rielStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import apiClient from '@/api/axiosConfig';

export interface RielProduct {
  id: string; // idLocal en el frontend
  name: string;
  price: number | string;
  currency: 'USD' | 'NIO';
  imageFile?: File | null;
  imagePreview?: string | null;
  imageUrl?: string | null;
}

export interface RielStoreState {
  storeName: string;
  whatsapp: string;
  products: RielProduct[];
  shareableUrl: string | null;
  isSuccessModalOpen: boolean;
  successModalMessage: string;
  setStoreName: (name: string) => void;
  setWhatsapp: (phone: string) => void;
  addProduct: () => void;
  updateProduct: (productId: string, updates: Partial<RielProduct>) => void;
  removeProduct: (productId: string) => void;
  setProductImage: (productId: string, file: File) => void;
  saveStore: () => Promise<void>;
  loadRielData: () => Promise<void>;
  openSuccessModal: (message: string) => void;
  closeSuccessModal: () => void;
}

const useRielStore = create<RielStoreState>((set, get) => ({
  storeName: 'Mi Tienda Riel',
  whatsapp: '',
  products: [],
  shareableUrl: null,
  isSuccessModalOpen: false,
  successModalMessage: '',
  setStoreName: (name) => set({ storeName: name }),
  setWhatsapp: (phone) => set({ whatsapp: phone }),
  addProduct: () => {
    console.log('Acción addProduct llamada'); // <-- PUNTO DE DEPURACIÓN
    const products = get().products;
    if (products.length >= 15) {
      alert('Has alcanzado el límite de 15 productos para el plan Riel.');
      return;
    }
    const newProduct: RielProduct = {
      id: uuidv4(),
      name: '',
      price: '',
      currency: 'USD',
    };
    set({ products: [...products, newProduct] });
  },
  updateProduct: (productId, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p
      ),
    })),
  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    })),
  setProductImage: (productId, file) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, imageFile: file, imagePreview: reader.result as string } : p
        ),
      }));
    };
    reader.readAsDataURL(file);
  },
  
  // FUNCIÓN PARA CARGAR DATOS
  loadRielData: async () => {
    try {
      const { data } = await apiClient.get('/user/store-data');
      if (data && data.storeData && data.storeData.store) {
        const { store, products } = data.storeData;
        
        // Mapear productos del backend al formato del frontend
        const mappedProducts = (products || []).map((p: any) => ({
          id: p.idLocal || uuidv4(),
          name: p.nombre,
          price: p.precio_base,
          currency: p.currency || 'USD',
          imageUrl: p.imageUrl,
          imageFile: null,
          imagePreview: p.imageUrl,
        }));

        set({
          storeName: store.nombre || 'Mi Tienda Riel',
          whatsapp: store.whatsapp || '',
          products: mappedProducts,
          shareableUrl: data.shareableUrl || null,
        });
      }
    } catch (error) {
      console.error("Error al cargar los datos de la tienda Riel:", error);
      // Opcional: podrías setear un estado de error aquí
    }
  },

  // FUNCIÓN PARA GUARDAR DATOS
  saveStore: async () => {
    const state = get();
    const productsToUpload = state.products.filter(p => p.imageFile);
    const uploadedImagesMap = new Map<string, string>();

    if (productsToUpload.length > 0) {
      const uploadPromises = productsToUpload.map(product => {
        const formData = new FormData();
        formData.append('image', product.imageFile!);
        return axios.post('/api/uploads/upload-image', formData).then(response => ({
          id: product.id,
          url: response.data.url,
        }));
      });
      const uploadedImages = await Promise.all(uploadPromises);
      uploadedImages.forEach(img => uploadedImagesMap.set(img.id, img.url));
    }

    const finalProducts = state.products.map(p => ({
      idLocal: p.id,
      nombre: p.name,
      precio_base: p.price,
      currency: p.currency,
      imageUrl: uploadedImagesMap.get(p.id) || p.imageUrl || null,
      descripcion: '',
      peso_lb: 0,
    }));

    const finalStoreData = {
      nombre: state.storeName,
      whatsapp: state.whatsapp,
      storeType: 'riel',
      currency: 'USD',
      descripcion: `Tienda Riel de ${state.storeName}`,
    };

    const payload = {
      storeData: { store: finalStoreData, products: finalProducts },
      launch: true,
    };

    const response = await apiClient.put('/user/store-data', payload);
    if (response.data && response.data.shareableUrl) {
        set({ shareableUrl: response.data.shareableUrl });
    }
  },

  // Acciones para el modal de éxito
  openSuccessModal: (message: string) => set({ isSuccessModalOpen: true, successModalMessage: message }),
  closeSuccessModal: () => set({ isSuccessModalOpen: false, successModalMessage: '' }),
}));

export default useRielStore;