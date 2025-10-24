const { Client } = require('pg');
const jwt = require('jsonwebtoken');

function getDbClient() {
    // ESTE ES EL PUNTO DONDE SE USA LA VARIABLE DE NETLIFY
    if (!process.env.DATABASE_URL) {
        // Esto te ayudará a diagnosticar si la variable no se cargó
        throw new Error("DATABASE_URL no está configurada en el entorno.");
    }

    return new Client({
        connectionString: process.env.DATABASE_URL
    });
}

// Middleware de autenticación y autorización
function authenticateToken(handler) {
    return async (event, context) => {
        const authHeader = event.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Acceso denegado. Token no proporcionado.' }) };
        }

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            // Pasa la información del usuario al handler
            event.user = user;
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