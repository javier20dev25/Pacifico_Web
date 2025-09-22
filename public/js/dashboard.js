document.addEventListener('DOMContentLoaded', async () => {
    const userNameSpan = document.getElementById('user-name');
    const userEmailSpan = document.getElementById('user-email');
    const userPlanSpan = document.getElementById('user-plan');
    const userStatusSpan = document.getElementById('user-status');
    const contractStartSpan = document.getElementById('contract-start');
    const contractEndSpan = document.getElementById('contract-end');
    const logoutButton = document.getElementById('logout-button');

    const jwtToken = localStorage.getItem('jwt_token');

    // --- VERIFICACIÓN DE AUTENTICACIÓN ---
    if (!jwtToken) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        window.location.href = '/login.html';
        return;
    }

    // --- OBTENER DATOS DEL USUARIO ---
    try {
        const response = await fetch('/api/user/profile', {
            headers: {
                'Authorization': `Bearer ${jwtToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
                localStorage.removeItem('jwt_token');
                window.location.href = '/login.html';
                return;
            }
            throw new Error('No se pudo cargar el perfil del usuario.');
        }

        const userProfile = await response.json();

        // --- MOSTRAR DATOS EN LA INTERFAZ ---
        userNameSpan.textContent = userProfile.nombre || 'Usuario';
        userEmailSpan.textContent = userProfile.correo;
        userPlanSpan.textContent = userProfile.plan || 'N/A';
        userStatusSpan.textContent = userProfile.status;
        contractStartSpan.textContent = userProfile.fecha_inicio ? new Date(userProfile.fecha_inicio).toLocaleDateString() : 'N/A';
        contractEndSpan.textContent = userProfile.fecha_expiracion ? new Date(userProfile.fecha_expiracion).toLocaleDateString() : 'N/A';

    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
        alert(error.message);
        // En caso de error, redirigir al login
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    }

    // --- MANEJAR CIERRE DE SESIÓN ---
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('jwt_token');
        window.location.href = '/login.html';
    });
});
