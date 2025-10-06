// ==========================================================
// 1. HELPER DE SEGURIDAD PARA MANIPULACIÓN DEL DOM
// ==========================================================

/**
 * Escribe texto o HTML en un elemento del DOM de forma segura.
 * Comprueba si el elemento existe antes de intentar modificarlo.
 * @param {string} id - El ID del elemento HTML.
 * @param {string} text - El texto o HTML a insertar.
 */
function safeSetText(id, text) {
  try {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = text ?? '';
    } else {
      console.warn('[safeSetText] Elemento no encontrado:', id, '| Valor que se intentó escribir:', text);
    }
  } catch (err) {
    console.error('[safeSetText] Error al escribir en el DOM:', id, err);
  }
}

// ==========================================================
// 2. LÓGICA PRINCIPAL DEL DASHBOARD
// ==========================================================

/**
 * Función central que inicializa todo el dashboard.
 */
async function initDashboard() {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  const headers = { 'Authorization': `Bearer ${token}` };

  try {
    // Cargar perfil de usuario y tiendas en paralelo para más eficiencia
    const [profileResponse, storesResponse] = await Promise.all([
      fetch('/api/user/profile', { headers }),
      fetch('/api/user/stores', { headers })
    ]);

    // --- Procesar Perfil ---
    if (!profileResponse.ok) {
      throw new Error('No se pudo cargar el perfil. Sesión podría haber expirado.');
    }
    const profilePayload = await profileResponse.json();
    const user = profilePayload.user || profilePayload;
    
    safeSetText('user-name', user.nombre || 'Usuario');
    safeSetText('user-email', user.correo || '-');
    safeSetText('user-plan', user.plan || user.plan_nombre || 'Sin plan');
    safeSetText('user-status', user.status || '-');

    // --- Procesar Tiendas ---
    if (!storesResponse.ok) {
        throw new Error('No se pudieron cargar las tiendas.');
    }
    const stores = await storesResponse.json();
    renderStoreManagement(stores, headers);

  } catch (error) {
    console.error('[initDashboard] Error cargando datos:', error);
    showErrorBanner(error.message);
    // Opcional: Redirigir si el error es de autenticación
    if (error.message.includes('expirado')) {
        setTimeout(() => { window.location.href = '/login.html'; }, 3000);
    }
  }
}

/**
 * Renderiza el panel de gestión de la tienda.
 */
function renderStoreManagement(stores, headers) {
    const wrapper = document.getElementById('store-management-wrapper');
    if (!wrapper) return; // Salir si el contenedor no existe

    if (stores.length === 0) {
        wrapper.innerHTML = `
            <div class="text-center neomorphic-card p-8">
                <p class="text-gray-500 mb-4">Aún no has creado tu tienda.</p>
                <a href="/templates/baseplantillaediciontiendas.html" class="neomorphic-btn">➕ Crear mi Primera Tienda</a>
            </div>
        `;
        return;
    }

    const store = stores[0];
    const storeName = store.nombre || 'Mi Tienda';
    const publicUrl = store.slug ? `${window.location.origin}/store/${store.slug}` : '#';

    document.querySelector('#stores-container h2').textContent = storeName;

    wrapper.innerHTML = `
        <div class="neomorphic-card p-4">
            <div class="aspect-w-16 aspect-h-9 border-2 border-gray-200 rounded-lg overflow-hidden mb-4 bg-gray-100">
                ${store.slug ? `<iframe src="${publicUrl}" class="w-full h-full"></iframe>` : '<div class="flex items-center justify-center h-full text-gray-500">Vista previa no disponible (sin slug).</div>'}
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/templates/baseplantillaediciontiendas.html" id="edit-store-btn" class="neomorphic-btn w-full sm:w-auto text-center">✏️ Editar Tienda</a>
                <button id="share-store-btn" class="neomorphic-btn w-full sm:w-auto">🔗 Compartir Enlace</button>
                <button id="delete-store-btn" class="neomorphic-btn w-full sm:w-auto hover:!text-red-500">🗑️ Eliminar</button>
            </div>
        </div>
    `;

    // Listeners para los botones de acción
    const shareBtn = document.getElementById('share-store-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (!store.slug) { alert('La tienda no tiene un enlace público para compartir.'); return; }
            navigator.clipboard.writeText(publicUrl).then(() => {
                alert('¡Enlace de la tienda copiado al portapapeles!');
            }).catch(err => alert('No se pudo copiar el enlace.'));
        });
    }

    const deleteBtn = document.getElementById('delete-store-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!confirm(`¿Estás seguro de que quieres eliminar la tienda "${storeName}"? Esta acción es permanente.`)) return;
            try {
                const response = await fetch(`/api/user/stores/${store.id}`, { method: 'DELETE', headers });
                if (!response.ok) throw new Error((await response.json()).error || 'Error en el servidor');
                alert('¡Tienda eliminada con éxito!');
                window.location.reload();
            } catch (error) {
                showErrorBanner(`Error al eliminar la tienda: ${error.message}`);
            }
        });
    }
}

/**
 * Muestra un banner de error en la parte superior de la página.
 */
function showErrorBanner(msg){
  let b = document.getElementById('error-banner');
  if(!b){
    b = document.createElement('div');
    b.id = 'error-banner';
    b.style = 'background:#fee;color:red;border:1px solid #f99;padding:10px;margin:8px;position:fixed;top:10px;left:10px;right:10px;z-index:1000;border-radius:8px;text-align:center;';
    document.body.prepend(b);
  }
  b.textContent = msg;
  setTimeout(() => { b.style.display = 'none'; }, 5000);
}

// ==========================================================
// 3. PUNTO DE ENTRADA
// ==========================================================

// Asegurarse de que el DOM esté listo antes de ejecutar cualquier script
document.addEventListener('DOMContentLoaded', initDashboard);