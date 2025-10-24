const { Client } = require('pg');
const jwt = require('jsonwebtoken');

// Función de utilidad para verificar JWT (debes crearla)
const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET); 

exports.handler = async (event, context) => {
    const courseId = event.queryStringParameters.courseId;
    const authHeader = event.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'No autorizado' }) };

    try {
        const decoded = verifyToken(token);
        const client = new Client({ connectionString: process.env.DATABASE_URL });
        await client.connect();

        // 1. Verificar inscripción y contador de descargas
        const checkRes = await client.query(
            `SELECT t1.download_count, t2.video_drive_url 
             FROM enrollments t1 JOIN courses t2 ON t1.course_id = t2.id
             WHERE t1.user_id = $1 AND t1.course_id = $2 AND t1.status = 'accepted'`,
            [decoded.userId, courseId]
        );

        const enrollment = checkRes.rows[0];

        if (!enrollment) {
            return { statusCode: 403, body: JSON.stringify({ message: 'No estás inscrito o tu inscripción está pendiente.' }) };
        }

        if (enrollment.download_count >= 3) {
            return { statusCode: 403, body: JSON.stringify({ message: 'Límite de 3 descargas alcanzado.' }) };
        }

        // 2. Incrementar el contador y obtener la URL
        await client.query(
            `UPDATE enrollments SET download_count = download_count + 1 
             WHERE user_id = $1 AND course_id = $2`,
            [decoded.userId, courseId]
        );

        // NOTA: La URL de Drive DEBE ser un enlace de descarga directa. 
        // Si usas la API de Google Drive, aquí es donde generarías el enlace temporal.
        const downloadUrl = enrollment.video_drive_url; 

        return { 
            statusCode: 200, 
            body: JSON.stringify({ url: downloadUrl, downloadsLeft: 3 - (enrollment.download_count + 1) }) 
        };
    } catch (error) {
        return { statusCode: 401, body: JSON.stringify({ message: 'Token inválido o expirado' }) };
    }
};