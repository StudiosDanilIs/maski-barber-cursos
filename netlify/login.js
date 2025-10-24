// Ejemplo conceptual. Necesitarás instalar las librerías 'pg', 'bcrypt', 'jsonwebtoken'
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
    const { email, password } = JSON.parse(event.body);
    const client = new Client({ connectionString: process.env.DATABASE_URL });

    try {
        await client.connect();
        const res = await client.query('SELECT id, password_hash, role FROM users WHERE email = $1', [email]);
        const user = res.rows[0];

        if (!user || !await bcrypt.compare(password, user.password_hash)) {
            return { statusCode: 401, body: JSON.stringify({ message: 'Credenciales inválidas' }) };
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        return { statusCode: 200, body: JSON.stringify({ token, role: user.role }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Error en el servidor' }) };
    } finally {
        await client.end();
    }
};