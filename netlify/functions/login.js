const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = new Pool({ connectionString: process.env.NEON_DB_URL })

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || '{}')
    if(!email || !password) return { statusCode: 400, body: 'email+password required' }
    const res = await pool.query('SELECT id,email,password_hash,role,full_name FROM users WHERE email=$1', [email])
    if(res.rowCount === 0) return { statusCode: 401, body: 'Invalid credentials' }
    const user = res.rows[0]
    const ok = await bcrypt.compare(password, user.password_hash)
    if(!ok) return { statusCode: 401, body: 'Invalid credentials' }
    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return { statusCode: 200, body: JSON.stringify({ token }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Server error' }
  }
}
