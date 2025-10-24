const { Pool } = require('pg')
const formidable = require('formidable')
const { v2: cloudinary } = require('cloudinary')

const pool = new Pool({ connectionString: process.env.NEON_DB_URL })
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

function parseForm(event){
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm()
    form.parse(event, (err, fields, files) => {
      if(err) return reject(err)
      resolve({ fields, files })
    })
  })
}

function uploadToCloudinary(file){
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
      if(error) return reject(error)
      resolve(result)
    })
    const fs = require('fs')
    const rs = fs.createReadStream(file.filepath)
    rs.pipe(stream)
  })
}

exports.handler = async (event) => {
  try {
    // validate JWT
    const auth = event.headers.authorization
    if(!auth) return { statusCode: 401, body: 'Unauthorized' }
    const token = auth.split(' ')[1]
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const userId = payload.sub

    if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
    const { fields, files } = await parseForm(event)
    const courseId = fields.courseId
    const paymentMethod = fields.paymentMethod || 'transfer'
    const notes = fields.notes || null

    let payment_proof_url = null
    if(files && files.paymentProof){
      const uploadRes = await uploadToCloudinary(files.paymentProof)
      payment_proof_url = uploadRes.secure_url
    }

    // insert enrollment
    await pool.query(
      `INSERT INTO enrollments (user_id, course_id, status, payment_method, payment_proof_url, notes) VALUES ($1,$2,'pending',$3,$4,$5)`,
      [userId, courseId, paymentMethod, payment_proof_url, notes]
    )

    return { statusCode: 200, body: JSON.stringify({ message: 'enrollment_created' }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
