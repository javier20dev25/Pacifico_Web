import { selectors } from './config.js';
import { state } from './state.js';
import { launchStore } from './api.js';
import { renderAll } from './render.js';
import { openProductModal, closeProductModal, saveProductFromModal, updateCalculationDisplay } from './productModal.js';

function handleStoreLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        selectors.storeLogoPreview.src = e.target.result;
        selectors.storeLogoPreview.style.display = 'block';
        selectors.storeLogoPlaceholder.style.display = 'none';
        
        state.storeState.store.logoUrl = e.target.result;
        state.storeState.store.logoFile = file;
        renderAll();
    };
    reader.readAsDataURL(file);
}

function handleProductImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        selectors.prodImagePreview.src = e.target.result;
        selectors.prodImagePreview.style.display = 'block';
        selectors.prodImagePlaceholder.style.display = 'none';

        state.activeProductImage = { file: file, url: e.target.result };
    };
    reader.readAsDataURL(file);
}

export function setupEventListeners() {
    try {
        selectors.saveStoreBtn?.addEventListener('click', e => { e.preventDefault(); selectors.launchModal?.classList.remove('hidden'); });
        selectors.cancelLaunchBtn?.addEventListener('click', () => selectors.launchModal?.classList.add('hidden'));
        selectors.confirmLaunchBtn?.addEventListener('click', launchStore);
        selectors.messageOkBtn?.addEventListener('click', () => selectors.messageModal?.classList.add('hidden'));

        const connect = (selector, key, isNum = false, isToggle = false) => {
            if (!selector) return;
            const event = isToggle ? 'change' : 'input';
            selector.addEventListener(event, () => {
                state.storeState.store[key] = isToggle ? selector.checked : (isNum ? (parseFloat(selector.value) || 0) : selector.value);
                if (key === 'isLogisticsDual') {
                    selectors.dualLogisticsContainer.style.display = state.storeState.store.isLogisticsDual ? 'block' : 'none';
                }
                renderAll();
            });
        };

        connect(selectors.storeNameInput, 'nombre');
        connect(selectors.storeDescriptionInput, 'descripcion');
        connect(selectors.storeWhatsappInput, 'whatsapp');
        connect(selectors.storeYoutubeLinkInput, 'youtubeLink');
        connect(selectors.storeCurrency, 'currency');
        connect(selectors.logisticsToggle, 'isLogisticsDual', false, true);
        connect(selectors.airRateInput, 'airRate', true);
        connect(selectors.airMinDaysInput, 'airMinDays', true);
        connect(selectors.airMaxDaysInput, 'airMaxDays', true);
        connect(selectors.seaRateInput, 'seaRate', true);
        connect(selectors.seaMinDaysInput, 'seaMinDays', true);
        connect(selectors.seaMaxDaysInput, 'seaMaxDays', true);

        // Conectar delivery global
        connect(selectors.storeDeliveryType, 'delivery_type');
        connect(selectors.storeDeliveryFixedCost, 'delivery_fixed_cost', true);
        connect(selectors.storeDeliveryRangeStart, 'delivery_range_start', true);
        connect(selectors.storeDeliveryRangeEnd, 'delivery_range_end', true);
        connect(selectors.storeDeliveryNote, 'delivery_note');

        // --- Conectar nueva sección de Pagos ---

        // 1. Conectar toggles y campos simples
        connect(selectors.acceptsFullPayment, 'accepts_full_payment', false, true);
        connect(selectors.installmentType, 'installment_type');
        connect(selectors.maxInstallments, 'max_installments', true);

        // 2. Conectar checkboxes de métodos de pago usando delegación de eventos
        selectors.paymentMethodsContainer?.addEventListener('change', (e) => {
            if (e.target.classList.contains('payment-method-check')) {
                const key = e.target.dataset.paymentKey;
                if (key) {
                    if (!state.storeState.store.payment_methods) {
                        state.storeState.store.payment_methods = {};
                    }
                    state.storeState.store.payment_methods[key] = e.target.checked;
                    // No es necesario renderizar todo aquí, es un cambio menor
                    console.log('Payment methods updated:', state.storeState.store.payment_methods);
                }
            }
        });

        // 3. Conectar checkboxes de opciones de anticipo
        ['50', '25', '10'].forEach(val => {
            const checkbox = selectors[`advance${val}`];
            checkbox?.addEventListener('change', () => {
                if (!state.storeState.store.advance_options) {
                    state.storeState.store.advance_options = {};
                }
                state.storeState.store.advance_options[val] = checkbox.checked;
                console.log('Advance options updated:', state.storeState.store.advance_options);
            });
        });

        // 4. Conectar toggles con lógica de visibilidad
        selectors.acceptsAdvancePayment?.addEventListener('change', () => {
            const isChecked = selectors.acceptsAdvancePayment.checked;
            state.storeState.store.accepts_advance_payment = isChecked;
            selectors.advancePaymentOptions.style.display = isChecked ? 'block' : 'none';
            renderAll();
        });

        selectors.acceptsInstallments?.addEventListener('change', () => {
            const isChecked = selectors.acceptsInstallments.checked;
            state.storeState.store.accepts_installments = isChecked;
            selectors.installmentsOptions.style.display = isChecked ? 'block' : 'none';
            renderAll();
        });

        // --- Carrito Event Listeners ---
        selectors.cartBubble?.addEventListener('click', () => {
            selectors.cartModal?.classList.remove('hidden');
            // Pequeño delay para que la transición de CSS se aplique después de que el display cambie
            setTimeout(() => {
                selectors.cartPanel?.classList.remove('translate-x-full');
            }, 10);
        });

        selectors.cartModal?.addEventListener('click', (e) => {
            // Cerrar si se hace clic en el fondo o en el botón de cerrar
            if (e.target.id === 'cartModal' || e.target.id === 'closeCartBtn' || e.target.closest('#closeCartBtn')) {
                selectors.cartPanel?.classList.add('translate-x-full');
                // Ocultar el modal después de que la transición termine
                setTimeout(() => {
                    selectors.cartModal?.classList.add('hidden');
                }, 300);
            }
        });


        selectors.storeLogoInput?.addEventListener('change', handleStoreLogoUpload);
        selectors.addProductBtn?.addEventListener('click', () => openProductModal(null));
        selectors.saveProductBtn?.addEventListener('click', saveProductFromModal);
        selectors.cancelProductBtn?.addEventListener('click', closeProductModal);
        selectors.prodImageInput?.addEventListener('change', handleProductImageUpload);

        ['prodInitialCost', 'prodWeight', 'prodMarginValue', 'prodMarginType'].forEach(id => selectors[id]?.addEventListener('input', updateCalculationDisplay));
        
        selectors.prodStockMode?.addEventListener('change', () => {
            const val = selectors.prodStockMode.value;
            selectors.madeToOrderContainer.style.display = (val === 'made' || val === 'both') ? 'block' : 'none';
        });
    } catch (error) {
        console.error("Error al adjuntar event listeners:", error);
        showMessage("Ocurrió un error crítico al inicializar la interactividad de la página.");
    }
}
