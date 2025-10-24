# Course Enrollment - Full implementation starter

Esta versión incluye implementaciones para las Netlify Functions con integración a:
- Neon (Postgres) para la base de datos.
- Cloudinary para subir comprobantes de pago.
- Google Drive (cuenta de servicio) para servir/proxear descargas de vídeo y limitar descargas por usuario.

**IMPORTANTE**: Debes crear las variables de entorno indicadas en `.env.example` en el panel de Netlify (o en tu entorno local).

## Funciones incluidas (Netlify)
- `register` — registrar usuario (hash con bcrypt).
- `login` — login con JWT.
- `courses` — listar cursos desde la DB.
- `enroll` — subir comprobante a Cloudinary y crear inscripción (enrollments).
- `video-download` — valida inscripción aprobada, controla contador en `video_downloads`, y proxea el archivo desde Google Drive (devuelve el archivo base64 con headers).

## Requisitos
- Node 18+ (Netlify Functions use Node 18 runtime by default)
- Crear base de datos en Neon y ejecutar `db/schema.sql`
- Crear cuenta Cloudinary y Google Cloud service account con acceso a Drive API. Sube los vídeos a la cuenta Drive y guarda `fileId` en tabla `videos`.

## Cómo probar localmente
1. Instala dependencias:
   ```bash
   npm install
   # además instala deps para funciones:
   npm install pg bcryptjs jsonwebtoken cloudinary googleapis node-fetch formidable
   ```
2. Crea variables de entorno (localmente usar `.env` o exportarlas).
3. Ejecuta el frontend:
   ```bash
   npm run dev
   ```
4. Las funciones pueden probarse con Netlify CLI (`netlify dev`) o desplegándolas en Netlify.

## Notas de seguridad y límites
- Google Drive no es ideal como CDN; para producción con alto tráfico usa S3/R2 + CDN.
- Mantén `GOOGLE_DRIVE_PRIVATE_KEY` con saltos de línea reales (`\n` reemplazados por saltos).
- Limita tamaño de subida en Cloudinary y valida tipos MIME.

