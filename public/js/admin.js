document.addEventListener('DOMContentLoaded', () => {
    // --- Seguridad y Redirección ---
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'admin') {
        window.location.href = 'index.html'; // Redirige si no hay token o no es admin
        return;
    }

    // --- Elementos DOM ---
    const logoutBtn = document.getElementById('logout-btn');
    const publishedCoursesList = document.getElementById('published-courses');
    const pendingEnrollmentsDiv = document.getElementById('pending-enrollments');
    const noEnrollmentsMsg = document.getElementById('no-enrollments');
    const addCourseForm = document.getElementById('add-course-form');

    // --- Manejo de Sesión ---
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'index.html';
    });

    // --- Utilidad para API Calls ---
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

    // --- 1. Cargar Cursos Publicados ---
    async function loadPublishedCourses() {
        const { ok, data } = await fetchData('/.netlify/functions/admin?action=getCoursesAndStatus');
        if (!ok) {
            console.error('Error al cargar cursos publicados.');
            return;
        }

        publishedCoursesList.innerHTML = '';
        data.courses.forEach(course => {
            const li = document.createElement('li');
            li.className = 'text-sm text-gray-700 border-b border-gray-100 pb-2';
            li.innerHTML = `<strong>${course.title}</strong> (${course.id})`;
            publishedCoursesList.appendChild(li);
        });
    }

    // --- 2. Cargar Solicitudes Pendientes ---
    async function loadPendingEnrollments() {
        const { ok, data } = await fetchData('/.netlify/functions/admin?action=getPendingEnrollments');
        
        pendingEnrollmentsDiv.innerHTML = ''; 
        
        if (!ok || data.length === 0) {
            pendingEnrollmentsDiv.appendChild(noEnrollmentsMsg);
            noEnrollmentsMsg.classList.remove('hidden');
            return;
        }
        
        noEnrollmentsMsg.classList.add('hidden');

        data.forEach(enrollment => {
            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-4 rounded-lg border border-yellow-300 shadow-sm';
            div.innerHTML = `
                <p class="font-bold text-gray-800">${enrollment.title}</p>
                <p class="text-sm text-gray-600">Estudiante: ${enrollment.email}</p>
                <p class="text-sm text-gray-600">Info Personal: ${enrollment.personal_info.substring(0, 50)}...</p>
                <a href="${enrollment.payment_capture_url}" target="_blank" class="text-xs text-blue-600 hover:underline mt-2 inline-block">Ver Comprobante de Pago</a>
                <div class="mt-3 flex space-x-2">
                    <button data-id="${enrollment.id}" data-status="accepted" class="status-btn px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Aprobar</button>
                    <button data-id="${enrollment.id}" data-status="rejected" class="status-btn px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Rechazar</button>
                </div>
            `;
            pendingEnrollmentsDiv.appendChild(div);
        });

        // Añadir listeners para los botones de aprobación/rechazo
        document.querySelectorAll('.status-btn').forEach(button => {
            button.addEventListener('click', updateEnrollmentStatus);
        });
    }

    // --- 3. Lógica de Aprobación/Rechazo ---
    async function updateEnrollmentStatus(e) {
        const enrollmentId = e.target.getAttribute('data-id');
        const newStatus = e.target.getAttribute('data-status');

        const { ok, data } = await fetchData('/.netlify/functions/admin?action=updateEnrollmentStatus', 'POST', {
            enrollmentId: parseInt(enrollmentId),
            newStatus
        });

        if (ok) {
            alert(`Inscripción ${enrollmentId} ha sido ${newStatus}.`);
            loadPendingEnrollments(); // Recargar la lista
        } else {
            alert(data.message || 'Error al actualizar el estado.');
        }
    }

    // --- 4. Lógica de Agregar Curso ---
    addCourseForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addCourseForm);
        const courseData = Object.fromEntries(formData.entries());

        const { ok, data } = await fetchData('/.netlify/functions/admin?action=addCourse', 'POST', {
            title: courseData.title,
            description: courseData.description,
            videoUrl: courseData.videoUrl 
        });

        if (ok) {
            alert(data.message);
            addCourseForm.reset();
            loadPublishedCourses(); // Recargar la lista de cursos publicados
        } else {
            alert(data.message || 'Error al agregar el curso.');
        }
    });


    // --- Inicialización ---
    loadPublishedCourses();
    loadPendingEnrollments();
});