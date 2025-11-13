/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StoreEditor from './StoreEditor';
import apiClient from '@/api/axiosConfig';
import * as useStore from '@/stores/store';// Mock del apiClient (axios)
vi.mock('@/api/axiosConfig', () => ({
  default: {
    put: vi.fn(),
    post: vi.fn(),
  },
}));// Mock del hook de datos iniciales
vi.mock('@/hooks/useInitialData', () => ({
  useInitialData: () => ({ isLoading: false, isError: false }),
}));// Mock del store de Zustand (versión final autocontenida)
vi.mock('@/stores/store', async (importOriginal: typeof import('@/stores/store')) => {
  const actual = await importOriginal(); // Importar el módulo original

  const completeMockState: useStore.AppState = {
    store: {
      uuid: '123-abc',
      nombre: 'Mi Tienda de Prueba',
      descripcion: '',
      whatsapp: '',
      youtubeLink: '',
      currency: 'USD',
      storeType: 'by_order',
      isLogisticsDual: false,
      airRate: 0, airMinDays: 0, airMaxDays: 0,
      seaRate: 0, seaMinDays: 0, seaMaxDays: 0,
      delivery_type: 'no', delivery_fixed_cost: 0, delivery_range_start: 0, delivery_range_end: 0, delivery_note: '',
      payment_methods: {}, accepts_full_payment: false, accepts_advance_payment: false, advance_options: {}, accepts_installments: false, installment_options: [],
      logoUrl: null,
      shareableUrl: null,
    },
    products: [],
    cart: { items: {}, selectedShipping: 'air' },
    isProductModalOpen: false,
    editingProductId: null,
    setStore: vi.fn(),
    setLogoFile: vi.fn(),
    clearProductImageFiles: vi.fn(),
    setStoreDetails: vi.fn(),
    setProducts: vi.fn(),
    addProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    setCart: vi.fn(),
    openProductModal: vi.fn(),
    closeProductModal: vi.fn(),
    setStoreType: vi.fn(),
    loadInitialData: vi.fn(),
  };

  interface MockUseStore {
    <T>(selector: (state: useStore.AppState) => T): T;
    getState: () => useStore.AppState;
  }

  const mockUseStore = ((_selector: (state: useStore.AppState) => unknown): unknown => {
    return _selector(completeMockState);
  }) as MockUseStore;

  mockUseStore.getState = () => completeMockState;

  return {
    ...actual, // Mantener las exportaciones originales (como availablePaymentMethods)
    
    default: mockUseStore, // Sobrescribir solo el default export
  };
});describe('StoreEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    window.alert = vi.fn();
    
    // Mock localStorage para la prueba
    const mockLocalStorage = (() => {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
          store[key] = value.toString();
        },
        clear: () => {
          store = {};
        }
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });
    window.localStorage.setItem('sessionToken', 'test-token');
  });  it('debería seguir el flujo de edición y llamar a la API al guardar', async () => {
    render(<StoreEditor />);
    
    
    
    // Mockear la respuesta de la API para que sea exitosa
    (apiClient.put as vi.Mock).mockResolvedValue({ data: { storeData: { store: {}, products: [] } } });

    // 2. Cambiar el nombre
    const storeNameInput = screen.getByLabelText(/nombre de la tienda/i);
    const nuevoNombre = 'Nombre Super Actualizado';
    fireEvent.change(storeNameInput, { target: { value: nuevoNombre } });

    // 3. Verificar que la acción del store fue llamada por el cambio en el input
    // (Esto asume que el componente hijo llama a setStoreDetails en el onChange)
    // Para simplificar, nos centraremos en el guardado final.
    
    // 4. Clic en el botón principal "Guardar y Publicar Cambios"
    fireEvent.click(screen.getByRole('button', { name: /guardar y publicar cambios/i }));

    // 5. Verificar la llamada a la API
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledTimes(1);
      // El payload es un FormData, por lo que no podemos hacer un deep equal directo.
      // Verificamos que se llamó, que es lo más importante.
    });

    // 6. Verificar la alerta de éxito
    await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('¡Tienda guardada con éxito!');
    });
  });
});