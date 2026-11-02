# Target GYM — Sistema de gestión de gimnasio

Sistema completo con **React/Vite + Express + PostgreSQL**: agenda pública,
cuentas por rol, socios, planes, pagos manuales, membresías, reservas, asistencia
y reportes. Preparado para **Vercel + Neon**, pero **no desplegado ni probado
contra una cuenta Neon real**.

El [informe único de diseño y ejecución](info/Plan%20de%20diseno%20y%20ejecucion.md)
registra decisiones y evidencia. Las consignas están en
[Entrega 3](info/Entrega%203%20-%20Frontend%20React.md) y
[Sistema completo](info/Consigna%20-%20Sistema%20completo.md).

## Ejecutar localmente

Requiere Node **24.x** y npm. Ejecutar los comandos desde la raíz del repositorio.
El único lockfile vigente es el de la raíz; npm instala ambos workspaces.

```powershell
npm ci
npm run admin:create -- --local
```

El alta inicial es interactiva: nombre, apellido, email y contraseña de al menos
12 caracteres con mayúscula y número. La contraseña no se muestra. **No existen
usuarios ni contraseñas predeterminados**.

Después, en dos terminales:

```powershell
npm run dev:backend
```

```powershell
npm run dev:frontend
```

Abrir **http://127.0.0.1:5173**. La API escucha en **127.0.0.1:3000** y Vite
proxifica `/api`, sin necesitar CORS ni guardar credenciales en React.

El modo local usa PostgreSQL embebido (PGlite) y conserva datos y el secreto de
sesión en `backend\.local-data`, excluido de Git. **Detener el backend antes de
ejecutar otra migración o alta inicial en la misma base local**: PGlite no es
un servidor compartido entre procesos. Las pruebas usan otra base aislada.

### Primer recorrido

1. Ingresar con el administrador creado.
2. En **Gestión → Planes**, configurar los precios reales y el descuento anual.
   Los precios empiezan sin configurar; no se inventan importes.
3. Crear un instructor y una clase con fecha futura, duración y cupo.
4. Registrar un socio desde la web o desde Gestión.
5. Registrar su pago manual: la membresía recién entonces queda activa.
6. El socio puede reservar, consultar/cancelar inscripciones y ver su asistencia.
7. Desde el inicio de la clase, el instructor asignado o el administrador registra
   presentes/ausentes. El historial acredita solo asistencias a clases finalizadas.

## Roles y reglas

| Rol | Operaciones |
|---|---|
| Visitante | Presentación, agenda y disponibilidad, registro e ingreso |
| Socio | Perfil, solicitud de plan/renovación, membresía y pagos propios, reserva/cancelación e historial |
| Administrador | Socios y estados, instructores, CRUD/cancelación de clases, planes/precios, pagos, asistencia y reportes |
| Instructor | Perfil, clases asignadas y asistencia de sus propios participantes |

- Registro desde **16 años inclusive**, email/DNI únicos y contraseña de 8 a 128
  caracteres, con mayúscula y número.
- Planes de **1/3/12 meses calendario**, ajustando al último día válido.
  La renovación anticipada se suma al vencimiento vigente.
- El servidor calcula el importe; el descuento anual no se traslada a otros planes.
  Un UUID identifica cada operación de pago para que reintentar no duplique la renovación.
- Solo socios y membresías activos pueden reservar. No hay sobreventa ni reservas
  activas duplicadas. El cupo se deriva de Pendientes, Confirmadas y En curso.
- Cancelación propia con **al menos 2 horas** de anticipación; repetirla no
  libera un segundo lugar.
- Gracia de **3 días solo por vencimiento**, conservando el lugar. Sin renovación,
  se cancela a los tres días exactos o al inicio de la clase, lo que ocurra primero.
- Suspensión/baja bloquea nuevas reservas y cancela las futuras. La baja de socios
  y clases conserva historial; no borra pagos ni relaciones.
- Los estados se concilian en el servidor antes de las operaciones, también si
  no hubo una pestaña abierta. La agenda se consulta cada **30 segundos**.
- Las solicitudes de contratación/renovación se guardan; **no son cobros online**.

## Arquitectura y API

```text
api\index.js              Entrada serverless de Vercel
backend\src\             Routes, Controllers, Services, Repositories,
                         Models, Middlewares, Exceptions y Responses
backend\src\database\    Esquema y adaptadores PostgreSQL/PGlite
backend\src\tests\       Pruebas de reglas, HTTP y persistencia
frontend\src\            Páginas, componentes, servicios, hooks y pruebas
e2e\                    Recorridos de navegador
info\                   Consignas, requisitos y plan único
.createapp\              Política y referencias locales
```

La lógica está en Services; SQL parametrizado y relaciones en Repositories/esquema.
Las transacciones bloquean una fila compartida para serializar cambios de cupos,
pagos y estados incluso entre instancias PostgreSQL. Los modelos originales se
conservan como documentación estructural; los DTO operativos vienen de SQL.

Sesiones persistidas, cookies HttpOnly/SameSite, Secure en producción, CSRF,
contraseñas con scrypt, límites de autenticación y errores centralizados.
React no almacena contraseñas ni tokens de sesión en localStorage.

Todos los recursos están bajo `/api`: `auth`, `clases`, `planes`, `socios`,
`instructores`, `pagos`, `inscripciones`, `mi-cuenta`, `mi-membresia`,
`mis-pagos`, `mi-historial`, `reportes`, `health` y `maintenance`.
Éxito: `{success:true,data:...}`. Error: `{success:false,message:...}`.
Eliminar una clase conserva HTTP 200 con `data:null`.

La zona horaria del gimnasio es `America/Argentina/Buenos_Aires`.
La navegación y el estado de sesión usan actualizaciones de la misma prioridad
para evitar redirecciones contradictorias al ingresar, registrarse o salir.

## Preparar Neon y Vercel

La aplicación **no crea servicios, cuentas ni despliegues automáticamente**.

1. Crear/configurar una base Neon y guardar su URL PostgreSQL con TLS en
   `backend\.env`, tomando como referencia [el ejemplo](backend/.env.example).
   No colocar secretos en variables `VITE_*`, archivos públicos ni en el chat.
2. Usar `DATABASE_MODE=postgres` y ejecutar:

   ```powershell
   npm run db:migrate
   npm run admin:create
   ```

3. En Vercel, seleccionar la raíz del repositorio y Node 24.x. El
   [archivo de configuración](vercel.json) declara build, salida de Vite,
   rutas API/SPA y un cron diario compatible con Hobby.
4. Configurar `DATABASE_URL`, `SESSION_SECRET` y `CRON_SECRET` como variables
   privadas. Usar secretos aleatorios de al menos 32 caracteres.
   La URL agrupada de Neon es adecuada para conexiones serverless.
5. Tras autorizar el despliegue, comprobar `/api/health`, login/registro/cookies,
   rutas SPA directas, archivos estáticos, concurrencia desde varias instancias
   y ejecución del cron con su autorización.

**Nunca usar la base local en Vercel**: el adaptador lo rechaza explícitamente.
Las migraciones se ejecutan por separado; no desde cada invocación serverless.
El cron diario complementa la conciliación por operación; no promete ejecución
al minuto ni refresco instantáneo.

## Verificar

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
npm audit
```

Validación del rediseño: **26 pruebas frontend y 3 recorridos Playwright**,
lint y build de producción correctos. Los recorridos verifican administración,
socio e instructor, pagos, reservas/cancelaciones, asistencia, responsive,
accesibilidad automatizada y zoom nativo de Chromium al 200%.
La entrega funcional previa verificó además 15 pruebas backend y auditoría de
dependencias; no se repitieron para este cambio exclusivamente visual.

Playwright levanta procesos aislados en **3011/5174**, usa solo datos sintéticos y
cierra los procesos al terminar. Si falta Chromium, ejecutar
`npx playwright install chromium` y reintentar. No poblar la base local del usuario
para probar. Las capturas y trazas quedan excluidas de Git.
Si el puerto frontend está ocupado, definir `E2E_FRONTEND_PORT` con otro puerto
libre. Se puede usar un Chromium existente con
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` apuntando a su ejecutable.

Los umbrales de disponibilidad <10 s y reserva <60 s se comprobaron localmente;
no son garantías para cualquier red. Axe no reemplaza una auditoría manual
completa. No se acreditan Safari/WebKit ni Neon/Vercel reales sin probarlos.

## Diseño y herramientas

Identidad **Cerca**, aprobada el 2 de noviembre de 2026: blanco `#FFFFFF`,
grafito `#2C3035` y Mandarina `#F48335` como acento, logo **Mancuerna**,
Outfit para titulares y DM Sans para lectura/controles, ambas locales y con
licencias OFL. Se aplica a portada, agenda, formularios y paneles por rol.
Los errores y confirmaciones conservan colores semánticos y texto explícito.

[Manual final de marca](info/marca/Manual-de-marca.md) ·
[Manual visual PDF](info/marca/Manual-de-marca.pdf) ·
[Manual visual HTML](info/marca/manual.html).

La fotografía de portada es una referencia de Danielle Cerullo / Unsplash,
identificada junto a la imagen. **No corresponde a Target GYM** y debe
reemplazarse por una foto autorizada real antes de representar sus instalaciones.
Autor/licencia en [ORIGEN.txt](frontend/public/marca/ORIGEN.txt).
No se inventan cifras ni testimonios reales.
Dirección: Gral. José de San Martín 2462, Florida, Vicente López.
No se inventan contactos/redes ausentes en las fuentes.

Superpowers está adaptado localmente mediante CreateApp y `ca-workflow`,
sin plugin global ni infraestructura Spec Kit. Leer
[AGENTS.md](AGENTS.md) y [POLICY.md](.createapp/POLICY.md).
Las extensiones recomendadas incluyen Oxlint, Playwright, Prettier,
Mermaid y REST Client; ESLint se conserva para los proyectos que lo utilicen.

```powershell
createapp . --doctor
```

No se realizaron commits ni publicación automática.
