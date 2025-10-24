const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.NEON_DB_URL })

exports.handler = async (event) => {
  // This endpoint should be protected (admin only). For brevity, we assume valid JWT with role check.
  try {
    const auth = event.headers.authorization
    if(!auth) return { statusCode: 401, body: 'Unauthorized' }
    const token = auth.split(' ')[1]
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if(payload.role !== 'admin') return { statusCode: 403, body: 'Forbidden' }

    if(event.httpMethod === 'GET'){
      const res = await pool.query('SELECT e.*, u.email, u.full_name, c.title as course_title FROM enrollments e JOIN users u ON u.id=e.user_id JOIN courses c ON c.id=e.course_id ORDER BY e.created_at DESC')
      return { statusCode: 200, body: JSON.stringify(res.rows) }
    }

    if(event.httpMethod === 'POST'){
      const { enrollmentId, decision } = JSON.parse(event.body || '{}')
      if(!enrollmentId || !['approved','rejected'].includes(decision)) return { statusCode: 400, body: 'bad request' }
      await pool.query('UPDATE enrollments SET status=$1, updated_at=now() WHERE id=$2', [decision, enrollmentId])
      return { statusCode: 200, body: JSON.stringify({ message: 'updated' }) }
    }

    return { statusCode: 405, body: 'method not allowed' }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: 'server error' }
  }
}
