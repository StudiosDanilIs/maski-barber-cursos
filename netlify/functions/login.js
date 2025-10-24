const jwt = require('jsonwebtoken')

exports.handler = async (event) => {
  const { email, password } = JSON.parse(event.body || '{}')
  if(!email || !password) return { statusCode: 400, body: 'email+password required' }
  if(email === 'admin@example.com' && password === 'password'){
    const token = jwt.sign({ sub: 'demo-admin', role: 'admin', email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' })
    return { statusCode: 200, body: JSON.stringify({ token }) }
  }
  return { statusCode: 401, body: 'Invalid credentials' }
}
