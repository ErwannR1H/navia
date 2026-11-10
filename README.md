# Navia

Aplicación web estática desplegable en Vercel, con Supabase Auth y PostgreSQL para los datos persistentes de perfiles, avance académico, tickets, reclamaciones y comunidad.

## Preparar Supabase

1. Crea un proyecto Supabase y abre **SQL Editor**.
2. Ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql). El script crea las tablas, las políticas RLS, los procedimientos de tickets/comunidad y el bucket privado de adjuntos. Si ya configuraste Supabase, vuelve a ejecutar el script después de actualizar el repositorio: añade de forma idempotente el estado y las respuestas de las reclamaciones, y permite eliminar comentarios propios.
3. En **Authentication → Users**, crea manualmente una cuenta por usuario y confirma el correo para el prototipo.
4. Crea su perfil inicial desde SQL Editor (reemplaza el correo):

   ```sql
   insert into public.profiles (id, email, role)
   select id, email, 'student'
   from auth.users
   where email = 'estudiante@usil.pe'
   on conflict (id) do nothing;
   ```

   Para el administrador, usa el mismo SQL y cambia `'student'` por `'admin'`. El rol se asigna en la base de datos; no existe un control para elevar privilegios desde la aplicación.
5. Supabase Auth exige contraseñas de al menos seis caracteres. Por eso `USIL` (4 caracteres) no se puede usar como contraseña en este flujo; para cuentas de demostración se puede usar, por ejemplo, `USIL01`. Una contraseña compartida y débil no es apropiada para información real.

Los estudiantes completan su perfil académico al iniciar sesión por primera vez. Las tablas `profiles` y `student_data` están protegidas para que cada usuario acceda a sus propios datos. El personal administrador puede consultar tickets activos y cerrados, reabrirlos al responder, y gestionar el estado y las respuestas de las reclamaciones mediante políticas RLS basadas en el rol `admin`.

## Desplegar en Vercel

1. Importa el repositorio en Vercel como un proyecto estático; no hace falta ejecutar un build.
2. En **Project Settings → Environment Variables**, configura para los entornos que vayas a publicar:
   - `SUPABASE_URL`: URL del proyecto Supabase.
   - `SUPABASE_ANON_KEY`: clave pública/anon de Supabase.
3. Vuelve a desplegar. La función [`api/config.js`](./api/config.js) entrega estas dos variables al navegador; la clave `service_role` **no debe** configurarse ni exponerse en el cliente.
4. Prueba el inicio de sesión, guarda un perfil, marca cursos, crea un ticket y verifica la persistencia tras cerrar y volver a abrir sesión.

Para probar la función `/api/config` localmente se necesita Vercel CLI (`vercel dev`) y las mismas variables de entorno; un servidor estático simple no ejecuta funciones de Vercel.

La app simula el flujo visual de Microsoft, pero autentica con Supabase Email/Password; no valida cuentas Microsoft reales. El tutorial guiado presenta el perfil y las funciones principales, incluida la FAQ, los tickets y el Libro de reclamaciones. La FAQ es pública; los tickets y reclamaciones requieren una sesión. Los adjuntos son privados, limitados a 5 MB y a imágenes/PDF.

## SLA, reclamaciones y límites del prototipo

Las prioridades se asignan por categoría: caída/seguridad = crítica (atención inmediata); recomendaciones/historial = alta (máximo 24 h); otros problemas de funcionalidad = media (2–5 días hábiles); problema visual menor = baja (5–10 días hábiles). Son estimaciones del documento SLA, no una garantía de servicio ni una medición automática.

La constancia de reclamación se puede imprimir o guardar como PDF desde el navegador. El formulario es una base para el prototipo y debe revisarse con asesoría local antes de presentarlo como un *Libro de reclamaciones* legalmente conforme. El nivel gratuito de Supabase/Vercel no garantiza por sí solo copias de seguridad diarias ni disponibilidad mensual de 99,5%; revisa las condiciones de cada proveedor antes de prometer esos SLA.