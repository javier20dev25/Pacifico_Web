import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StoreEditor from './StoreEditor';
import apiClient from '@/api/axiosConfig';
import useStore from '@/stores/store';

// Mock del apiClient (axios)
vi.mock('@/api/axiosConfig', () => ({
  default: {
    put: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock del hook de datos iniciales
vi.mock('@/hooks/useInitialData', () => ({
  useInitialData: () => ({ isLoading: false, isError: false }),
}));

// Mock del store de Zustand (versión final autocontenida)
vi.mock('@/stores/store', () => {
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
    },
    products: [],
  };

  const mockUseStore = (selector) => {
    const state = { ...mockStoreData, setStoreDetails };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  };

  mockUseStore.getState = () => ({ ...mockStoreData, setStoreDetails });

  return {
    __esModule: true,
    default: mockUseStore,
  };
});

describe('StoreEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.open = vi.fn();
    window.alert = vi.fn();
  });

  it('debería seguir el flujo de edición y llamar a la API al guardar', async () => {
    render(<StoreEditor />);
    
    const { setStoreDetails: setStoreDetailsMock } = useStore.getState();

    // 1. Clic en el botón "Editar"
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    // 2. Cambiar el nombre
    const storeNameInput = screen.getByLabelText(/nombre de la tienda/i);
    const nuevoNombre = 'Nombre Super Actualizado';
    fireEvent.change(storeNameInput, { target: { value: nuevoNombre } });

    // 3. Clic en "Guardar" de la tarjeta
    fireEvent.click(screen.getByRole('button', { name: /^guardar$/i }));

    // 4. Verificar que la acción del store fue llamada
    expect(setStoreDetailsMock).toHaveBeenCalledWith(expect.objectContaining({ nombre: nuevoNombre }));

    // 5. Clic en el botón principal "Guardar y Ver Avance"
    fireEvent.click(screen.getByRole('button', { name: /guardar y ver avance/i }));

    // 6. Verificar la llamada a la API
    await waitFor(() => {
      expect(apiClient.put).toHaveBeenCalledTimes(1);
      expect(apiClient.put).toHaveBeenCalledWith('/user/store-data', expect.objectContaining({ nombre: nuevoNombre }));
    });

    // 7. Verificar la alerta
    expect(window.alert).toHaveBeenCalledWith('Tienda actualizada con éxito!');
  });
});
