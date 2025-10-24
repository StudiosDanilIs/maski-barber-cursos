const { getDbClient } = require('./utils/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para manejar la conexión y la query, esencial para serverless
async function runQuery(query, params) {
    const client = getDbClient();
    try {
        await client.connect();
        const res = await client.query(query, params);
        return res;
    } finally {
        // Asegurarse de que la conexión se cierre SIEMPRE
        await client.end(); 
    }
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método no permitido' };
    }

    try {
        const { email, password, isRegister } = JSON.parse(event.body);
        
        if (isRegister) {
            // Lógica de Registro
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            // Usamos 'student' por defecto (definido en el SQL)
            const insertQuery = 'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, role';
            const res = await runQuery(insertQuery, [email, hashedPassword]);
            
            const user = res.rows[0];
            const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            return { statusCode: 201, body: JSON.stringify({ token, role: user.role, message: 'Usuario registrado exitosamente.' }) };
            
        } else {
            // Lógica de Login
            const res = await runQuery('SELECT id, password_hash, role FROM users WHERE email = $1', [email]);
            const user = res.rows[0];

            if (!user || !await bcrypt.compare(password, user.password_hash)) {
                return { statusCode: 401, body: JSON.stringify({ message: 'Credenciales inválidas' }) };
            }

            const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            return { statusCode: 200, body: JSON.stringify({ token, role: user.role, message: 'Inicio de sesión exitoso.' }) };
        }
    } catch (error) {
        // Manejo de errores que asegura respuesta JSON
        if (error.code === '23505') { 
             return { statusCode: 400, body: JSON.stringify({ message: 'El correo electrónico ya está registrado.' }) };
        }
        
        console.error('Error en Login Function:', error.message || error);
        
        // Devolver un JSON de error 500 para evitar el error 'JSON.parse' en el frontend
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                message: 'Error de servidor. Revisa los logs de Netlify para diagnóstico.',
                // debug: error.message // Descomentar solo para debug
            }) 
        };
    }
};