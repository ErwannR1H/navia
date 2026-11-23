# Navia

Aplicación web estática desplegable en Vercel, con Supabase Auth y PostgreSQL para los datos persistentes de perfiles, avance académico, tickets, reclamaciones y comunidad.

Enlace vercel : https://navia-fawn.vercel.app

## Ejecutar en local

La aplicación no necesita un proceso de compilación. Para probar todas sus funciones, incluido el inicio de sesión, hay que ejecutar también la función de Vercel `/api/config`; por eso un servidor estático simple no es suficiente.

### Requisitos

- Node.js LTS y npm.
- Un proyecto Supabase configurado según la sección **Preparar Supabase**. No hace falta instalar PostgreSQL localmente: la aplicación usa la base de datos alojada en Supabase.
- Vercel CLI. Se puede instalar globalmente con `npm install --global vercel`.

### Pasos

1. Abre una terminal en la carpeta del proyecto e instala las dependencias:

   ```bash
   npm install
   ```

2. Configura las variables que necesita `/api/config`. Hay dos opciones:

   - **Usar el proyecto Vercel existente:** inicia sesión y enlaza este directorio con el proyecto. Después, descarga las variables de desarrollo:

     ```bash
     vercel login
     vercel link
     vercel env pull .env.local
     ```

   - **Sin variables disponibles en Vercel:** crea `.env.local` en la raíz del proyecto y copia los valores de **Supabase → Project Settings → API**:

     ```dotenv
     SUPABASE_URL=https://<project-ref>.supabase.co
     SUPABASE_ANON_KEY=<clave-publica-anon>
     ```

   Usa únicamente la clave pública `anon` para este prototipo; nunca pongas `service_role` en `.env.local`. El archivo está excluido de Git por `.gitignore`: no lo publiques ni lo envíes junto con el código.

3. Si todavía no preparaste la base de datos, ejecuta `supabase/schema.sql` en **Supabase → SQL Editor** y crea las cuentas de prueba siguiendo la sección **Preparar Supabase**.
4. Inicia el servidor local de Vercel:

   ```bash
   vercel dev
   ```

5. Abre la dirección que muestra la terminal (normalmente `http://localhost:3000`). Para detener el servidor, pulsa `Ctrl+C`.

La aplicación carga la configuración desde `/api/config`, que lee `SUPABASE_URL` y `SUPABASE_ANON_KEY` del entorno y las entrega al navegador. El navegador se conecta directamente a Supabase para autenticación, datos y archivos; no se necesita una base de datos local. Comprueba el inicio de sesión, la edición del perfil, el historial y la persistencia después de recargar la página.

## Preparar Supabase

1. Crea un proyecto Supabase y abre **SQL Editor**.
2. Ejecuta el contenido de [`supabase/schema.sql`](./supabase/schema.sql). El script crea las tablas, las políticas RLS, los procedimientos de tickets/comunidad y el bucket privado de adjuntos; también carga de forma idempotente los cursos de las mallas. Si ya configuraste Supabase, vuelve a ejecutar el script después de actualizar el repositorio para añadir la tabla de cursos y la política que permite eliminar publicaciones propias.
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

Los estudiantes completan su perfil académico al iniciar sesión por primera vez. Las tablas `profiles` y `student_data` están protegidas para que cada usuario acceda a sus propios datos; el historial y el ciclo preparado se guardan en `student_data`. El personal administrador puede consultar tickets activos y cerrados, reabrirlos al responder, y gestionar el estado y las respuestas de las reclamaciones mediante políticas RLS basadas en el rol `admin`.


### Problemas frecuentes

- **`/api/config` devuelve 503:** faltan `SUPABASE_URL` o `SUPABASE_ANON_KEY`, o Vercel CLI no está leyendo `.env.local`. Revisa los nombres y vuelve a iniciar `vercel dev`.
- **`/api/config` devuelve 404:** probablemente se inició un servidor estático en lugar de `vercel dev`. Ese servidor no ejecuta la función `api/config.js`.
- **No se puede iniciar sesión o guardar datos:** revisa que la URL y la clave correspondan al mismo proyecto Supabase, que las tablas y políticas de `supabase/schema.sql` estén instaladas y que la cuenta tenga un perfil.

## Desplegar en Vercel

1. Importa el repositorio en Vercel como un proyecto estático; no hace falta ejecutar un build.
2. En **Project Settings → Environment Variables**, configura para los entornos que vayas a publicar:
   - `SUPABASE_URL`: URL del proyecto Supabase.
   - `SUPABASE_ANON_KEY`: clave pública/anon de Supabase.
3. Vuelve a desplegar. La función [`api/config.js`](./api/config.js) entrega estas dos variables al navegador; la clave `service_role` **no debe** configurarse ni exponerse en el cliente.
4. Prueba el inicio de sesión, guarda un perfil, marca cursos, crea un ticket y verifica la persistencia tras cerrar y volver a abrir sesión.

Para probar la función `/api/config` localmente se necesita Vercel CLI (`vercel dev`) y las mismas variables de entorno; un servidor estático simple no ejecuta funciones de Vercel.

La app simula el flujo visual de Microsoft, pero autentica con Supabase Email/Password; no valida cuentas Microsoft reales. El tutorial guiado presenta el perfil y las funciones principales, incluida la FAQ, los tickets y el Libro de reclamaciones. La FAQ es pública; los tickets y reclamaciones requieren una sesión. Los adjuntos son privados, limitados a 5 MB y a imágenes/PDF.
