document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORES --- 
    const createUserForm = document.getElementById('create-user-form');
    const usersTableBody = document.getElementById('users-table-body');
    const formFeedback = document.getElementById('form-feedback');
    const credentialsDisplay = document.getElementById('credentials-display');
    const generatedEmail = document.getElementById('generated-email');
    const generatedPassword = document.getElementById('generated-password');
    const refreshButton = document.getElementById('refresh-users');

    const API_BASE_URL = '/api/admin';
    let jwtToken = localStorage.getItem('jwt_token');

    // --- VERIFICACIÓN DE AUTENTICACIÓN --- 
    if (!jwtToken) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        window.location.href = '/login.html';
        return; // Detener la ejecución del script
    }

    // --- FUNCIONES --- 

    /**
     * Obtiene todos los usuarios de la API y los muestra en la tabla.
     */
    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
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
                throw new Error('No se pudo cargar la lista de usuarios.');
            }
            const users = await response.json();

            usersTableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

            if (users.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="4">No hay usuarios en el sistema.</td></tr>';
                return;
            }

            users.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.correo}</td>
                    <td>${user.plan}</td>
                    <td>${user.status}</td>
                    <td>
                        <button class="action-btn danger-btn revoke-btn" data-user-uuid="${user.usuario_uuid}">Revocar</button>
                    </td>
                `;
                usersTableBody.appendChild(row);
            });

        } catch (error) {
            usersTableBody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
        }
    };

    /**
     * Maneja la revocación de un usuario.
     */
    const handleRevokeUser = async (userUuid) => {
        if (!confirm('¿Estás seguro de que quieres eliminar a este usuario de forma permanente?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/revoke-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ userUuid })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al revocar el usuario.');
            }

            alert('Usuario revocado con éxito.');
            fetchUsers(); // Recargar la lista de usuarios

        } catch (error) {
            alert(error.message);
        }
    };

    // --- MANEJADORES DE EVENTOS ---

    // Cargar usuarios al iniciar la página
    fetchUsers();

    // Botón para refrescar la lista manualmente
    refreshButton.addEventListener('click', fetchUsers);

    // Formulario para crear usuario
    createUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        formFeedback.textContent = '';
        credentialsDisplay.classList.add('hidden');

        const nombre = document.getElementById('user-nombre').value;
        const correo = document.getElementById('user-email').value;
        const plan_nombre = document.getElementById('user-plan').value;

        try {
            const response = await fetch(`${API_BASE_URL}/create-temporary-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ nombre, correo, plan_nombre })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al crear el usuario.');
            }

            // Mostrar las credenciales generadas
            generatedEmail.textContent = result.credentials.correo;
            generatedPassword.textContent = result.credentials.password;
            credentialsDisplay.classList.remove('hidden');

            // Limpiar el formulario y recargar la lista
            createUserForm.reset();
            fetchUsers();

        } catch (error) {
            formFeedback.style.color = '#fa383e';
            formFeedback.textContent = error.message;
        }
    });

    // Delegación de eventos para los botones de "Revocar"
    usersTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('revoke-btn')) {
            const userUuid = e.target.dataset.userUuid;
            handleRevokeUser(userUuid);
        }
    });
});