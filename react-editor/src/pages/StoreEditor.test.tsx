import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StoreEditor from './StoreEditor';
import apiClient from '@/api/axiosConfig';
import useStore, { availablePaymentMethods, AppState } from '@/stores/store';// Mock del apiClient (axios)
vi.mock('@/api/axiosConfig', () => ({
  default: {
    put: vi.fn(),
    post: vi.fn(),
  },
}));// Mock del hook de datos iniciales
vi.mock('@/hooks/useInitialData', () => ({
  useInitialData: () => ({ isLoading: false, isError: false }),
}));// Mock del store de Zustand (versión final autocontenida)
vi.mock('@/stores/store', async (importOriginal) => {
  const actual = await importOriginal(); // Import actual module to get availablePaymentMethods

  const setStoreDetails = vi.fn();
  const mockStoreData = {
    store: {
      uuid: '123-abc',
      nombre: 'Mi Tienda de Prueba',
      slug: 'mi-tienda-de-prueba',
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
    },
    products: [],
  };

  const completeMockState: AppState = {
    ...mockStoreData,
    cart: { items: {}, selectedShipping: 'air' },
    isProductModalOpen: false,
    editingProductId: null,
    setStore: vi.fn(),
    setLogoFile: vi.fn(),
    clearProductImageFiles: vi.fn(),
    setStoreDetails: setStoreDetails,
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
    <T>(selector: (state: AppState) => T): T;
    getState: () => AppState;
  }

  const mockUseStore = ((selector: (state: AppState) => unknown): unknown => {
    return selector(completeMockState);
  }) as MockUseStore;

  mockUseStore.getState = () => completeMockState;

  return {
    __esModule: true,
    default: mockUseStore,
    availablePaymentMethods: (actual as any).availablePaymentMethods, // Use the actual availablePaymentMethods
  };
});describe('StoreEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    window.alert = vi.fn();
  });  it('debería seguir el flujo de edición y llamar a la API al guardar', async () => {
    render(<StoreEditor />);
    
    const { setStoreDetails: setStoreDetailsMock } = useStore.getState();    // 2. Cambiar el nombre
    const storeNameInput = screen.getByLabelText(/nombre de la tienda/i);
    const nuevoNombre = 'Nombre Super Actualizado';
    fireEvent.change(storeNameInput, { target: { value: nuevoNombre } });    // 3. Clic en "Guardar" de la tarjeta
    fireEvent.click(screen.getByRole('button', { name: /guardar y publicar cambios/i }));    // 4. Verificar que la acción del store fue llamada
    expect(setStoreDetailsMock).toHaveBeenCalledWith(expect.objectContaining({ nombre: nuevoNombre }));    // 5. Clic en el botón principal "Guardar y Ver Avance"
    fireEvent.click(screen.getByRole('button', { name: /guardar y ver avance/i }));    // 6. Verificar la llamada a la API
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledTimes(1);
      expect(apiClient.put).toHaveBeenCalledWith('/user/store-data', expect.objectContaining({ nombre: nuevoNombre }));
    });    // 7. Verificar la alerta
    expect(window.alert).toHaveBeenCalledWith('Tienda actualizada con éxito!');
  });
});