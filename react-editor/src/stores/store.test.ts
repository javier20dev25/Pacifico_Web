import { describe, it, expect, beforeEach } from 'vitest';
import useAppStore, { type Product } from './store';

// Reset store before each test
beforeEach(() => {
  // Vitest and Zustand can be tricky. Resetting state directly is the simplest way.
  useAppStore.setState({
    products: [],
    store: useAppStore.getState().store, // Keep store details
    cart: useAppStore.getState().cart, // Keep cart
    isProductModalOpen: false,
    editingProductId: null,
  });
});

describe('Zustand Store: Product Management', () => {
  it('should start with an empty product list', () => {
    const products = useAppStore.getState().products;
    expect(products).toBeInstanceOf(Array);
    expect(products.length).toBe(0);
  });

  it('should add a product to the list using addProduct', () => {
    const newProduct: Product = {
      idLocal: 'prod_123',
      nombre: 'Test Product',
      descripcion: 'A great product',
      imageUrl: null,
      // All other fields are optional as per the Product interface
    };

    // Get the addProduct action from the store
    const addProductAction = useAppStore.getState().addProduct;

    // Call the action to add the new product
    addProductAction(newProduct);

    // Get the new state after the action
    const updatedProducts = useAppStore.getState().products;

    // Assertions to verify the result
    expect(updatedProducts.length).toBe(1);
    expect(updatedProducts[0]).toEqual(newProduct);
    expect(updatedProducts[0].nombre).toBe('Test Product');
  });

  it('should delete a product from the list using deleteProduct', () => {
    const product1: Product = { idLocal: 'p1', nombre: 'P1', descripcion: 'd1', imageUrl: null };
    const product2: Product = { idLocal: 'p2', nombre: 'P2', descripcion: 'd2', imageUrl: null };

    // Setup initial state with two products
    useAppStore.getState().setProducts([product1, product2]);
    expect(useAppStore.getState().products.length).toBe(2);

    // Get and call the delete action
    const deleteProductAction = useAppStore.getState().deleteProduct;
    deleteProductAction('p1'); // Delete the first product

    // Get the new state
    const updatedProducts = useAppStore.getState().products;

    // Assertions to verify the result
    expect(updatedProducts.length).toBe(1);
    expect(updatedProducts[0].idLocal).toBe('p2');
  });

   it('should update a product in the list using updateProduct', () => {
    const product1: Product = { idLocal: 'p1', nombre: 'Original Name', descripcion: 'd1', imageUrl: null };
    
    // Setup initial state
    useAppStore.getState().setProducts([product1]);
    expect(useAppStore.getState().products[0].nombre).toBe('Original Name');

    // Get and call the update action
    const updateProductAction = useAppStore.getState().updateProduct;
    updateProductAction('p1', { nombre: 'Updated Name' });

    // Get the new state
    const updatedProducts = useAppStore.getState().products;

    // Assertions
    expect(updatedProducts.length).toBe(1);
    expect(updatedProducts[0].nombre).toBe('Updated Name');
    expect(updatedProducts[0].descripcion).toBe('d1'); // Ensure other fields are untouched
  });
});
