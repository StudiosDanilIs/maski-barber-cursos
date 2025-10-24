document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('auth-form');
    const title = document.getElementById('auth-title');
    const button = document.getElementById('auth-button');
    const toggle = document.getElementById('toggle-auth');
    const message = document.getElementById('message');
    
    let isRegisterMode = false;

    // Redirección si ya está logueado
    if (localStorage.getItem('token')) {
        const userRole = localStorage.getItem('role');
        if (userRole === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }

    toggle.addEventListener('click', () => {
        isRegisterMode = !isRegisterMode;
        if (isRegisterMode) {
            title.textContent = 'Registro de Usuario';
            button.textContent = 'Registrarse';
            toggle.textContent = '¿Ya tienes cuenta? Iniciar Sesión';
        } else {
            title.textContent = 'Iniciar Sesión';
            button.textContent = 'Iniciar Sesión';
            toggle.textContent = '¿No tienes cuenta? Regístrate';
        }
        message.textContent = ''; // Limpiar mensaje al cambiar
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        message.textContent = '';
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/.netlify/functions/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, isRegister: isRegisterMode })
            });

            const data = await response.json();

            if (response.ok) {
                // Almacenar token y rol
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                
                message.textContent = data.message;
                message.className = 'mt-4 text-center text-sm text-green-600';

                // Redireccionar según el rol
                setTimeout(() => {
                    if (data.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                }, 500);

            } else {
                message.textContent = data.message || 'Error desconocido.';
                message.className = 'mt-4 text-center text-sm text-red-600';
            }

        } catch (error) {
            console.error('Fetch Error:', error);
            message.textContent = 'Error de conexión al servidor.';
            message.className = 'mt-4 text-center text-sm text-red-600';
        }
    });
});

// Nota: Los archivos dashboard.html, admin.html, app.js y admin.js
// deben ser creados siguiendo una lógica similar de fetch con el header de Authorization: Bearer <token>.