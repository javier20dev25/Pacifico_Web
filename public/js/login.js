document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTORES DE ELEMENTOS ---
    const loginFormContainer = document.getElementById('login-form-container');
    const registrationFormContainer = document.getElementById('complete-registration-container');
    
    const loginForm = document.getElementById('login-form');
    const registrationForm = document.getElementById('complete-registration-form');

    const loginError = document.getElementById('login-error');
    const registrationError = document.getElementById('registration-error');
    
    const passwordStrengthDiv = document.getElementById('password-strength');
    const newPasswordInput = document.getElementById('new-password');

    let tempToken = null;

    // --- LÓGICA DE SESIÓN ---
    // Al cargar la página, verificar si ya hay una sesión activa
    const token = localStorage.getItem('jwt_token');
    if (token) {
        // Opcional: verificar validez del token antes de redirigir
        window.location.href = '/dashboard.html';
    }

    // --- MANEJADORES DE EVENTOS ---

    // Formulario de Login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error desconocido');
            }

            if (data.status === 'temporary_user') {
                tempToken = data.tempToken;
                loginFormContainer.classList.add('hidden');
                registrationFormContainer.classList.remove('hidden');
            } else if (data.status === 'login_success') {
                // Guardar nuestro token JWT personalizado
                localStorage.setItem('jwt_token', data.token);
                window.location.href = '/dashboard.html';
            }

        } catch (error) {
            loginError.textContent = error.message;
        }
    });

    // Formulario de Completar Registro
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registrationError.textContent = '';

        const password = newPasswordInput.value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            registrationError.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        try {
            const response = await fetch('/api/auth/complete-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempToken, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error desconocido');
            }

            if (data.status === 'registration_complete') {
                localStorage.setItem('jwt_token', data.token);
                window.location.href = '/dashboard.html';
            }

        } catch (error) {
            registrationError.textContent = error.message;
        }
    });

    // Feedback de fortaleza de contraseña
    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
        let strength = '';
        const feedback = [];

        if (password.length < 6) feedback.push('6+ caracteres');
        if (!/[A-Z]/.test(password)) feedback.push('1 mayúscula');
        if (!/[a-z]/.test(password)) feedback.push('1 minúscula');
        if (!/\d/.test(password)) feedback.push('1 número');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) feedback.push('1 símbolo');

        if (feedback.length === 0) {
            strength = '<span style="color: green;">Contraseña Fuerte</span>';
        } else {
            strength = `Falta: ${feedback.join(', ')}`;
        }
        passwordStrengthDiv.innerHTML = strength;
    });

    // Funcionalidad para ver/ocultar contraseña
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const passwordInput = button.previousElementSibling;
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            button.textContent = type === 'password' ? '👁️' : '🙈';
        });
    });
});
