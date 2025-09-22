import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables provided by the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let userId;

async function initFirebase() {
    try {
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
            console.log('Signed in with custom token.');
        } else {
            await signInAnonymously(auth);
            console.log('Signed in anonymously.');
        }
        userId = auth.currentUser.uid;
        document.getElementById('user-id').textContent = `ID de usuario: ${userId}`;
        startListening();
    } catch (error) {
        console.error("Firebase Auth error:", error);
    }
}

function startListening() {
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'stores', 'main_store');
    onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            renderStore(data);
            localStorage.setItem('storeData', JSON.stringify(data));
        } else {
            console.log("No data found, using default.");
            renderStore(initialStoreData);
            localStorage.setItem('storeData', JSON.stringify(initialStoreData));
        }
    }, (error) => {
        console.error("Firestore error:", error);
    });
}

async function saveStoreData() {
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    const docRef = doc(db, 'artifacts', appId, 'users', userId, 'stores', 'main_store');
    try {
        await setDoc(docRef, storeData);
        console.log("Store data saved to Firestore.");
    } catch (error) {
        console.error("Error saving data:", error);
    }
}

// --- Store Data and State Management ---
const initialStoreData = {
    logo: "https://placehold.co/100x100/e0e5ec/6366f1?text=Logo",
    storeName: "Tu Tienda Aquí",
    description: "Descripción de tu negocio. ¡Cámbiala en modo de edición!",
    youtubeLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    whatsappNumber: "88378547",
    products: [
        { id: 'prod1', name: 'Producto 1', price: 150, currency: 'C$', weight: 0.5, type: 'disponible', shipping: 'no-incluido', shippingCost: 20, shippingType: 'ambos', minQuantity: 1, image: 'https://placehold.co/400x300/e0e5ec/6366f1?text=Producto' },
        { id: 'prod2', name: 'Producto 2', price: 15, currency: '$', weight: 1.2, type: 'encargo', shipping: 'incluido', shippingCost: 0, shippingType: 'aereo', minQuantity: 1, image: 'https://placehold.co/400x300/e0e5ec/6366f1?text=Producto' }
    ]
};

let cart = {};
let isEditing = false;
const maxProducts = 15;

// --- UI Rendering Functions ---
function renderStore(data) {
    document.getElementById('logo-img').src = data.logo;
    document.getElementById('store-name').textContent = data.storeName;
    document.getElementById('store-description').textContent = data.description;
    document.getElementById('youtube-link').value = data.youtubeLink;
    document.getElementById('youtube-iframe').src = data.youtubeLink.includes("youtube.com") ? data.youtubeLink.replace("watch?v=", "embed/") : data.youtubeLink;
    document.getElementById('whatsapp-number').value = data.whatsappNumber;
    renderProducts(data.products);
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    products.forEach(product => {
        const isPorEncargo = product.type === 'encargo';
        const isShippingIncluded = product.shipping === 'incluido';
        container.innerHTML += `
            <div class="p-6 neomorphic-card flex flex-col relative product-card" data-id="${product.id}">
                ${isEditing ? `
                    <button onclick="removeProduct('${product.id}')" class="absolute top-2 right-2 text-red-500 hover:text-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                    </button>
                ` : ''}
                <div class="relative w-full h-48 mb-4">
                    <img src="${product.image || 'https://placehold.co/400x300/e0e5ec/6366f1?text=Producto'}" alt="${product.name}" class="rounded-lg object-cover h-full w-full neomorphic-card p-2">
                    ${isEditing ? `
                        <input type="file" id="file-upload-${product.id}" class="hidden" onchange="handleProductImageUpload(event, '${product.id}')">
                        <label for="file-upload-${product.id}" class="absolute bottom-0 right-0 p-2 rounded-full neomorphic-btn cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-camera"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5L14.5 4z"/><circle cx="12" cy="13" r="3"/></svg>
                        </label>
                    ` : ''}
                </div>
                <div class="font-semibold text-lg mb-2">
                    ${isEditing ? `<input type="text" value="${product.name}" oninput="updateProduct('${product.id}', 'name', this.value)" class="neomorphic-input font-semibold text-lg w-full">` : product.name}
                </div>
                <div class="font-bold text-xl text-indigo-600 mb-4">
                    ${isEditing ? `
                        <input type="number" value="${product.price}" oninput="updateProduct('${product.id}', 'price', this.value)" class="neomorphic-input text-lg w-20">
                        <select onchange="updateProduct('${product.id}', 'currency', this.value)" class="neomorphic-input ml-2">
                            <option value="C$" ${product.currency === 'C$' ? 'selected' : ''}>C$</option>
                            <option value="$" ${product.currency === '$' ? 'selected' : ''}>$</option>
                        </select>
                    ` : `${product.currency} ${product.price}`}
                </div>
                <div class="text-sm text-gray-500 mb-2">
                    ${isEditing ? `
                        <label class="block mb-1">Peso (kg):</label>
                        <input type="number" value="${product.weight}" step="0.1" oninput="updateProduct('${product.id}', 'weight', this.value)" class="neomorphic-input text-sm w-20">
                    ` : `Peso estimado: ${product.weight}kg`}
                </div>
                ${isEditing ? `
                    <div class="text-sm text-gray-500 mb-2">
                        <label class="block mb-1">Tipo de envío:</label>
                        <select onchange="updateProduct('${product.id}', 'shippingType', this.value)" class="neomorphic-input">
                            <option value="aereo" ${product.shippingType === 'aereo' ? 'selected' : ''}>Aéreo</option>
                            <option value="maritimo" ${product.shippingType === 'maritimo' ? 'selected' : ''}>Marítimo</option>
                            <option value="ambos" ${product.shippingType === 'ambos' ? 'selected' : ''}>Ambos</option>
                        </select>
                    </div>
                ` : `
                    <div class="text-sm text-gray-500 mb-2">
                        <span class="font-semibold">Envío:</span> ${product.shippingType}
                    </div>
                `}

                <button onclick="addToCart('${product.id}')" class="mt-auto neomorphic-btn text-gray-700 neomorphic-cart-btn">
                    Añadir al Carrito
                </button>
            </div>
        `;
    });
    if (products.length < maxProducts && isEditing) {
        container.innerHTML += `
            <div class="p-6 flex items-center justify-center neomorphic-card border-dashed border-2 border-gray-400">
                <button onclick="addProduct()" class="neomorphic-btn text-gray-700 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Agregar Producto
                </button>
            </div>
        `;
    }
}

// --- Core Logic Functions ---
function toggleEditMode() {
    isEditing = !isEditing;
    const editBtn = document.getElementById('edit-mode-btn');
    editBtn.textContent = isEditing ? 'Guardar Cambios' : 'Modo de Edición';
    editBtn.classList.toggle('bg-green-500');
    editBtn.classList.toggle('text-white');
    editBtn.classList.toggle('bg-[#e0e5ec]');
    editBtn.classList.toggle('text-gray-700');
    editBtn.classList.toggle('neomorphic-btn');
    
    document.querySelectorAll('.editable').forEach(el => {
        el.contentEditable = isEditing;
        el.classList.toggle('border-dashed');
        el.classList.toggle('border-gray-400');
    });

    document.getElementById('youtube-link').hidden = !isEditing;
    document.getElementById('file-upload-btn').hidden = !isEditing;
    document.getElementById('whatsapp-number').hidden = !isEditing;
    document.getElementById('ver-carrito-btn').hidden = isEditing;
    document.getElementById('air-rate-input').hidden = !isEditing;

    if (!isEditing) {
        saveStoreData();
    }

    // Re-render products to show/hide edit inputs
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    renderProducts(storeData.products);
}

function updateProduct(id, key, value) {
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    const product = storeData.products.find(p => p.id === id);
    if (product) {
        product[key] = value;
        localStorage.setItem('storeData', JSON.stringify(storeData));
        if (isEditing) {
            renderProducts(storeData.products);
        }
    }
}

function addProduct() {
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    if (storeData.products.length < maxProducts) {
        const newId = `prod${Date.now()}`;
        storeData.products.push({
            id: newId,
            name: 'Nuevo Producto',
            price: 0,
            currency: 'C$',
            weight: 0,
            type: 'disponible',
            shipping: 'no-incluido',
            shippingCost: 0,
            shippingType: 'ambos',
            image: 'https://placehold.co/400x300/e0e5ec/6366f1?text=Producto'
        });
        localStorage.setItem('storeData', JSON.stringify(storeData));
        renderProducts(storeData.products);
    }
}

function removeProduct(id) {
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    storeData.products = storeData.products.filter(p => p.id !== id);
    localStorage.setItem('storeData', JSON.stringify(storeData));
    renderProducts(storeData.products);
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const storeData = JSON.parse(localStorage.getItem('storeData'));
            storeData.logo = e.target.result;
            localStorage.setItem('storeData', JSON.stringify(storeData));
            document.getElementById('logo-img').src = e.target.result;
            if (isEditing) saveStoreData();
        };
        reader.readAsDataURL(file);
    }
}

function handleProductImageUpload(event, productId) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const storeData = JSON.parse(localStorage.getItem('storeData'));
            const product = storeData.products.find(p => p.id === productId);
            if (product) {
                product.image = e.target.result;
                localStorage.setItem('storeData', JSON.stringify(storeData));
                renderProducts(storeData.products); // Re-render to show new image
                if (isEditing) saveStoreData();
            }
        };
        reader.readAsDataURL(file);
    }
}

function addToCart(productId) {
    cart[productId] = (cart[productId] || 0) + 1;
}

function showCart() {
    const cartModal = document.getElementById('cart-modal');
    renderCart();
    cartModal.classList.add('open');
}

function hideCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.classList.remove('open');
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    cartItemsContainer.innerHTML = '';
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    const products = storeData.products || [];
    let subtotal = 0;
    let totalWeight = 0;
    
    for (const id in cart) {
        const product = products.find(p => p.id === id);
        if (product) {
            const quantity = cart[id];
            const price = parseFloat(product.price);
            const itemTotal = price * quantity;
            const formattedSubtotal = product.currency === '$' ? `$${itemTotal}` : `C$${itemTotal}`;
            subtotal += itemTotal;
            totalWeight += parseFloat(product.weight) * quantity;
            
            cartItemsContainer.innerHTML += `
                <div class="flex justify-between items-center mb-2 p-2 neomorphic-card text-sm">
                    <span>${product.name} (x${quantity})</span>
                    <div class="flex items-center gap-2">
                        <span class="font-bold">${formattedSubtotal}</span>
                        <button onclick="removeFromCart('${id}')" class="w-6 h-6 rounded-full neomorphic-btn text-red-500 flex items-center justify-center text-xs">-</button>
                    </div>
                </div>
            `;
        }
    }

    const totalContainer = document.getElementById('cart-total');
    const airRate = parseFloat(document.getElementById('air-rate-input').value) || 0;
    const airCost = totalWeight * airRate;
    const finalTotal = subtotal + airCost;

    totalContainer.innerHTML = `
        <div class="flex justify-between text-md text-gray-600"><span>Subtotal:</span><span>C$${subtotal.toFixed(2)}</span></div>
        <div class="flex justify-between text-md text-gray-600"><span>Costo Aéreo (${airRate}/kg):</span><span>C$${airCost.toFixed(2)}</span></div>
        <hr class="my-2 border-gray-400">
        <div class="flex justify-between font-bold text-lg"><span>Total final:</span><span>C$${finalTotal.toFixed(2)}</span></div>
    `;
}

function removeFromCart(productId) {
    if (cart[productId] > 1) {
        cart[productId] -= 1;
    } else {
        delete cart[productId];
    }
    renderCart();
}

function generateWhatsAppMessage() {
    const storeData = JSON.parse(localStorage.getItem('storeData'));
    const products = storeData.products || [];
    let message = `¡Hola! Me gustaría hacer un pedido de tu tienda web:\n\n`;
    let subtotal = 0;
    let totalWeight = 0;
    
    message += `*Detalles del pedido:*
`;
    
    for (const id in cart) {
        const product = products.find(p => p.id === id);
        if (product) {
            const quantity = cart[id];
            const itemTotal = parseFloat(product.price) * quantity;
            subtotal += itemTotal;
            totalWeight += parseFloat(product.weight) * quantity;
            
            message += `\n*Producto:* ${product.name}\n`;
            message += `*Cantidad:* ${quantity}\n`;
            message += `*Precio unitario:* ${product.currency} ${product.price}\n`;
            message += `*Peso estimado:* ${product.weight} kg\n`;
            message += `*Subtotal:* ${product.currency} ${itemTotal.toFixed(2)}\n`;
        }
    }
    
    const airRate = parseFloat(document.getElementById('air-rate-input').value) || 0;
    const airCost = totalWeight * airRate;
    const finalTotal = subtotal + airCost;
    
    message += `\n---
*RESUMEN DE LA ORDEN:*
- Subtotal: C$${subtotal.toFixed(2)}
- Costo por peso aéreo: C$${airCost.toFixed(2)}
- TOTAL: *C$${finalTotal.toFixed(2)}*
---
\n¡Gracias!`;
    
    const whatsappNumber = storeData.whatsappNumber;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/505${whatsappNumber}?text=${encodedMessage}`, '_blank');
}

// --- Event Listeners and Initial Setup ---
window.onload = function() {
    initFirebase();
    document.getElementById('edit-mode-btn').addEventListener('click', toggleEditMode);
    document.getElementById('place-order-btn').addEventListener('click', generateWhatsAppMessage);
    document.getElementById('ver-carrito-btn').addEventListener('click', showCart);
    document.getElementById('close-cart-btn').addEventListener('click', hideCart);
    document.getElementById('youtube-link').addEventListener('input', (e) => {
        const storeData = JSON.parse(localStorage.getItem('storeData'));
        storeData.youtubeLink = e.target.value;
        localStorage.setItem('storeData', JSON.stringify(storeData));
        document.getElementById('youtube-iframe').src = e.target.value.includes("youtube.com") ? e.target.value.replace("watch?v=", "embed/") : e.target.value;
        if (isEditing) saveStoreData();
    });
    document.getElementById('file-upload').addEventListener('change', handleLogoUpload);
    document.getElementById('whatsapp-number').addEventListener('input', (e) => {
        const storeData = JSON.parse(localStorage.getItem('storeData'));
        storeData.whatsappNumber = e.target.value;
        localStorage.setItem('storeData', JSON.stringify(storeData));
        if (isEditing) saveStoreData();
    });
    document.getElementById('air-rate-input').addEventListener('input', (e) => {
        const storeData = JSON.parse(localStorage.getItem('storeData'));
        storeData.airRate = e.target.value;
        localStorage.setItem('storeData', JSON.stringify(storeData));
        if (isEditing) saveStoreData();
    });
};