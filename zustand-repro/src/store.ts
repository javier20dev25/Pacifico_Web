import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  idLocal: string;
  nombre: string;
  descripcion: string;
  youtubeLink?: string | null;
  imageUrl?: string | null;
  distributorLink?: string | null;
  imageFile?: File | null;
}

type AppState = {
  products: Product[];
  clearProductImageFiles: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      products: [
        { idLocal: '1', nombre: 'X', descripcion: 'X' } as Product
      ],
      clearProductImageFiles: () =>
        set((state) => ({
          products: state.products.map((p) => ({
            ...p,
            imageFile: null,
            imageUrl: p.imageUrl ?? null,
            youtubeLink: p.youtubeLink ?? null,
            distributorLink: p.distributorLink ?? null
          }))
        }))
    }),
    { name: 'repro' }
  )
);
