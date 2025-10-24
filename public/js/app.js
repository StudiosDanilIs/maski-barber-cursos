document.addEventListener('DOMContentLoaded', () => {
    // --- Seguridad y Redirección ---
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role === 'admin') {
        window.location.href = 'index.html'; // Redirige si no hay token o es admin
        return;
    }

    // --- Elementos DOM ---
    const coursesList = document.getElementById('courses-list');
    const messageDiv = document.getElementById('status-message');
    const messageText = document.getElementById('message-text');
    const logoutBtn = document.getElementById('logout-btn');
    const enrollModal = document.getElementById('enroll-modal');
    const enrollForm = document.getElementById('enroll-form');
    const modalCourseTitle = document.getElementById('modal-course-title');
    const closeModalBtn = document.getElementById('close-modal-btn');

    // --- Manejo de Sesión ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'index.html';
    });

    // --- Funciones de Utilidad ---
    function showMessage(text, isError = false) {
        messageText.textContent = text;
        messageDiv.classList.remove('hidden', 'bg-red-100', 'border-red-500', 'bg-blue-100', 'border-blue-500');
        messageDiv.classList.add(isError ? 'bg-red-100' : 'bg-blue-100', isError ? 'border-red-500' : 'border-blue-500');
        setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    }

    async function fetchData(url, method = 'GET', body = null) {
        const headers = { 'Authorization': `Bearer ${token}` };
        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const options = { method, headers };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(url, options);
        return { ok: response.ok, data: await response.json() };
    }

    // --- Cargar Cursos y Estado de Inscripción ---
    async function loadCourses() {
        const { ok, data } = await fetchData('/.netlify/functions/admin?action=getCoursesAndStatus');
        
        if (!ok) {
            showMessage(data.message || 'Error al cargar los cursos.', true);
            return;
        }

        coursesList.innerHTML = ''; // Limpiar lista
        
        data.courses.forEach(course => {
            // Determinar el estado para la interfaz (lógica simplificada)
            const enrollment = data.enrollments.find(e => e.course_id === course.id);
            let statusText = 'No inscrito';
            let buttonClass = 'bg-green-500 hover:bg-green-600';
            let buttonAction = 'enroll';
            let buttonText = 'Inscribirme';

            if (enrollment) {
                statusText = `Estado: ${enrollment.status.toUpperCase()}`;
                
                if (enrollment.status === 'pending') {
                    buttonText = 'En Revisión...';
                    buttonClass = 'bg-yellow-500 cursor-not-allowed';
                    buttonAction = 'none';
                } else if (enrollment.status === 'accepted') {
                    const downloads = enrollment.download_count || 0;
                    const downloadsLeft = 3 - downloads;
                    buttonText = `Descargar Video (${downloadsLeft} restantes)`;
                    buttonClass = downloadsLeft > 0 ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed';
                    buttonAction = downloadsLeft > 0 ? 'download' : 'none';
                } else if (enrollment.status === 'rejected') {
                    buttonText = 'Rechazado. Contactar';
                    buttonClass = 'bg-red-500 cursor-not-allowed';
                    buttonAction = 'none';
                }
            }

            const courseCard = `
                <div class="card p-5 border border-gray-200">
                    <h3 class="text-xl font-bold text-gray-800">${course.title}</h3>
                    <p class="text-gray-600 mt-2">${course.description}</p>
                    <p class="text-sm font-medium mt-3">${statusText}</p>
                    <button data-course-id="${course.id}" data-course-title="${course.title}" 
                            data-action="${buttonAction}" 
                            class="course-action-btn mt-4 w-full py-2 rounded-lg text-white ${buttonClass} transition duration-150">
                        ${buttonText}
                    </button>
                </div>
            `;
            coursesList.innerHTML += courseCard;
        });

        // Añadir listeners de acción
        document.querySelectorAll('.course-action-btn').forEach(button => {
            button.addEventListener('click', handleCourseAction);
        });
    }

    // --- Manejo de Acciones (Inscripción / Descarga) ---
    function handleCourseAction(e) {
        const courseId = e.target.getAttribute('data-course-id');
        const courseTitle = e.target.getAttribute('data-course-title');
        const action = e.target.getAttribute('data-action');

        if (action === 'enroll') {
            modalCourseTitle.textContent = courseTitle;
            enrollForm.setAttribute('data-course-id', courseId);
            enrollModal.classList.remove('hidden');
        } else if (action === 'download') {
            startDownload(courseId);
        }
    }

    // --- Lógica de Descarga ---
    async function startDownload(courseId) {
        showMessage('Procesando solicitud de descarga...', false);
        const { ok, data } = await fetchData(`/.netlify/functions/download?courseId=${courseId}`);

        if (ok) {
            showMessage(data.message || `¡Descarga iniciada! Te quedan ${data.downloadsLeft} descargas.`, false);
            // Iniciar descarga en el navegador
            window.open(data.url, '_blank');
            loadCourses(); // Recargar para actualizar el contador
        } else {
            showMessage(data.message || 'Error al iniciar la descarga.', true);
        }
    }

    // --- Lógica del Formulario de Inscripción (SIMPLIFICADA) ---
    // NOTA: La subida de archivos (payment-file) es compleja. Aquí simulamos la URL.
    enrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const courseId = enrollForm.getAttribute('data-course-id');
        const personalInfo = enrollForm.querySelector('textarea[name="personalInfo"]').value;
        const paymentFile = document.getElementById('payment-file').files[0];

        if (!paymentFile) {
            showMessage("Por favor, sube el capture de pago.", true);
            return;
        }

        // SIMULACIÓN: En un entorno real, aquí se subiría 'paymentFile' a Cloudinary/S3 
        // y se obtendría la URL.
        const paymentCaptureUrl = `SIMULATED_URL_FOR_COURSE_${courseId}_${Date.now()}.png`;

        const { ok, data } = await fetchData('/.netlify/functions/enroll', 'POST', {
            courseId: parseInt(courseId), 
            paymentCaptureUrl, 
            personalInfo
        });

        if (ok) {
            showMessage(data.message, false);
            enrollModal.classList.add('hidden');
            loadCourses(); // Recargar para mostrar estado "En Revisión"
        } else {
            showMessage(data.message || 'Error al enviar la inscripción.', true);
        }
    });

    closeModalBtn.addEventListener('click', () => {
        enrollModal.classList.add('hidden');
    });

    // Iniciar carga
    loadCourses();
});