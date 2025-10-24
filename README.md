# Course Enrollment Starter (Vite + React + Tailwind + Netlify Functions + Neon)

Repositorio inicial con la estructura para una plataforma donde:
- Usuarios se registran/inician sesión.
- Se inscriben a cursos subiendo comprobante de pago.
- Admin puede aprobar/rechazar inscripciones, agregar cursos/videos.
- Videos almacenados en Google Drive; el backend debe proxear descargas y limitar a 3 por usuario.

## Contenido generado
- Frontend: Vite + React + Tailwind (src/)
- Netlify Functions: netlify/functions/ (login, courses, enroll, video-download) — *stubs* para completar.
- DB schema: db/schema.sql

## Cómo usar (local)
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Variables de entorno (crear `.env` o configurar en Netlify):
   - `NEON_DB_URL` - conexión a Neon
   - `JWT_SECRET`
   - `CLOUDINARY_...` (si usas Cloudinary)
   - Google Drive service account credentials (if implementing Drive proxy)
3. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```
4. Para Netlify: deployar el build y habilitar Netlify Functions. Ver la documentación de Netlify para configurar variables de entorno.

## Notas
- Las funciones incluidas son ejemplos y deben integrarse con Neon (Postgres), Cloudinary/S3 y la Google Drive API.
- Implementa validaciones, hashing de contraseñas (bcrypt), y protección de endpoints en producción.
