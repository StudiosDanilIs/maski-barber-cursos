const { getDbClient, authenticateToken } = require('./utils/db');

async function downloadHandler(event, context) {
    if (event.httpMethod !== 'GET') return { statusCode: 405, body: 'Método no permitido' };
    
    const courseId = event.queryStringParameters.courseId;
    const userId = event.user.userId;
    const MAX_DOWNLOADS = 3; 

    if (!courseId) return { statusCode: 400, body: 'Falta el ID del curso.' };

    const client = getDbClient();
    try {
        await client.connect();

        // 1. Verificar inscripción, estado y contador
        const checkRes = await client.query(
            `SELECT t1.download_count, t2.video_drive_url 
             FROM enrollments t1 JOIN courses t2 ON t1.course_id = t2.id
             WHERE t1.user_id = $1 AND t1.course_id = $2 AND t1.status = 'accepted' FOR UPDATE`, // FOR UPDATE bloquea la fila
            [userId, courseId]
        );

        const enrollment = checkRes.rows[0];

        if (!enrollment) {
            return { statusCode: 403, body: JSON.stringify({ message: 'No tiene acceso a este curso o inscripción pendiente.' }) };
        }

        if (enrollment.download_count >= MAX_DOWNLOADS) {
            return { statusCode: 403, body: JSON.stringify({ message: `Límite de ${MAX_DOWNLOADS} descargas alcanzado.` }) };
        }

        // 2. Incrementar el contador (Transacción implícita por FOR UPDATE)
        await client.query(
            `UPDATE enrollments SET download_count = download_count + 1 
             WHERE user_id = $1 AND course_id = $2`,
            [userId, courseId]
        );

        // 3. Devolver la URL de descarga
        const downloadsLeft = MAX_DOWNLOADS - (enrollment.download_count + 1);
        
        return { 
            statusCode: 200, 
            body: JSON.stringify({ 
                url: enrollment.video_drive_url, 
                downloadsLeft: downloadsLeft,
                message: `Descarga iniciada. Te quedan ${downloadsLeft} descargas.` 
            }) 
        };
    } catch (error) {
        console.error('Error de descarga:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error interno en el servidor.' }) };
    } finally {
        await client.end();
    }
}

exports.handler = authenticateToken(downloadHandler);