const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const pool = new Pool({ connectionString: process.env.NEON_DB_URL })

exports.handler = async (event) => {
  try {
    const { email, password, full_name, phone } = JSON.parse(event.body || '{}')
    if(!email || !password) return { statusCode: 400, body: 'email+password required' }
    const hashed = await bcrypt.hash(password, 10)
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING id,email,full_name`,
      [email, hashed, full_name||null, phone||null]
    )
    return { statusCode: 200, body: JSON.stringify({ user: res.rows[0] }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Server error' }
  }
}
