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

1. Abrir **Acceso del equipo** (`/equipo`) e ingresar con el administrador creado.
2. En **Gestión → Planes**, configurar los precios reales y el descuento anual.
   Los precios empiezan sin configurar; no se inventan importes.
3. Crear un instructor y una clase con fecha futura, duración y cupo.
4. Desde **Asociate**, el socio elige un plan con precio y efectivo/transferencia.
   También se puede crear desde Gestión y entregarle una invitación de acceso.
5. Verificar el dinero recibido y registrar su pago manual: la membresía recién
   entonces queda activa. Informar una transferencia no confirma el cobro.
6. El socio puede reservar, consultar/cancelar inscripciones y ver su asistencia.
7. Desde el inicio de la clase, el instructor asignado o el administrador registra
   presentes/ausentes. El historial acredita solo asistencias a clases finalizadas.

## Roles y reglas

### Asociarse, ingresar y administrar

- `/asociate`: plan, datos y método de pago obligatorios. `/registro` conserva
  compatibilidad y redirige, incluyendo el plan seleccionado desde portada.
- `/login`: **Ya soy socio**, con destino `/mi-espacio`; cuenta y membresía son
  estados diferentes. Pendientes pueden consultar y coordinar el pago, no
  reservar sin membresía activa.
- `/equipo`: login del equipo con la misma sesión y permisos. Administración
  entra a `/gestion`, con resumen de pagos/altas pendientes y vencimientos;
  instructores, a sus clases. Paneles sin navegación ni pie comerciales.
- Altas desde recepción: plan opcional, sin pedir contraseña al administrador.
  En la ficha del socio, **Generar enlace de acceso** y entregarlo personalmente.
  El socio elige su contraseña. Enlaces personales de un uso, 48 horas, solo
  hash en la base; generar otro invalida el anterior. No se envían correos.
- Efectivo: confirmar el cobro en recepción. Transferencia: coordinar datos por
  WhatsApp y verificar dinero recibido. El aviso **Ya realicé la transferencia**
  crea una tarea de revisión, nunca un pago ni una membresía.
- Tarjeta: se puede solicitar cuando el plan y administración lo permiten;
  se abona presencialmente y queda pendiente hasta la confirmación de recepción.
- No hay pasarela online, datos bancarios inventados, archivos de comprobantes
  ni doble factor en esta etapa. «Tarjeta» en pagos administrativos continúa
  siendo el registro de un cobro externo, no un checkout web.

Detalle y evidencia en el [informe de cambios](info/Informe-de-asociacion-y-accesos.md).

| Rol | Operaciones |
|---|---|
| Visitante | Presentación, agenda y disponibilidad, registro e ingreso |
| Socio | Perfil, solicitud de plan/renovación, membresía y pagos propios, reserva/cancelación e historial |
| Administrador | Socios y estados, instructores, CRUD/cancelación de clases, planes/precios, pagos, asistencia y reportes |
| Instructor | Perfil, clases asignadas y asistencia de sus propios participantes |

- Registro desde **16 años inclusive**, email/DNI únicos y contraseña de 8 a 128
  caracteres, con mayúscula y número.
- Catálogo administrable de planes de **1 a 120 meses calendario**, ajustando al último día válido,
  o **1 a 3660 días corridos**; cada plan utiliza una sola unidad.
  Los identificadores anteriores se conservan, incluso fuera de la oferta pública.
  La renovación anticipada se suma al vencimiento vigente.
- El servidor calcula el importe y el descuento de cada plan sin trasladarlo a otros.
  Admite porcentaje o precio promocional fijo exacto, nunca ambos.
  Las tarifas fijas condicionadas solo al método se aplican automáticamente al
  elegirlo; otras promociones condicionadas requieren confirmación administrativa.
  Cambiar el método reinicia las confirmaciones. Los requisitos de acceso
  se verifican por separado, también al cambiar administrativamente de plan.
  Un UUID identifica cada operación de pago para que reintentar no duplique la renovación.
- **Gestión → Pagos → Eliminar pago** permite corregir un duplicado con confirmación
  y motivo opcional. Se anula, no se destruye: conserva importe, método, fecha,
  autor/fecha de anulación y períodos originales. La membresía se recalcula
  usando las duraciones contratadas y los pagos válidos, no el catálogo actual;
  las reservas se ajustan a la vigencia resultante sin borrar asistencias.
  Los anulados se ocultan en caja salvo **Mostrar pagos anulados**, y se
  identifican en los historiales del socio y administración.
  No se devuelve dinero automáticamente ni se restauran solicitudes anteriores.
  Repetir una anulación no modifica su auditoría; reusar el UUID de un pago
  anulado se rechaza, no lo reactiva.
- Deshabilitar oculta el plan de portada/registro y bloquea nuevos contratantes,
  permitiendo renovar a quienes ya tuvieron una membresía de ese plan.
  Eliminar impide también renovar, sin borrar historial ni vigencias actuales.
  El administrador puede cambiar un plan vigente desde la ficha del socio;
  conserva fechas y pagos, no genera un cobro y registra autor/fecha.
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

Catálogo público: `GET /api/planes`. Administración: `GET /api/gestion/planes`,
`POST /api/planes`, `PUT /api/planes/:tipo`, `DELETE /api/planes/:tipo`.
Planes elegibles para renovar: `GET /api/mi-membresia/planes`; por socio
para administración: `GET /api/socios/:id/planes`. Cambio administrativo:
`PUT /api/socios/:id/plan`. Las mutaciones requieren administrador y CSRF,
excepto solicitudes propias de socios, que mantienen su ruta y permisos.
Migración versionada 2 en `backend/src/database/planes.sql`: mantiene los
identificadores iniciales y agrega catálogo dinámico, estados y snapshots.
Los descuentos antiguos no registrados no se reconstruyen con reglas actuales.

Migración 3 en `backend/src/database/accesos.sql`: método/fecha de solicitud,
transferencia informada, primer acceso pendiente e invitaciones. Conserva las
cuentas y membresías existentes, sin activaciones retroactivas. Nuevas rutas:
`POST /api/socios/:id/invitacion` (administrador),
`POST /api/auth/activar-acceso` (token personal, contraseña, CSRF y límite de
autenticación), `POST /api/mi-membresia/pago-reportado` (socio, solicitud propia).

Migración 4 en `backend/src/database/metodos-pago.sql`: estados persistentes
de Efectivo, Transferencia y Tarjeta. **Gestión → Métodos de pago** permite
habilitar/deshabilitar. Apagarlos impide nuevas asociaciones y renovaciones
de socios, pero conserva solicitudes anteriores, transferencias informadas
e historial. El administrador puede seguir cobrando con todos; caja muestra
un aviso si el seleccionado está deshabilitado. Esto no permite ignorar
restricciones del plan (por ejemplo, jubilados solo en efectivo).
Tarjeta permite solicitar un pago presencial, sin pasarela online.
Si no hay métodos habilitados, el socio recibe un aviso para consultar en
recepción y no puede enviar una nueva asociación/solicitud. El alta
administrativa y caja siguen disponibles.
Catálogo elegible: `GET /api/metodos-pago`. Catálogo administrativo:
`GET /api/gestion/metodos-pago`. Configuración:
`PUT /api/metodos-pago/:codigo` con `{habilitado:boolean}`, administrador y
CSRF. Altas públicas y renovaciones validan disponibilidad dentro de su
transacción; la solicitud de renovación exige un método, no admite omitirlo.

Migración 5 en `backend/src/database/anulaciones.sql`: conserva los períodos
originales, la duración contratada y la auditoría de anulación. En pagos previos
infiere los meses calendario desde sus períodos históricos, sin usar la
duración actual del catálogo; un historial incompatible falla explícitamente.
`DELETE /api/pagos/:id`, con `{motivo?:string}` de hasta 500 caracteres,
requiere administrador y CSRF; devuelve `data:{anulado:true}`. Registro,
anulación y recálculo comparten la transacción serializada. No borra el pago
ni permite anular pagos desde una cuenta de socio.

Migraciones 6–8: `tarifas.sql`, `catalogo-florida.sql` y
`condiciones-tarifas.sql`. Agregan días, precios promocionales fijos,
descripciones, requisitos y restricciones de método, con snapshots de
duración, descuento monetario y verificación en el historial.
La migración 7 importa **una sola vez** los seis planes confirmados por
WhatsApp, deshabilitando la oferta anterior sin borrar pagos ni membresías.
Reiniciar o migrar nuevamente no sobrescribe cambios posteriores del administrador.
Pases de día/semana/quincena: 1/7/15 períodos de 24 horas desde la
confirmación, o desde el vencimiento vigente al renovar anticipadamente.
Jubilados: mensual, efectivo y verificación manual de recepción; no se
almacenan documentos ni se supone una edad mínima.
FULL Target: mensual, acceso anunciado a todas las sedes, incluidas
San Fernando y Tigre; no implica integración con sistemas de otras sedes.
Precios, horarios, instalaciones y procedencia:
[fuentes verificadas](info/target-gym/FUENTES.md).

Todos los recursos están bajo `/api`: `auth`, `clases`, `planes`, `metodos-pago`, `socios`,
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

Validación del catálogo y ajustes de uso: **20 pruebas backend, 44 frontend y 4 recorridos Playwright**,
lint y build de producción correctos. Los recorridos verifican administración,
socio e instructor, pagos, reservas/cancelaciones, asistencia, responsive,
accesibilidad automatizada y zoom nativo de Chromium al 200%.
La auditoría de dependencias de la entrega funcional previa no se repitió;
este cambio no agrega paquetes. La migración se probó también sobre datos
del esquema anterior y con reapertura de PostgreSQL embebido.

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
Temporalmente, la cabecera y el pie usan solo **Target gym** en Outfit,
sin símbolo; los maestros Mancuerna se conservan. El favicon usa una T.
Los avisos transitorios se cierran a los 4 s (confirmación) o 8 s (error),
sin pausa por puntero/foco; conservan cierre manual y devuelven el foco si
estaba en el aviso. Los errores en campos/paneles no se ocultan.
Inicio muestra precios configurados en ARS por período, descuentos reales
y pago manual; se actualizan cada 30 s. Las tarjetas grises con borde
se centran y adaptan a cualquier cantidad; las filas incompletas también
quedan centradas. El panel reserva espacio para la barra de desplazamiento
para no moverse lateralmente entre secciones. Navegación reducida a Inicio,
Clases, Planes y accesos de sesión/rol. El menú móvil entra en 220 ms y
respeta movimiento reducido.

Los enlaces dentro de la misma página usan scroll suave, también al volver
al inicio o repetir la misma ancla. El foco acompaña el destino sin provocar
otro salto. Cambiar de página o preferir movimiento reducido usa navegación
inmediata; cambiar solo filtros de URL conserva posición y foco.

[Manual final de marca](info/marca/Manual-de-marca.md) ·
[Manual visual PDF](info/marca/Manual-de-marca.pdf) ·
[Manual visual HTML](info/marca/manual.html).

La fotografía de portada es una referencia de Danielle Cerullo / Unsplash,
sin leyenda visible por pedido del usuario. **No corresponde a Target GYM** y debe
reemplazarse por una foto autorizada real antes de representar sus instalaciones.
Autor/licencia en [ORIGEN.txt](frontend/public/marca/ORIGEN.txt).
No se inventan cifras ni testimonios reales.
Dirección: Gral. José de San Martín 2462, Florida, Vicente López.
Teléfono y horario semanal obtenidos de Maps; Instagram aportado por el usuario.
Fuente de contenido del pie y registro por dato:
[info/target-gym](info/target-gym/FUENTES.md).
WhatsApp **11 6824-4559** confirmado por el usuario; enlace internacional
`https://wa.me/5491168244559`, separado del teléfono fijo de Maps.
La grilla de Instagram no se carga como clases reales de la agenda.

Superpowers está adaptado localmente mediante CreateApp y `ca-workflow`,
sin plugin global ni infraestructura Spec Kit. Leer
[AGENTS.md](AGENTS.md) y [POLICY.md](.createapp/POLICY.md).
Las extensiones recomendadas incluyen Oxlint, Playwright, Prettier,
Mermaid y REST Client; ESLint se conserva para los proyectos que lo utilicen.

```powershell
createapp . --doctor
```

No se realizaron commits ni publicación automática.
