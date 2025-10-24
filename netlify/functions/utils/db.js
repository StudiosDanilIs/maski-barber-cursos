const { Client } = require('pg');
const jwt = require('jsonwebtoken');

function getDbClient() {
    if (!process.env.DATABASE_URL) {
        // Lanza un error claro si la variable no está configurada en Netlify
        throw new Error("ERROR_DB: DATABASE_URL no está configurada en el entorno de Netlify.");
    }
    
    // El cliente se inicializa usando la URL completa de Neon
    return new Client({
        connectionString: process.env.DATABASE_URL
    });
}

/**
 * Middleware para autenticar al usuario usando JWT del header.
 * Si tiene éxito, adjunta la información del usuario (id, role) al objeto event.
 */
function authenticateToken(handler) {
    return async (event, context) => {
        const authHeader = event.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Acceso denegado. Token no proporcionado.' }) };
        }

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            event.user = user; // Información de usuario disponible en el handler
            return handler(event, context);
        } catch (error) {
            return { statusCode: 403, body: JSON.stringify({ message: 'Token inválido o expirado.' }) };
        }
    };
}

module.exports = {
    getDbClient,
    authenticateToken
};