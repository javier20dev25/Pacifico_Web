import { state } from './state.js';
import { selectors } from './config.js';
import { showMessage } from './utils.js';

export async function uploadImage(file, folder) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
        const response = await fetch('/api/uploads/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.token}` },
            body: formData
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al subir la imagen.');
        }
        const result = await response.json();
        return result.url;
    } catch (error) {
        showMessage(`Error de subida: ${error.message}`);
        console.error('Upload error:', error);
        return null;
    }
}

export async function launchStore() {
    if (selectors.confirmLaunchBtn) selectors.confirmLaunchBtn.disabled = true;
    showMessage("Publicando tienda... Este proceso puede tardar un momento.");

    try {
        // 1. Subir logo de la tienda si ha cambiado
        if (state.storeState.store.logoFile) {
            const newLogoUrl = await uploadImage(state.storeState.store.logoFile, 'store_logos');
            if (newLogoUrl) {
                state.storeState.store.logoUrl = newLogoUrl;
            }
            delete state.storeState.store.logoFile; // Limpiar el archivo del estado
        }

        // 2. Subir imágenes de productos si han cambiado
        for (const product of state.storeState.products) {
            if (product.imageFile) {
                const newImageUrl = await uploadImage(product.imageFile, 'product_images');
                if (newImageUrl) {
                    product.imageUrl = newImageUrl;
                }
                delete product.imageFile; // Limpiar el archivo del estado
            }
        }

        // 3. Enviar el estado completo al backend para guardar en Supabase
        const response = await fetch('/api/user/store-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify(state.storeState)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Error al guardar los datos de la tienda.');
        }

        const result = await response.json();
        showMessage(result.message || "¡Tienda publicada con éxito!");
        if (selectors.launchModal) selectors.launchModal.classList.add('hidden');
        
        const previewBtn = selectors.saveStoreBtn.parentElement.querySelector('#public-preview-btn');
        if (previewBtn && result.store_slug) {
            previewBtn.href = `/tienda/${result.store_slug}`;
            previewBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            previewBtn.classList.add('hover:bg-gray-400');
        }

    } catch (error) {
        showMessage(`Error al publicar: ${error.message}`);
        console.error("Launch error:", error);
    } finally {
        if (selectors.confirmLaunchBtn) selectors.confirmLaunchBtn.disabled = false;
    }
}
