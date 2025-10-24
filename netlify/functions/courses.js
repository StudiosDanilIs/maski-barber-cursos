const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.NEON_DB_URL })

exports.handler = async () => {
  try {
    const res = await pool.query('SELECT id,title,description,price,created_at FROM courses WHERE visible = true ORDER BY created_at DESC LIMIT 100')
    return { statusCode: 200, body: JSON.stringify(res.rows) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'Server error' }
  }
}
