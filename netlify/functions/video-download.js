const { Pool } = require('pg')
const fetch = require('node-fetch')
const { google } = require('googleapis')
const pool = new Pool({ connectionString: process.env.NEON_DB_URL })

async function getAccessToken(){
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY && process.env.GOOGLE_DRIVE_PRIVATE_KEY.replace(/\\n/g, '\n')
  if(!clientEmail || !privateKey) throw new Error('Drive credentials not set')
  const jwtClient = new google.auth.JWT(
    clientEmail,
    null,
    privateKey,
    ['https://www.googleapis.com/auth/drive.readonly']
  )
  const tokens = await jwtClient.authorize()
  return tokens.access_token
}

exports.handler = async (event) => {
  try {
    if(event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
    const auth = event.headers.authorization
    if(!auth) return { statusCode: 401, body: 'Unauthorized' }
    const token = auth.split(' ')[1]
    const jwt = require('jsonwebtoken')
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const userId = payload.sub

    const body = JSON.parse(event.body || '{}')
    const { videoId } = body
    if(!videoId) return { statusCode: 400, body: 'videoId required' }

    // 1) get video info and course
    const vres = await pool.query('SELECT v.*, c.id as course_id FROM videos v JOIN courses c ON v.course_id=c.id WHERE v.id=$1', [videoId])
    if(vres.rowCount === 0) return { statusCode: 404, body: 'Video not found' }
    const video = vres.rows[0]

    // 2) check enrollment approved
    const eres = await pool.query('SELECT * FROM enrollments WHERE user_id=$1 AND course_id=$2 AND status=$3', [userId, video.course_id, 'approved'])
    if(eres.rowCount === 0) return { statusCode: 403, body: 'No access to this video' }

    // 3) check/download count (transaction)
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const cur = await client.query('SELECT downloads_count FROM video_downloads WHERE user_id=$1 AND video_id=$2 FOR UPDATE', [userId, videoId])
      let count = 0
      if(cur.rowCount === 0){
        // insert new
        await client.query('INSERT INTO video_downloads (user_id, video_id, downloads_count, last_download_at) VALUES ($1,$2,1,now())', [userId, videoId])
        count = 1
      } else {
        count = cur.rows[0].downloads_count
        if(count >= video.max_downloads_per_user){
          await client.query('ROLLBACK')
          return { statusCode: 403, body: JSON.stringify({ error: 'download_limit_reached', downloads: count }) }
        }
        await client.query('UPDATE video_downloads SET downloads_count = downloads_count + 1, last_download_at = now() WHERE user_id=$1 AND video_id=$2', [userId, videoId])
        count = count + 1
      }
      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    // 4) get Drive access token and fetch file
    const accessToken = await getAccessToken()
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${video.drive_file_id}?alt=media`
    const res = await fetch(driveUrl, { headers: { Authorization: `Bearer ${accessToken}` } })
    if(!res.ok) return { statusCode: 502, body: 'Error fetching file from Drive' }
    const buffer = await res.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    const disposition = `attachment; filename="${video.title.replace(/[^a-z0-9\.\-]/gi,'_')}.mp4"`

    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition
      },
      body: base64
    }

  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
