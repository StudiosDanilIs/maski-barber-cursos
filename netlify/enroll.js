const { getDbClient, authenticateToken } = require('./utils/db');

async function enrollHandler(event, context) {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Método no permitido' };
    
    // El usuario autenticado viene de utils/db.js
    const userId = event.user.userId;
    const { courseId, paymentCaptureUrl, personalInfo } = JSON.parse(event.body);

    if (!courseId || !paymentCaptureUrl || !personalInfo) {
        return { statusCode: 400, body: JSON.stringify({ message: 'Faltan datos de curso, pago o información personal.' }) };
    }

    const client = getDbClient();
    try {
        await client.connect();
        
        const query = `
            INSERT INTO enrollments (user_id, course_id, payment_capture_url, personal_info, status)
            VALUES ($1, $2, $3, $4, 'pending')
            RETURNING id;
        `;
        await client.query(query, [userId, courseId, paymentCaptureUrl, personalInfo]);

        return { statusCode: 201, body: JSON.stringify({ message: 'Solicitud de inscripción enviada. Esperando la aprobación del administrador.' }) };

    } catch (error) {
        console.error('Error de inscripción:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error interno al procesar la inscripción.' }) };
    } finally {
        await client.end();
    }
}

// Exporta el handler envuelto con el middleware de autenticación
exports.handler = authenticateToken(enrollHandler);