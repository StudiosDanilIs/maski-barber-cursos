const { getDbClient, authenticateToken } = require('./utils/db');

async function adminHandler(event, context) {
    const user = event.user;
    if (user.role !== 'admin') {
        return { statusCode: 403, body: JSON.stringify({ message: 'Acceso denegado. Solo administradores.' }) };
    }

    const { action, ...payload } = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};
    
    const client = getDbClient();
    try {
        await client.connect();

        switch (action) {
            // --- LECTURA ---
            case 'getPendingEnrollments':
                const pendingRes = await client.query(`
                    SELECT e.id, e.personal_info, e.payment_capture_url, u.email, c.title 
                    FROM enrollments e 
                    JOIN users u ON e.user_id = u.id
                    JOIN courses c ON e.course_id = c.id
                    WHERE e.status = 'pending'
                `);
                return { statusCode: 200, body: JSON.stringify(pendingRes.rows) };

            case 'getCoursesAndStatus':
                // Usado tanto por Admin (todos) como Estudiante (arriba)
                const allCoursesRes = await client.query('SELECT * FROM courses');
                
                // Si es estudiante, también devuelve sus inscripciones para el dashboard
                if (user.role === 'student') {
                    const studentEnrollmentsRes = await client.query('SELECT course_id, status, download_count FROM enrollments WHERE user_id = $1', [user.userId]);
                    return { 
                        statusCode: 200, 
                        body: JSON.stringify({ courses: allCoursesRes.rows, enrollments: studentEnrollmentsRes.rows }) 
                    };
                }
                return { statusCode: 200, body: JSON.stringify({ courses: allCoursesRes.rows }) };

            // --- ESCRITURA (POST) ---
            case 'addCourse':
                if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Método no permitido' };
                const { title, description, videoUrl } = body;
                const insertRes = await client.query(
                    'INSERT INTO courses (title, description, video_drive_url) VALUES ($1, $2, $3) RETURNING *',
                    [title, description, videoUrl]
                );
                return { statusCode: 201, body: JSON.stringify({ message: 'Curso agregado.', course: insertRes.rows[0] }) };

            case 'updateEnrollmentStatus':
                if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Método no permitido' };
                const { enrollmentId, newStatus } = body;
                if (!['accepted', 'rejected'].includes(newStatus)) {
                    return { statusCode: 400, body: JSON.stringify({ message: 'Estado no válido.' }) };
                }
                await client.query('UPDATE enrollments SET status = $1 WHERE id = $2', [newStatus, enrollmentId]);
                return { statusCode: 200, body: JSON.stringify({ message: `Inscripción ${enrollmentId} actualizada a ${newStatus}.` }) };

            default:
                return { statusCode: 400, body: JSON.stringify({ message: 'Acción no reconocida.' }) };
        }
    } catch (error) {
        console.error('Admin Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error interno del servidor.' }) };
    } finally {
        await client.end();
    }
}

// Envuelve la función con la autenticación
exports.handler = authenticateToken(adminHandler);