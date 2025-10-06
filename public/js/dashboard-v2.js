// Parche frontend: fetch profile robusto
(async function loadProfileAndStores(){
  try {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token') || '';
    if (!token) {
        showErrorBanner('No estás autenticado. Serás redirigido al login.');
        setTimeout(() => { window.location.href = '/login.html'; }, 2000);
        return;
    }
    const headers = { 'Authorization': `Bearer ${token}` };

    // Cargar perfil de usuario
    const profileRes = await fetch('/api/user/profile', { headers });
    if (!profileRes.ok) throw new Error('No se pudo cargar el perfil de usuario.');
    const profilePayload = await profileRes.json();
    const user = profilePayload.user || profilePayload;

    const userPlanElement = document.getElementById('user-plan');
    if (userPlanElement) userPlanElement.textContent = user.plan || user.plan_nombre || 'Sin plan';
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) userNameElement.textContent = user.nombre || 'Usuario';

    // Cargar tiendas del usuario
    const storesRes = await fetch('/api/user/stores', { headers });
    if (!storesRes.ok) throw new Error('No se pudieron cargar las tiendas.');
    const stores = await storesRes.json();
    renderStoreManagement(stores, headers);

  } catch (err) {
    console.error('Error al cargar datos del dashboard:', err);
    showErrorBanner(err.message);
  }
})();

function renderStoreManagement(stores, headers) {
    const wrapper = document.getElementById('store-management-wrapper');
    if (!wrapper) return;

    if (stores.length === 0) {
        wrapper.innerHTML = `
            <div class="text-center neomorphic-card p-8">
                <p class="text-gray-500 mb-4">Aún no has creado tu tienda.</p>
                <a href="/templates/baseplantillaediciontiendas.html" class="neomorphic-btn">➕ Crear mi Primera Tienda</a>
            </div>
        `;
        return;
    }

    const store = stores[0]; // Asumimos que cada usuario tiene una sola tienda por ahora
    const storeName = store.nombre || 'Mi Tienda';
    const storeSlug = store.slug;
    const storeId = store.id;
    const publicUrl = `${window.location.origin}/store/${storeSlug}`;

    document.querySelector('#stores-container h2').textContent = storeName;

    wrapper.innerHTML = `
        <div class="neomorphic-card p-4">
            <div class="aspect-w-16 aspect-h-9 border-2 border-gray-200 rounded-lg overflow-hidden mb-4">
                <iframe src="${publicUrl}" class="w-full h-full"></iframe>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/templates/baseplantillaediciontiendas.html" id="edit-store-btn" class="neomorphic-btn w-full sm:w-auto text-center">✏️ Editar Tienda</a>
                <button id="share-store-btn" class="neomorphic-btn w-full sm:w-auto">🔗 Compartir Enlace</button>
                <button id="delete-store-btn" class="neomorphic-btn w-full sm:w-auto hover:!text-red-500">🗑️ Eliminar</button>
            </div>
        </div>
    `;

    // Añadir event listeners para los botones
    document.getElementById('share-store-btn').addEventListener('click', () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            alert('¡Enlace de la tienda copiado al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar el enlace:', err);
            alert('No se pudo copiar el enlace.');
        });
    });

    document.getElementById('delete-store-btn').addEventListener('click', async () => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la tienda "${storeName}"? Esta acción es permanente.`)) {
            return;
        }
        try {
            const response = await fetch(`/api/user/stores/${storeId}`, {
                method: 'DELETE',
                headers: headers
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en el servidor');
            }
            alert('¡Tienda eliminada con éxito!');
            window.location.reload(); // Recargar la página para ver los cambios
        } catch (error) {
            console.error('Error al eliminar la tienda:', error);
            alert(`Error: ${error.message}`);
        }
    });
}

function showErrorBanner(msg){
  let b = document.getElementById('error-banner');
  if(!b){
    b = document.createElement('div');
    b.id = 'error-banner';
    b.style = 'background:#fee;border:1px solid #f99;padding:8px;margin:8px;position:fixed;top:0;left:0;right:0;z-index:100;';
    document.body.prepend(b);
  }
  b.textContent = msg;
  setTimeout(() => { b.style.display = 'none'; }, 4000);
}
