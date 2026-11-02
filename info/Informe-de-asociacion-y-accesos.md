# Target GYM - Informe de asociacion y accesos

**Fecha:** 2 de noviembre de 2026.  
**Alcance:** implementacion local de la propuesta aprobada.  
**Estado:** cambios aplicados, persistentes y verificados localmente.

## 1. Decisiones aplicadas

Se distinguen tres intenciones sin duplicar el sistema de autenticacion:

| Persona | Entrada | Destino |
|---|---|---|
| Visitante nuevo | Asociate | Elegir plan, completar datos y metodo de pago |
| Socio con cuenta | Ya soy socio | Mi espacio |
| Administrador | Acceso del equipo | Resumen de gestion |
| Instructor | Acceso del equipo | Sus clases y asistencia |

Se conserva Cerca/Mandarina: blanco y grafito, Outfit/DM Sans y naranja
solo para acciones destacadas. El simbolo sigue temporalmente oculto.

## 2. Asociacion y pago

En [Asociate](../frontend/src/pages/RegistroPage.jsx), el plan habilitado
con precio y el metodo de pago son obligatorios en interfaz y servidor.
Las tarjetas de portada permiten entrar con un plan preseleccionado.
Se muestran precio por periodo completo, duracion y condiciones de descuento.
`/registro` sigue funcionando y redirige a `/asociate`.

**Crear la cuenta no activa una membresia.**

- **Efectivo:** cuenta creada, pago pendiente; se activa al confirmar el cobro.
- **Transferencia:** coordinar datos con el gimnasio. El socio puede informar
  que transfirio; el administrador debe verificar que recibio el dinero.
- Informar una transferencia no crea pagos, no activa membresias ni permite
  reservar sin cumplir las reglas existentes.
- La pantalla administrativa exige confirmar dinero recibido. Inicialmente
  propone el plan y metodo solicitados, sin aplicar descuentos condicionados
  por su cuenta.
- El servidor conserva el calculo de importes, descuentos confirmados,
  auditoria del administrador e idempotencia de pagos.

La confirmacion de caja aplica tambien a altas que el administrador carga
directamente. Activacion y acceso a la web son operaciones independientes.

## 3. Espacio del socio y portal del equipo

[Mi espacio](../frontend/src/pages/MiEspacioPage.jsx) muestra el estado real de
membresia, vencimiento y pago pendiente; permite coordinarlo y consultar la
agenda. Reservas, perfil, pagos e historial siguen disponibles en su navegacion.
Las renovaciones tambien permiten elegir efectivo o transferencia.

[Portal del equipo](../frontend/src/components/EquipoLayout.jsx): cabecera
compacta, navegacion lateral en escritorio y menu animado en mobile, con Escape,
foco visible y movimiento reducido. No repite el pie ni las secciones comerciales.

El [resumen administrativo](../frontend/src/pages/GestionInicioPage.jsx)
prioriza transferencias informadas, solicitudes de plan y membresias
vencidas/proximas a vencer en siete dias. Hay accesos a socios y pagos.

Todos usan la misma sesion. El rol decide el destino y los permisos se siguen
validando en el servidor; otra URL no se trata como una barrera de seguridad.
El registro publico nunca permite elegir Administrador o Instructor.

## 4. Alta desde recepcion e invitaciones

El administrador puede crear cuentas de socios sin pedirles ni entregarles una
contraseña. En este alta, el plan es opcional y puede asignarse al registrar el
pago. Desde la ficha se genera un enlace personal de primer acceso.

- Token aleatorio de 256 bits y solo hash SHA-256 almacenado.
- Un uso, validez de 48 horas y reemplazo que invalida el enlace anterior.
- Solo el administrador puede generarlo, para una cuenta de socio pendiente
  y habilitada.
- El socio elige y confirma su propia contraseña.
- Se rechazan enlaces vencidos, usados y cuentas suspendidas/dadas de baja.
- Activar acceso no activa membresias, no registra pagos ni eleva permisos.
- El token viaja en el fragmento del enlace, no en la ruta/query enviada al
  servidor, y se retira de la barra antes de completar el formulario.
- CSRF, limites de autenticacion, scrypt y sesiones existentes se conservan.

La entrega del enlace es manual y personal; no se enviaron correos ni mensajes.
El alta de instructores conserva su flujo administrativo anterior.

## 5. Persistencia y compatibilidad

[Migracion versionada 3](../backend/src/database/accesos.sql): agrega metodo y
fecha de solicitud, transferencia informada, acceso pendiente e invitaciones.
No altera cuentas, contraseñas, membresias ni pagos existentes.

La confirmacion de pago o el retiro de un plan limpia tambien sus datos
pendientes, sin borrar el historial. Reiniciar/repetir migraciones no resucita
planes ni reinicia invitaciones usadas.

Rutas incorporadas:

| Ruta API | Permiso |
|---|---|
| POST `/api/socios/:id/invitacion` | Administrador |
| POST `/api/auth/activar-acceso` | Enlace personal valido, contraseña y CSRF |
| POST `/api/mi-membresia/pago-reportado` | Socio; solicitud propia por transferencia |

## 6. Verificacion

- Cinco pruebas de backend fallaron antes del cambio y luego pasaron.
- Pruebas de formularios reprodujeron metodo faltante, plan fuera del catalogo,
  alta sin contraseña y confirmacion de cobro faltante.
- Suite backend: 26 pruebas aprobadas; persistencia extendida comprobada
  tras cerrar y reabrir la base.
- Suite frontend: 58 pruebas aprobadas.
- Compilacion y lint correctos.
- Playwright: seis flujos completos aprobados, incluyendo roles, catalogo,
  asociacion por transferencia, activacion por pago e invitaciones.
- Responsive publico entre 320 y 1920 px; nuevas pantallas a 360/1440 px y
  primer acceso a 390 px. Sin desborde horizontal ni violaciones Axe en las
  superficies comprobadas; teclado, Escape y movimiento reducido verificados.
- Zoom nativo de Chromium al 200% comprobado.
- Manual de marca 1.2 regenerado: seis paginas A4, PDF etiquetado, sin desbordes.
- Aplicacion local disponible y nueva pantalla comprobada en la pestaña compartida.

Comandos de cierre:

```sh
npm test
npm run build
npm run lint
E2E_FRONTEND_PORT=5175 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/snap/bin/chromium npm run test:e2e -- --reporter=line
```

Las correcciones de los selectores duplicados de login y del origen del reloj
de pruebas ajustaron las pruebas al flujo real, sin alterar fechas ni permisos
de produccion para hacerlas pasar. Se revisaron visualmente las capturas de
asociacion, primer acceso y resumen de gestion en escritorio/mobile.

## 7. Limites y documentacion

No se incorporaron pasarelas de pago online, comprobantes subidos a la web,
correo automatico, doble factor ni datos bancarios no confirmados.
«Tarjeta» en caja sigue registrando un cobro realizado fuera de la web.
No se publicaron cambios, no se crearon cuentas externas ni se hicieron commits.
Chromium no acredita Safari/iPhone ni un despliegue en Neon/Vercel.

Actualizados [requisitos](./Especificacion%20funcional.md),
[plan unico, seccion 24](./Plan%20de%20diseno%20y%20ejecucion.md),
[README](../README.md) y [manual de marca](./marca/Manual-de-marca.md).
