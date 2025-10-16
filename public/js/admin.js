// Función global para copiar al portapapeles
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    element.setSelectionRange(0, 99999); // Para dispositivos móviles
    document.execCommand('copy');
    alert('Mensaje copiado al portapapeles!');
}

document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORES ---
    const createUserForm = document.getElementById('create-user-form');
    const usersTableBody = document.getElementById('users-table-body');
    const formFeedback = document.getElementById('form-feedback');
    const credentialsDisplay = document.getElementById('credentials-display');
    const generatedEmail = document.getElementById('generated-email');
    const generatedPassword = document.getElementById('generated-password');
    const clientMessageTemplate = document.getElementById('client-message-template');
    const refreshButton = document.getElementById('refresh-users');
    const tempUsersCountSpan = document.getElementById('temp-users-count');
    const activeUsersCountSpan = document.getElementById('active-users-count');
    const registrationChartCanvas = document.getElementById('registrationChart');

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
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo cargar la lista de usuarios.');
            }
            const users = await response.json();

            usersTableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

            let tempCount = 0;
            let activeCount = 0;

            if (users.length === 0) {
                usersTableBody.innerHTML = '<tr><td colspan="7">No hay usuarios en el sistema.</td></tr>';
            } else {
                users.forEach(user => {
                    // Contadores
                    if (user.status === 'temporary') tempCount++;
                    if (user.status === 'active') activeCount++;

                    const row = document.createElement('tr');
                    const createdDate = new Date(user.creado_at).toLocaleDateString();
                    const expirationDate = user.fecha_expiracion ? new Date(user.fecha_expiracion).toLocaleDateString() : 'N/A';

                    // Botones de acción condicionales
                    let suspendOrReactivateBtn;
                    if (user.status === 'suspended') {
                        suspendOrReactivateBtn = `<button class="action-btn reactivate-btn" data-user-uuid="${user.usuario_uuid}">Reactivar</button>`;
                    } else {
                        suspendOrReactivateBtn = `<button class="action-btn danger-btn suspend-btn" data-user-uuid="${user.usuario_uuid}">Suspender</button>`;
                    }

                    let actionButtons = `
                        <button class="action-btn renew-btn" data-user-uuid="${user.usuario_uuid}" ${user.status !== 'active' ? 'disabled' : ''}>Renovar</button>
                        <button class="action-btn reset-pass-btn" data-user-uuid="${user.usuario_uuid}">Resetear Pass</button>
                        ${suspendOrReactivateBtn}
                        <button class="action-btn danger-btn revoke-btn" data-user-uuid="${user.usuario_uuid}">Revocar</button>
                    `;

                    row.innerHTML = `
                        <td>${user.correo}</td>
                        <td>${user.nombre || 'N/A'}</td>
                        <td>${user.plan || 'N/A'}</td>
                        <td>${user.status}</td>
                        <td>${createdDate}</td>
                        <td>${expirationDate}</td>
                        <td>${actionButtons}</td>
                    `;
                    usersTableBody.appendChild(row);
                });
            }

            // Actualizar contadores
            tempUsersCountSpan.textContent = tempCount;
            activeUsersCountSpan.textContent = activeCount;

        } catch (error) {
            console.error('Error en fetchUsers:', error);
            usersTableBody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
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
            const response = await fetch(`${API_BASE_URL}/revoke-user`, {
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

    /**
     * Maneja la suspensión de un usuario.
     */
    const handleSuspendUser = async (userUuid) => {
        if (!confirm('¿Estás seguro de que quieres suspender a este usuario?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/suspend-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ userUuid })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al suspender el usuario.');
            }

            alert('Usuario suspendido con éxito.');
            fetchUsers();

        } catch (error) {
            alert(error.message);
        }
    };

    /**
     * Maneja la reactivación de un usuario.
     */
    const handleReactivateUser = async (userUuid) => {
        if (!confirm('¿Estás seguro de que quieres reactivar a este usuario?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reactivate-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ userUuid })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al reactivar el usuario.');
            }

            alert('Usuario reactivado con éxito.');
            fetchUsers();

        } catch (error) {
            alert(error.message);
        }
    };

    /**
     * Maneja la renovación de un contrato.
     */
    const handleRenewContract = async (userUuid) => {
        if (!confirm('¿Estás seguro de que quieres renovar el contrato de este usuario por 3 meses más?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/renew-contract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ userUuid })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al renovar el contrato.');
            }

            alert(`Contrato renovado con éxito hasta ${result.newExpirationDate}.`);
            fetchUsers();

        } catch (error) {
            alert(error.message);
        }
    };

    /**
     * Maneja el reseteo de contraseña de un usuario.
     */
    const handleResetPassword = async (userUuid) => {
        if (!confirm('¿Estás seguro de que quieres resetear la contraseña de este usuario? Se generará una nueva contraseña temporal y el usuario deberá actualizarla.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}`
                },
                body: JSON.stringify({ userUuid })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al resetear la contraseña.');
            }

            alert(`Contraseña reseteada con éxito. Nueva contraseña temporal: ${result.newTemporaryPassword}. Por favor, comparte esta contraseña con el usuario.`);
            fetchUsers();

        } catch (error) {
            alert(error.message);
        }
    };

    /**
     * Obtiene los planes de la API y los carga en el menú desplegable.
     */
    const fetchPlansAndPopulateDropdown = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/plans`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });
            if (!response.ok) {
                throw new Error('No se pudieron cargar los planes.');
            }
            const plans = await response.json();
            const planSelect = document.getElementById('user-plan');
            
            // Limpiar opciones hardcodeadas (excepto la primera que es "Selecciona un plan...")
            while (planSelect.options.length > 1) {
                planSelect.remove(1);
            }

            // Poblar con los planes de la API
            plans.forEach(plan => {
                const option = document.createElement('option');
                // Asumimos que la RPC espera el 'nombre' del plan. Si usara un id o slug, se cambiaría aquí.
                option.value = plan.nombre; 
                option.textContent = plan.nombre; // El nombre visible para el admin
                planSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error en fetchPlansAndPopulateDropdown:', error);
            const planSelect = document.getElementById('user-plan');
            planSelect.disabled = true;
            const errorOption = document.createElement('option');
            errorOption.textContent = 'Error al cargar planes';
            planSelect.appendChild(errorOption);
        }
    };

    /**
     * Renderiza la gráfica de registros de usuarios.
     */
    const renderRegistrationChart = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/registration-stats`, {
                headers: {
                    'Authorization': `Bearer ${jwtToken}`
                }
            });

            if (!response.ok) {
                throw new Error('No se pudieron cargar las estadísticas de registro.');
            }

            const stats = await response.json();

            const labels = stats.map(s => s.registration_date);
            const data = stats.map(s => s.user_count);

            new Chart(registrationChartCanvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Usuarios Registrados',
                        data: data,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Número de Usuarios'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Fecha de Registro'
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error al renderizar la gráfica:', error);
            // Mostrar un mensaje de error en el canvas o en otro lugar
            if (registrationChartCanvas) {
                const ctx = registrationChartCanvas.getContext('2d');
                ctx.font = '16px Arial';
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.fillText('Error al cargar la gráfica.', registrationChartCanvas.width / 2, registrationChartCanvas.height / 2);
            }
        }
    };

    // --- MANEJADORES DE EVENTOS ---

    // Cargar datos iniciales al iniciar la página
    const initializeAdminPanel = () => {
        fetchUsers();
        fetchPlansAndPopulateDropdown();
        renderRegistrationChart();
    };

    initializeAdminPanel();

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
            const response = await fetch(`${API_BASE_URL}/create-temporary-user`, {
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

            // Generar mensaje para el cliente
            const loginLink = window.location.origin + '/login.html';
            const clientMessage = `¡Hola ${nombre}!

Bienvenido a Pacífico Web. Hemos creado tu cuenta temporal para que puedas empezar.

Aquí tienes tus credenciales de acceso:
Enlace de entrada: ${loginLink}
Usuario: ${result.credentials.correo}
Contraseña Temporal: ${result.credentials.password}

Instrucciones:
1. Entra con tu usuario y contraseña temporal.
2. El sistema te pedirá que crees tu propia contraseña permanente (¡recuerda que la temporal solo se usa una vez!).
3. Una vez dentro, podrás crear tu tienda y, cuando esté lista, compartirla con tus clientes con su enlace único.

Tu plan contratado es: ${plan_nombre}. Tu suscripción inicial es por tres meses.

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

¡Esperamos que disfrutes de Pacífico Web!`;

            clientMessageTemplate.value = clientMessage;

            // Limpiar el formulario y recargar la lista
            createUserForm.reset();
            fetchUsers();

        } catch (error) {
            formFeedback.style.color = '#fa383e';
            formFeedback.textContent = error.message;
        }
    });

    // Delegación de eventos para los botones de acción
    usersTableBody.addEventListener('click', (e) => {
        const target = e.target;
        const userUuid = target.dataset.userUuid;

        if (!userUuid) return; // Si no hay uuid, no hacer nada

        if (target.classList.contains('revoke-btn')) {
            handleRevokeUser(userUuid);
        } else if (target.classList.contains('suspend-btn')) {
            handleSuspendUser(userUuid);
        } else if (target.classList.contains('reactivate-btn')) {
            handleReactivateUser(userUuid);
        } else if (target.classList.contains('renew-btn')) {
            handleRenewContract(userUuid);
        } else if (target.classList.contains('reset-pass-btn')) {
            handleResetPassword(userUuid);
        }
    });
});