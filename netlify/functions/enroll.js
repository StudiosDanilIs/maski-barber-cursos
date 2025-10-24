const formidable = require('formidable')
exports.handler = async (event) => {
  if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  const form = new formidable.IncomingForm()
  return new Promise((resolve) => {
    form.parse(event, (err, fields, files) => {
      if(err) return resolve({ statusCode: 500, body: 'Error parsing form' })
      console.log('Received enroll:', fields, Object.keys(files))
      return resolve({ statusCode: 200, body: JSON.stringify({ message: 'enrollment received', fields }) })
    })
  })
}
