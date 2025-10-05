// Parche frontend: fetch profile robusto
(async function loadProfile(){
  try {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('token') || '';
    const res = await fetch('/api/user/profile', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    });

    if (res.status === 401 || res.status === 403) {
      console.warn('Perfil: no autorizado (401/403)', await res.text());
      showErrorBanner('Tu sesión ha expirado o no tienes permiso. Serás redirigido al login.');
      setTimeout(() => { window.location.href = '/login.html'; }, 2000);
      return;
    }

    const payload = await res.json().catch(()=>null);
    if (!payload) {
      console.warn('Perfil: respuesta no JSON o vacía', res);
      // No redirigir automáticamente; mostrar error y evitar crash
      // muestra una UI degradada:
      showErrorBanner('No se pudo obtener perfil (respuesta inválida).');
      return;
    }

    // soporta ambas formas: {user: {...}} o {...}
    const user = payload.user || payload;
    if (!user) {
      console.warn('Perfil: usuario no presente en payload', payload);
      showErrorBanner('No se encontró información de usuario.');
      return;
    }

    // seguridad: evita leer .plan si user undefined
    const plan = user.plan || user.plan_nombre || 'Sin plan';
    // ahora usa plan de forma segura
    // Asumiendo que tienes elementos con estos IDs en tu dashboard.html
    const userPlanElement = document.getElementById('user-plan');
    if (userPlanElement) {
        userPlanElement.textContent = plan;
    }
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = user.nombre || 'Usuario';
    }
    
    // ... resto del render del dashboard usando 'user' con null-safe checks ...

  } catch (err) {
    console.error('Error al obtener perfil:', err);
    showErrorBanner('Error de red al cargar el perfil.');
  }
})();

function showErrorBanner(msg){
  let b = document.getElementById('error-banner');
  if(!b){
    b = document.createElement('div');
    b.id = 'error-banner';
    b.style = 'background:#fee;border:1px solid #f99;padding:8px;margin:8px;';
    document.body.prepend(b);
  }
  b.textContent = msg;
}