import { state } from './state.js';
import { showMessage, showYouTubeVideo } from './utils.js';
import { renderAll } from './render.js';
import { setupEventListeners } from './events.js';
import { openProductModal, deleteProduct } from './productModal.js';
import { addToCart, updateQuantity, deleteFromCart } from './cart.js';
import { showProductQuickView, handleQuickViewQuantityChange, handleQuickViewAddToCart } from './quickView.js';

document.addEventListener('DOMContentLoaded', () => {
    
    async function initializeEditor() {
        if (!state.token) {
            showMessage("No estás autenticado. Por favor, inicia sesión de nuevo.");
            // Consider disabling save buttons here if needed
            return;
        }
        try {
            const response = await fetch('/api/user/store-data', { headers: { 'Authorization': `Bearer ${state.token}` } });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'No se pudieron cargar los datos.');
            }
            const serverData = await response.json();
            
            state.storeState = {
                store: { 
                    name: 'Mi Tienda', 
                    description: '', 
                    isLogisticsDual: true, 
                    airRate: 5.5, 
                    seaRate: 3.0, 
                    currency: 'USD',
                    delivery_type: 'no',
                    delivery_fixed_cost: 0,
                    delivery_range_start: 0,
                    delivery_range_end: 0,
                    delivery_note: '',
                    // Payment Config Defaults
                    payment_methods: {},
                    accepts_full_payment: true,
                    accepts_advance_payment: false,
                    advance_options: { '50': false, '25': false, '10': false },
                    accepts_installments: false,
                    installment_type: 'monthly',
                    max_installments: 3,
                    ...(serverData.storeData?.store || {}) 
                },
                products: serverData.storeData?.products || []
            };

            state.storeState.products.forEach((p, i) => { p.idLocal = p.idLocal || `prod_${Date.now()}_${i}`; });
            
            // Adjuntar funciones al objeto window para que sean accesibles desde el HTML
            window.openProductModal = openProductModal;
            window.deleteProduct = deleteProduct;
            window.showYouTubeVideo = showYouTubeVideo;
            window.addToCart = addToCart;
            window.updateQuantity = updateQuantity;
            window.showProductQuickView = showProductQuickView;
            window.handleQuickViewQuantityChange = handleQuickViewQuantityChange;
            window.handleQuickViewAddToCart = handleQuickViewAddToCart;
            window.deleteFromCart = deleteFromCart;

            renderAll();
            setupEventListeners();

        } catch (error) {
            showMessage(error.message);
            console.error("Error inicializando:", error);
        }
    }

    initializeEditor();
});
