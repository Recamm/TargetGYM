# Target GYM - Informe de contexto, diseno y ejecucion

**Fecha:** 2026-11-01.  
**Estado:** sistema completo implementado y verificado localmente; despliegue no realizado.  
**Trabajo realizado:** migracion de herramientas, backend persistente, React y comprobaciones. Ver seccion 13 para el cierre actual.  
**Metodo:** Superpowers local mediante `ca-workflow`, sujeto a [POLICY.md](../.createapp/POLICY.md).

## 1. Resumen ejecutivo

Se implemento el alcance completo aprobado: React/Vite, API Express por capas,
PostgreSQL, autenticacion por sesiones, tres roles, socios, membresias/pagos,
reservas, estados temporales, asistencia y reportes. La aplicacion funciona con
PostgreSQL embebido local; Neon y Vercel requieren configuracion y comprobacion
en el entorno real, sin publicacion automatica.

El plan original distinguio dos etapas dentro de este unico documento:

1. **Entrega 3:** conservar la landing original, desarrollar consulta y CRUD de
   clases en React y conectarlos a la API existente, corrigiendo sus validaciones
   directamente necesarias. Es una demostracion local, no un sistema protegido.
2. **Sistema completo:** agregar almacenamiento persistente, autenticacion y
   permisos, socios, membresias/pagos, reservas y estados; integrarlos a React y
   demostrar el recorrido de negocio completo sin acciones simuladas.

Se ejecutaron ambas etapas con datos de la API y pruebas por funcionalidad.
El diagnostico y las listas iniciales se conservan como antecedentes, no como
declaraciones del estado actual. El registro actualizado por hito esta al final.

## 2. Fuentes y alcance de la lectura

### Consignas actuales

- [Entrega 3 - Frontend React](./Entrega%203%20-%20Frontend%20React.md):
  React, codigo en `frontend/src`, componentes reutilizables, accesibilidad,
  notificaciones consistentes y servicios HTTP centralizados.
- [Consigna - Sistema completo](./Consigna%20-%20Sistema%20completo.md):
  completar negocio y arquitectura existente; todas las operaciones principales
  deben funcionar desde React, con validacion principalmente en el servidor.

### Entregas y trabajo anterior

- [Ficha tecnica del negocio](./TP%20-%20Fichas%20Tecnicas%20(Targer%20GYM).md):
  investigacion, servicios, publico y contenido institucional.
- [Entrega UX/UI](./Entregar%20-%20Target%20GYM%20(UX-UI).md):
  paleta, fuentes y estructura de landing. Los placeholders
  `data:image/...base64...` no contienen capturas utilizables.
- [Descripcion funcional](./TargetGYM.md) y [diagrama de clases](./diagrama-clases.md):
  roles, reglas, entidades y relaciones previstas.
- [Especificacion funcional conservada](./Especificacion%20funcional.md):
  historias, FR-001 a FR-020, escenarios y decisiones anteriores.
- [Principios conservados](./Principios%20del%20proyecto.md):
  integridad del negocio, permisos, validacion e identidad.

Se leyo todo el codigo propio de `backend/src`, su manifiesto, el contrato y las
dependencias declaradas, README, configuracion de agentes/CreateApp y los
documentos funcionales y de planificacion anteriores. Se inventario la
infraestructura retirada. No se hizo una lectura indiscriminada de Git,
`node_modules` ni de todos los paquetes de terceros en `vendor`: la politica
exige consultar esas referencias por partes.

**No hay una consigna independiente de Entrega 2 en `info/`.** Su avance se
deduce del codigo existente y de la consigna final, que indica que aquella
entrega requeria un CRUD principal. No es posible acreditar su evaluacion
academica a partir del repositorio.

El plan anterior, fechado 2026-10-31, era una propuesta no implementada de
landing, consulta y CRUD. Se integran aqui sus decisiones sobre Vite, CSS,
servicios, accesibilidad, proxy, formularios y pruebas; su alcance parcial no
se confunde con los requisitos del sistema completo.

## 3. Diagnostico inicial, anterior a la implementacion

Este cuadro documenta el punto de partida de la preparacion. No describe el
sistema implementado; consultar la seccion 13 y README para el estado actual.

| Area | Evidencia | Estado / consecuencia |
|---|---|---|
| Investigacion y UX/UI | Documentos de `info/` | Hecho como documentacion; faltan imagenes reales del boceto. |
| Modelo de dominio | Ocho clases JavaScript | Hecho como estructura de datos, no como negocio completo. |
| Arquitectura backend | Routes, controllers, services, repositories, models, middlewares, exceptions, responses | Existe para Clases; reutilizarla para los otros recursos. |
| CRUD de clases | Cinco endpoints en `/api/clases` | Operativo; comprobado por HTTP durante esta preparacion. |
| Errores y respuestas | `AppError`, `Messages`, `errorHandler`, `sendSuccess` | Reutilizar el formato, no inventar uno distinto por recurso. |
| Almacenamiento | Array privado y contador en `ClaseRepository` | En memoria; arranca vacio y pierde datos al reiniciar. |
| Validacion de clase | Obligatorios al crear y cupo mayor que cero | Parcial: no valida estrictamente tipos, fecha futura o cupo entero. |
| Edicion de clase | `Object.assign(clase, cambios)` | Acepta propiedades arbitrarias y no mantiene cupos al cambiar el maximo. |
| Instructor y cancelacion de clase | Ausentes en el modelo de Clase expuesto | No poner esos campos/acciones en la primera entrega como si existieran. |
| Relaciones entre entidades | Dibujadas; modelos sin referencias suficientes | Faltan IDs de socio/clase/membresia/instructor y persistencia de relaciones. |
| React | No existe `frontend/` | Hay que crear la base de la Entrega 3. |
| Login, registro, permisos | Sin rutas, servicios o middlewares | Pendiente; la API actual no es un panel administrativo seguro. |
| Socios, membresias, pagos | Solo modelos | Pendientes sus operaciones y reglas. |
| Inscripciones, estados, asistencia | Solo modelo de Inscripcion | Pendientes operaciones, transiciones, concurrencia e historial. |
| Pruebas, lint y build | Backend solo declara `start` y `dev` | No hay suite configurada; definirla al implementar. |

### Contrato existente que el frontend debe respetar

| Operacion | Endpoint | Respuesta de exito |
|---|---|---|
| Listar | `GET /api/clases` | 200, `{ success: true, data: Clase[] }` |
| Obtener | `GET /api/clases/:id` | 200, `{ success: true, data: Clase }` |
| Crear | `POST /api/clases` | 201, `{ success: true, data: Clase }` |
| Editar | `PUT /api/clases/:id` | 200, `{ success: true, data: Clase }` |
| Eliminar | `DELETE /api/clases/:id` | 200, `{ success: true, data: null }` |

Error: `{ success: false, message: string }`, con 400, 404 o el estado adecuado.
No asumir un array sin envoltorio ni HTTP 204 al eliminar.

Clase expuesta: `id`, `nombre`, `tipo`, `fecha`, `horaInicio`, `cupoMaximo`,
`cupoDisponible`. Alta/edicion deben enviar solamente los cinco campos editables,
no `id` ni `cupoDisponible`.

## 4. Alcance y decisiones

### Lo que esta definido

- React es obligatorio; no sustituirlo por Next.js u otro framework.
- Mantener JavaScript ESM y las capas actuales de Express.
- Mantener la identidad original y un solo sistema de notificaciones.
- Los datos operativos vienen de la API, no de constantes dentro de componentes.
- Registro de pagos manual por administrador; no hay requisito de pasarela online.
- Administrador y Socio son los roles minimos. Instructor aparece como adicional.
- No publicar, desplegar, crear commits ni alterar instalaciones globales de
  agentes durante esta preparacion.

### Arquitectura aprobada e instalada

React con Vite, JavaScript/JSX, React Router y CSS propio con variables.
Estado local para cada flujo y un proveedor compartido para notificaciones;
no incorporar Redux, una libreria de calendario, Tailwind ni un kit visual
sin una necesidad concreta. Reutilizar el runner si aparece uno antes de ejecutar.

Node comprobado: `v24.14.0`. React 19, Vite 8, React Router 7 y Express 4,
con versiones exactas en el lockfile raiz de los workspaces. Se conserva Oxlint,
el runner del scaffold oficial, en vez de agregar otro linter duplicado.

La propuesta inicial SQLite fue reemplazada antes de implementarla por decision
del usuario: PostgreSQL Neon para Vercel, PGlite explicito para desarrollo/pruebas
y sesiones persistidas con cookie HttpOnly. No se agrego ORM. El cron diario
compatible con Hobby complementa la conciliacion temporal antes de operaciones.

## 5. Plan para disenar antes de programar

### D1 - Cerrar mapa de pantallas y contenido

- [ ] Separar pantallas de Entrega 3 de las futuras pantallas del sistema completo.
- [ ] Confirmar servicios reales, contacto, logo/fotografia autorizada y planes/precios.
- [ ] Recuperar las capturas originales si estan disponibles; mientras tanto,
  mantener la estructura textual del boceto y declarar esa limitacion.
- [ ] Definir el objetivo y la accion principal de cada pantalla.

**Salida:** mapa de rutas, contenido real disponible y lista de contenido faltante.
No inventar reseñas, cantidad de socios, descuentos o actividades no confirmadas.

### D2 - Wireframes mobile-first

- [ ] Dibujar en este mismo plan inicio, agenda, gestion de clases y formulario.
- [ ] Ampliar el recorrido previsto con registro/login, membresia, reserva,
  mis inscripciones y gestion del socio, antes de implementar la segunda etapa.
- [ ] Revisar orden de lectura, acciones, vuelta al listado y estados sin datos.
- [ ] Revisar 360, 768 y 1440 px; no depender de hover o scroll horizontal de pagina.

**Salida:** recorridos claros que conservan navbar, hero, nosotros, servicios y footer.

#### Inicio: conservar el boceto

```text
Target GYM | Nosotros | Servicios | Clases | Contacto
--------------------------------------------------
Hero deportivo con mensaje breve y fotografia real
             [Ver clases] [Contactar]
--------------------------------------------------
Sobre nosotros: gimnasio de cercania en Florida
--------------------------------------------------
Musculacion | Funcional | Cardio | Clases grupales
--------------------------------------------------
Contacto, direccion, horarios y redes verificadas
```

El hero es el gesto visual principal: tipografia Oswald y contenido del gimnasio,
no un dashboard o una coleccion de tarjetas genericas. Sin fotografia utilizable,
usar composicion tipografica de marca, no una imagen que finja ser del negocio.
Mantener gran altura sin recortar texto en movil. Grilla de servicios 4/2/1 columnas.

Primera etapa: "Ver clases" abre `/clases`; "Contactar" lleva al footer.
"Empeza hoy" solo puede dirigir al registro cuando ese flujo exista.
No agregar botones que simulen contratar, pagar o reservar.

#### Agenda y gestion

```text
Clases                   [Semana anterior] [Siguiente]
[Semana seleccionada] [Tipo de actividad] [Limpiar]
Lunes: nombre | hora | lugares disponibles
Martes: nombre | hora | lugares disponibles
Mensaje propio si esta semana no tiene clases

Gestion de clases                         [Nueva clase]
Nombre | Fecha/hora | Cupo | [Editar] [Eliminar]
```

En movil, agrupar agenda por dia y apilar gestion con sus acciones visibles.
La consulta publica no muestra escrituras. La gestion inicial debe informar
"Demostracion local sin control de acceso": una ruta distinta no protege la API.
No confundir eliminar una clase con cancelar una inscripcion.

#### Formulario y reserva futura

```text
Nueva / Editar clase
Nombre [................]  Tipo [................]
Fecha  [................]  Hora [................]
Cupo   [................]
Ayuda y errores junto a los campos
[Cancelar] [Guardar]

Sistema completo: detalle de clase
Actividad | instructor | fecha/hora | cupo real
Estado de membresia y condicion para reservar
[Confirmar inscripcion] -> confirmacion de la API
```

Un mismo formulario resuelve alta y edicion. En el sistema completo, cancelar
una reserva explica la regla de dos horas y el motivo si esta bloqueada.

### D3 - Tokens, componentes, estados y accesibilidad

| Token / criterio | Propuesta |
|---|---|
| Fondo | Negro `#1A1A1A` |
| Texto | Blanco humo `#F5F5F5` |
| Marca y acentos | Rojo energia `#E63946` |
| Boton relleno con texto normal | Rojo derivado `#B52B38` y texto `#F5F5F5` |
| Titulos | Oswald |
| Cuerpo, formularios y datos | Nunito Sans, base 16 px, interlineado cercano a 1.5 |
| Espaciado | 4, 8, 12, 16, 24, 32, 48 y 64 px |
| Contenedor | Aproximadamente 1200 px maximo, margenes fluidos y lectura izquierda |
| Movimiento | Breve y funcional, respetando `prefers-reduced-motion` |

**Mejora justificada:** se calculo contraste sRGB en esta preparacion.
Blanco humo sobre rojo original da **3.82:1** y negro sobre ese rojo **4.18:1**:
ninguno alcanza 4.5:1 para texto normal. Blanco humo sobre `#B52B38` da
**5.72:1**; blanco humo sobre negro da **15.96:1**.
Mantener rojo original para marca y usar su derivado en acciones rellenas.
Comprobar tambien hover, disabled, bordes y foco al implementar.

Componentes concretos: `Header`, `Footer`, `Button`, `FormField`, `ClaseCard`,
`ClaseForm`, `ConfirmDialog`, `NotificationProvider`, `LoadingState`,
`EmptyState` y `ErrorState`. Extraer componentes al comprobar reutilizacion;
no crear una biblioteca generica anticipada.

| Estado | Comportamiento previsto |
|---|---|
| Carga | Indicador y `aria-busy`; no mostrar vacio antes de recibir respuesta. |
| Lista vacia | Explicacion y siguiente accion segun rol. |
| Filtros sin resultados | Permitir limpiar o cambiar semana. |
| Guardando / eliminando | Progreso y bloqueo de envio duplicado. |
| Exito | Unico sistema de avisos, solo tras respuesta exitosa. |
| Validacion | Error junto al campo, conservar datos y enfocar el primer error. |
| API / red no disponible | Error contextual, aviso compartido y reintento; no datos ficticios. |
| ID inexistente | Pantalla de recurso no encontrado; no convertirla en alta. |
| Confirmacion de eliminar | Mostrar nombre/fecha; cancelar no envia DELETE. |
| Fallo de eliminacion | Mantener registro y permitir reintentar o cerrar. |
| Sesion vencida, segunda etapa | Avisar y volver a login sin simular una operacion exitosa. |
| Sin permiso o regla de negocio | Motivo claro; deshabilitar visualmente no reemplaza validacion backend. |

- [ ] HTML semantico, un h1 por pantalla, salto a contenido y botones reales.
- [ ] Asociar `label` e `input`, ayudas/errores mediante `aria-describedby`.
- [ ] Teclado completo, foco visible y no oculto por navbar fija/notificaciones.
- [ ] Dialogo con foco contenido, Escape cuando no hay envio pendiente y
  restauracion del foco al cerrar.
- [ ] Avisos accesibles: estado para exito y anuncio de error cuando corresponde,
  sin duplicar anuncios globales y contextuales.
- [ ] Imagenes informativas con alt; decorativas con alt vacio.
- [ ] Contraste 4.5:1 para texto normal y 3:1 para texto grande.
- [ ] Objetivo tactil 44 x 44 px, zoom 200% y movimiento reducido.

### D4 - Aprobar diseno y contrato antes de ejecutar

- [ ] Revisar la propuesta contra el boceto y las dos consignas.
- [ ] Resolver los bloqueos de la siguiente etapa, no todas las preguntas futuras.
- [ ] Aprobar mapa, tokens, wireframes y limites de la primera entrega.
- [ ] Registrar cambios de alcance aqui, sin una segunda especificacion/plan por proveedor.

## 6. Organizacion prevista del frontend

```text
frontend/
  package.json, package-lock.json, index.html, vite.config.js
  public/
  src/
    assets/
    components/
    pages/
      HomePage.jsx
      ClasesPage.jsx
      GestionClasesPage.jsx
      ClaseFormPage.jsx
      NotFoundPage.jsx
    services/
      api.js
      clasesService.js
    utils/
      claseValidation.js
      dateTime.js
    styles/
      tokens.css
      global.css
    App.jsx
    main.jsx
```

Todo el codigo de aplicacion y pruebas de componentes/utilidades vive en
`frontend/src`; HTML y configuracion del empaquetador son infraestructura.
`App.jsx` organiza rutas/proveedores, no contiene toda la aplicacion.

| Primera etapa | Acciones |
|---|---|
| `/` | Landing original, clases y contacto |
| `/clases` | Agenda semanal, filtros, cupos de la API |
| `/gestion/clases` | Consulta y acceso a alta/edicion/eliminacion local |
| `/gestion/clases/nueva` | Formulario compartido de alta |
| `/gestion/clases/:id/editar` | Obtener por ID y editar |
| Ruta desconocida | Pagina no encontrada con salida clara |

Segunda etapa, **implementada**: `/registro`, `/login`, `/mi-cuenta`,
`/mi-membresia`, `/mis-inscripciones`, `/mi-historial`, `/gestion/socios`,
`/gestion/socios/:id`, `/gestion/pagos`, `/gestion/planes`, instructores y reportes.
Se incluyo `/instructor/clases` y asistencia por clase, con permisos del servidor.

### Servicios y comunicacion

`api.js` centraliza URL base, cabeceras, lectura JSON, estado HTTP y envoltorio.
Una respuesta no JSON, malformada o `success: false` es error explicito;
preservar el estado HTTP aunque el cuerpo no sea JSON.

`clasesService.js` expone `listarClases()`, `obtenerClase(id)`,
`crearClase(datos)`, `actualizarClase(id, datos)` y `eliminarClase(id)`.
Devuelve `data` o lanza error; no emite notificaciones.
Las paginas manejan feedback y no duplican `fetch`.
Cancelar solicitudes obsoletas al navegar; un aborto intencional no es un fallo
de negocio. Evitar reintentos automaticos de escrituras que puedan duplicarlas.

En desarrollo, frontend y backend corren por separado y Vite hace proxy de
`/api` a `http://localhost:3000`. No hay CORS actual; no abrirlo a cualquier
origen para solucionar el desarrollo. Produccion requiere una configuracion
explicita de origen/proxy, cookies y HTTPS antes de publicar.

Fechas: enviar `YYYY-MM-DD`, hora `HH:mm`, y usar la zona del gimnasio
`America/Argentina/Buenos_Aires`. No interpretar una fecha sin hora como UTC
y desplazar su dia al mostrarla. El servidor es autoridad para las reglas temporales.

## 7. Paso a paso de implementacion

Las listas de esta seccion conservan los pasos del plan original. El estado de
ejecucion T1-T12 y sus comprobaciones actuales se registran en la seccion 13;
las casillas originales no constituyen una segunda lista de trabajo pendiente.

Cada tarea de logica sigue: prueba que falle por el comportamiento requerido,
implementacion, prueba focalizada y revision. Configuracion y estilos usan
comprobacion adecuada, sin exigir TDD artificial. No marcar estos pasos como
terminados por haber escrito este informe.

### Etapa A - Entrega 3

#### T1 - Completar contrato y validacion del CRUD existente

**Tocar:** `backend/src/services/ClaseService.js`,
`backend/src/repositories/ClaseRepository.js`, control de ID en controller,
mensajes/excepciones directamente necesarios y pruebas del recurso.

- [ ] Agregar pruebas de obligatorios, espacios, tipos, cupo entero positivo,
  IDs invalidos, fechas/horas invalidas y fecha/hora pasada.
- [ ] Validar el registro resultante al editar, no solo los campos aislados.
- [ ] Permitir solamente campos editables; rechazar payloads que intenten alterar
  ID/cupo disponible u otras propiedades.
- [ ] Mantener `cupoDisponible = cupoMaximo` mientras no existen inscripciones.
- [ ] Comprobar CRUD valido, errores y contrato existente sin cambiar su envoltorio.

**Salida:** altas y ediciones validas, cupos coherentes y errores claros.
No agregar todavia instructor, estados de reserva o autenticacion dentro de esta tarea.

#### T2 - Crear base React y sistema visual

**Crear:** infraestructura de `frontend`, `main.jsx`, `App.jsx`, estilos,
layout, rutas, componentes de campo/boton/dialogo y notificaciones.

- [ ] Usar el scaffolder oficial y versiones compatibles, con lockfile.
- [ ] Configurar proxy `/api`, scripts efectivos de desarrollo/build/lint y tests.
- [ ] Aplicar los tokens aprobados, fuentes con licencias y recursos reales.
- [ ] Verificar navegacion, foco, dialogo y avisos en navegador.

**Salida:** frontend independiente, navegable y organizado; no monolito en App.

#### T3 - Implementar servicios HTTP

**Crear:** `frontend/src/services/api.js`, `clasesService.js` y sus pruebas.

- [ ] Probar exito envuelto, 400/404/500, fallo de red, JSON invalido,
  envoltorio inesperado y DELETE con `data: null`.
- [ ] Implementar las cinco funciones y propagacion de errores.
- [ ] Verificar contra el backend real, no solamente un mock.

**Salida:** un solo lugar para HTTP y respuestas compatibles con la API.

#### T4 - Landing y consulta publica

**Crear:** `HomePage.jsx`, `ClasesPage.jsx`, `ClaseCard`, utilidades de fechas.

- [ ] Construir la landing sin reemplazar el boceto.
- [ ] Agrupar clases por dia, filtrar semana/tipo en cliente con la API actual.
- [ ] Resolver carga, vacio, filtros sin resultado, fallo y reintento.
- [ ] Probar cambio de semana, formateo sin desplazamiento UTC y datos reales.

**Salida:** visitante llega a disponibilidad sin registrarse y sin datos inventados.

#### T5 - CRUD desde React

**Crear:** `GestionClasesPage.jsx`, `ClaseFormPage.jsx`, `ClaseForm`,
validacion del formulario y pruebas interactivas.

- [ ] Integrar alta/edicion con formulario compartido y datos precargados por ID.
- [ ] Mantener datos tras errores y bloquear envios duplicados.
- [ ] Pedir confirmacion antes de borrar; cancelar no envia una peticion.
- [ ] Actualizar vistas solo despues del exito; conservar registro si falla.
- [ ] Probar ID inexistente, validaciones, exito/error y el recorrido completo.

**Salida:** consulta/alta/edicion/eliminacion funcionan con el backend real.

#### T6 - Cerrar la Entrega 3

- [ ] Ejecutar tests focalizados, lint y build con los scripts creados.
- [ ] Recorrer ambos procesos en navegador a 360/768/1440 px y zoom 200%.
- [ ] Comprobar teclado, contraste, avisos, dialogo, backend detenido y reintento.
- [ ] Actualizar README con comandos efectivos, versiones y limitacion de memoria.
- [ ] Revisar todos los requisitos de Entrega 3, sin acreditar reservas/login.

**Salida:** primera entrega demostrable localmente. Publicacion bloqueada hasta
resolver autenticacion, permisos y almacenamiento.

### Etapa B - Sistema completo

#### T7 - Persistencia y relaciones reales

**Tocar:** implementaciones de repositories y modelos; crear configuracion de
almacenamiento, migraciones y pruebas de integracion segun la tecnologia aprobada.

- [ ] Acordar almacenamiento y agregar dependencias solo entonces.
- [ ] Persistir usuarios/roles, socios, membresias, pagos, clases e inscripciones.
- [ ] Vincular `Inscripcion` con `socioId`/`claseId`, `Membresia` con `socioId`,
  `Pago` con `membresiaId` y Clase con instructor si se incluye ese rol.
- [ ] Definir claves foraneas, unicidad de email y reglas de borrado/historial.
- [ ] Verificar que datos y relaciones sobreviven a reinicios.

**Salida:** sin duplicar el CRUD ni perder historial; transacciones disponibles
para cupos y renovaciones.

#### T8 - Autenticacion, permisos y cuenta

**Crear:** rutas/controller/service de autenticacion, repository de usuarios,
middlewares de sesion/rol y paginas/servicios React de registro, login y perfil.

- [ ] Validar datos, email normalizado unico, contraseña y fecha de nacimiento.
- [ ] Guardar hash de contraseña, nunca devolverlo ni registrarlo en logs.
- [ ] Registro publico crea Socio; alta inicial de Administrador por mecanismo
  controlado, no por selector de rol manipulable en el registro.
- [ ] Login, logout y consulta de sesion; cookies seguras y defensa CSRF
  apropiada si se adopta la propuesta de sesiones.
- [ ] Proteger escrituras de clases y todas las operaciones sensibles por rol
  y propiedad del recurso, no solo mediante rutas protegidas de React.
- [ ] Probar 401/403, acceso directo a API y manipular IDs ajenos.

**Salida:** Administrador y Socio usan permisos reales; nunca una sesion ficticia.

#### T9 - Socios, membresias y pagos

**Crear:** capas correspondientes por recurso; paginas/servicios de socios,
membresia y registro de pagos. Reutilizar errores y notificaciones existentes.

- [ ] Alta/modificacion/suspension/baja manteniendo historial.
- [ ] Planes 1/3/12 meses calendario, vencimiento y renovacion anticipada desde
  el vencimiento vigente; resolver fin de mes antes de codificar.
- [ ] Pago manual validado, precio/descuento real del servidor y activacion
  consistente; no un boton que solo cambie estado en frontend.
- [ ] Alertas de vencimiento dentro de 7 dias y estado vencido.
- [ ] Evitar registrar dos veces una misma operacion de pago/renovacion.

**Salida:** el administrador puede regularizar a un socio y este ve su membresia
actualizada desde React.

#### T10 - Clases completas, reservas y cancelacion

**Crear/tocar:** capas de Inscripcion, reglas transaccionales de cupo, relaciones
de Clase, endpoints correspondientes y paginas/servicios de reserva.

- [ ] Asignar instructor si corresponde y distinguir cancelar de eliminar clase.
- [ ] Reservar solo con socio/membresia activos, clase futura, cupo y sin duplicado.
- [ ] Concurrencia del ultimo lugar: exactamente una confirmacion y un rechazo.
- [ ] Cancelar con al menos dos horas de anticipacion; liberar cupo una sola vez.
- [ ] Al cancelar/eliminar clase con reservas, cancelar asociadas sin dejarlas
  huerfanas y preservar historial segun la politica acordada.
- [ ] Impedir reducir cupo por debajo de la ocupacion real.
- [ ] Integrar calendario, detalle, confirmacion y mis inscripciones a React.

**Salida:** flujo login -> membresia -> consultar -> reservar -> ver/cancelar,
sin simulaciones ni sobreventa.

#### T11 - Estados temporales, gracia y asistencia

**Tocar:** Inscripcion/Membresia y sus servicios; agregar ejecucion temporal
idempotente y pantallas de historial/asistencia segun alcance.

- [ ] Definir transiciones permitidas y quien/que las ejecuta.
- [ ] Vencimiento: Confirmada -> Pendiente durante gracia de tres dias;
  regularizacion restaura segun la regla acordada, expiracion cancela/libera.
- [ ] Evitar doble liberacion y procesar atrasos tras reiniciar el servicio.
- [ ] Iniciar/finalizar clase con horario/duracion o accion autorizada acordada;
  separar estado Finalizada de marca de asistencia efectiva.
- [ ] Mostrar historial real a socio/admin; si se incluye Instructor, este solo
  ve sus clases y registra asistencia de sus socios asignados.
- [ ] Reporte de ocupacion/asistencia basado en datos, no cifras de demostracion.

**Salida:** estados y cupos consistentes tambien al avanzar el tiempo, reiniciar
o faltar el socio a una clase.

#### T12 - Cierre integral

- [ ] Recorrer todas las operaciones principales desde React con usuarios por rol.
- [ ] Probar errores, permisos, reglas y concurrencia directamente en backend.
- [ ] Reiniciar y verificar persistencia; no depender de una pestaña abierta
  para expirar membresias o terminar clases.
- [ ] Revisar accesibilidad/responsive, ejecutar pruebas y build/lint pertinentes.
- [ ] Documentar configuracion, datos de prueba sinteticos, ejecucion y limitaciones.
- [ ] No dejar botones principales simulados ni pantallas declaradas completas
  cuando sus endpoints no existen.

**Salida:** cumplimiento del sistema completo con evidencia verificable.
Despliegue/publicacion siguen requiriendo autorizacion y configuracion propias.

### Dependencias reales

| Tarea | Prerrequisitos |
|---|---|
| T1 | D4 y contrato de clases revisado |
| T2 | D4 |
| T3 | T1 y T2 |
| T4 | T3 |
| T5 | T4 |
| T6 | T5 |
| T7 | Aprobacion de persistencia; conserva la regresion de T1 |
| T8 | T7 y base React T2/T3 |
| T9 | T8 y decisiones de planes/precios |
| T10 | T9, CRUD integrado T5 y reglas de ocupacion acordadas |
| T11 | T10 y reglas temporales/asistencia acordadas |
| T12 | T6 y T11; todos los flujos incluidos integrados |

La secuencia recomendada es T1 a T12. Algunas tareas no dependen de todo el hito
anterior; eso no autoriza a iniciar subagentes o sesiones paralelas.

## 8. Decisiones aprobadas al ejecutar

| Decision | Resolucion | Estado |
|---|---|---|
| Boceto y recursos reales | Capturas incompletas; conservar estructura y recuperar recursos autorizados | Fidelidad visual exacta en D2 |
| Edad minima | 16 años inclusive | Implementado |
| Fin de mes y renovacion | Mes calendario, ultimo dia valido; anticipada desde vencimiento vigente | Implementado |
| Precios y descuento anual | Administrador los configura; no hay precios iniciales ficticios | Implementado |
| Pago y contratacion del socio | Solicitud persistida, activacion solo al registrar pago manual | Implementado |
| Gracia por suspension | Solo vencimiento tiene gracia; suspension/baja cancela reservas futuras | Implementado |
| Cupo en estado Pendiente | Pendientes, Confirmadas y En curso consumen cupo | Implementado |
| Duracion/fin de clase | Duracion obligatoria; inicio/fin conciliados en servidor | Implementado |
| Asistencia | Marca independiente, autorizada desde el inicio | Implementado |
| Instructor | Incluido, creado por admin; acceso solo a clases propias | Implementado |
| Cancelar/borrar clase con historial | Baja logica con cancelacion de reservas activas | Implementado |
| Disponibilidad | Polling cada 30 segundos | Implementado |
| Persistencia y sesion | Neon/PostgreSQL; PGlite local; sesiones persistidas y CSRF | Implementado localmente |

Las decisiones de negocio estan resueltas. Las capturas originales/contactos
no disponibles siguen sin inventarse; se uso ilustracion propia aprobada.

## 9. Verificacion y criterios de aceptacion

### Herramientas instaladas

Backend: `node:test`, pruebas de servicios, HTTP y persistencia.
Frontend: Vitest y React Testing Library. Navegador: Playwright y Axe,
con procesos y datos sinteticos aislados.

Comandos actuales desde la raiz:

```powershell
npm test
```

```powershell
npm run lint
npm run build
npm run test:e2e
```

Elegir selectores focalizados durante el desarrollo y ampliar al cerrar un hito
o si hay evidencia de regresion; no repetir toda la bateria sin cambios.

### Aceptacion de la Entrega 3

- [ ] React separado del backend; aplicacion dentro de `frontend/src`.
- [ ] Rutas/proveedores en App y responsabilidades distribuidas.
- [ ] Identidad, estructura del boceto y mejoras justificadas conservadas.
- [ ] Componentes reutilizados, especialmente formulario de alta/edicion.
- [ ] Cinco operaciones de clases usando servicios y la API real.
- [ ] Carga, vacio, errores, exito, validacion y confirmacion funcionando.
- [ ] Un solo sistema de notificaciones; no `alert()` como mecanismo principal.
- [ ] Cancelar dialogo no envia DELETE; fallar una escritura no muestra exito.
- [ ] Backend detenido produce error y reintento, no lista ficticiamente vacia.
- [ ] ID inexistente y ruta desconocida tienen mensaje y salida.
- [ ] Teclado, label/input, alt, foco, contraste, zoom y movil comprobados.
- [ ] Ambos procesos ejecutables por separado, README y comandos actualizados.
- [ ] Limitaciones de memoria y ausencia de permisos visibles; sin publicar.

### Aceptacion del sistema completo

| Regla / objetivo | Prueba requerida |
|---|---|
| Registro y login | Validar datos, duplicado de email y sesion; no permitir autootorgarse rol admin |
| Permisos | Matriz de operaciones por rol y por propietario; 100% de los intentos probados fuera de permiso rechazados |
| Cupo y membresia | Todos los casos probados sin cupo/membresia activa rechazados |
| Ultimo lugar | Dos reservas concurrentes: una sola confirmada; nunca cupo negativo |
| Duplicado | Dos intentos del mismo socio/clase no crean dos reservas activas |
| Cancelacion | Probar exactamente 2 h permitido, 1 h 59 min rechazado, y estados En curso/Finalizada rechazados |
| Idempotencia | Cancelar dos veces o repetir proceso temporal no libera dos lugares |
| Clases | Cupo 0/negativo/decimal rechazado, fecha pasada rechazada, reduccion debajo de ocupacion rechazada |
| Membresias | 1/3/12 meses, fin de mes, año bisiesto, renovacion anticipada y vencida |
| Alertas | Exactamente 7 dias antes, fuera del umbral y membresia vencida |
| Gracia | Antes de 3 dias, exactamente al cumplirlos, renovacion durante gracia y reinicio del servidor |
| Asistencia | Historial solo acredita asistencia real, no mera reserva o finalizacion |
| Persistencia | Reiniciar ambos procesos conserva cuentas, pagos, clases e inscripciones |
| Reservar en menos de 1 minuto | Medir desde buscar hasta confirmacion con socio activo y entorno de prueba documentado |
| Ver disponibilidad en menos de 10 segundos | Medir desde landing hasta cupos visibles con API disponible; no promesa universal de red |
| Cupo consistente | En cada transicion, maximo = disponible + reservas que ocupan cupo, una vez aprobado el criterio |
| Integracion | Todas las acciones principales disponibles desde React y reflejadas tras recargar |

Los porcentajes se acreditan sobre los casos ejecutados; no declarar una garantia
absoluta de produccion a partir de pruebas finitas. Registrar entorno, datos,
resultados y limitaciones sin datos personales reales.

## 10. Migracion de herramientas realizada

El usuario eligio conservar documentacion e instalar Superpowers **local
adaptado por CreateApp**, no el plugin oficial global.

- Se retiraron skills, scripts, plantillas, manifiestos y guia del proceso anterior.
- Se conservaron requisitos/identificadores en
  [Especificacion funcional](./Especificacion%20funcional.md) y principios en
  [Principios del proyecto](./Principios%20del%20proyecto.md).
- Se sustituyo el plan anterior por este informe unico. Su checklist documental
  no se presenta como checklist de implementacion completado.
- Se actualizo politica, configuracion y entradas de agentes para usar `ca-workflow`.
- Se ejecuto `createapp . --add-skills workflow` tras previsualizarlo.
- CreateApp agrego un perfil y 47 archivos de referencia de `obra/superpowers`,
  fijados al commit `2ce8aa15d05bd57213e6f746f953aafb7ded7a8b`.
- Las referencias quedaron en el directorio incremental de `.createapp/additions/`
  y su procedencia en los archivos `sources.lock.json`.
- Se conservan los otros ocho perfiles `ca-*`; no se activan como coordinadores.
- No se desinstalo ninguna herramienta global que pueda usar otro proyecto.

CreateApp 0.2.2 no admite una skill llamada `superpowers`: su seleccion correcta
es coordinador `superpowers`, pack `superpowers` y skill `workflow`.
Los intentos de agregar conjuntamente perfiles `react`/`debug` no fueron
compatibles con la seleccion instalada; no se forzo esa instalacion. Ya existen
referencias React consultables por los perfiles apropiados y la politica limita
patrones de Next.js que no corresponden a Vite.

### Extensiones de VS Code

| Extension | Accion | Justificacion |
|---|---|---|
| ESLint (`dbaeumer.vscode-eslint`) | Ya instalada; recomendada | Diagnosticos al configurar lint de JavaScript/React |
| Prettier (`esbenp.prettier-vscode`) | Ya instalada; recomendada | Formato consistente, sin imponer configuracion todavia |
| Mermaid (`bierner.markdown-mermaid`) | Instalada, 1.32.1 | Visualizar el diagrama de dominio existente |
| REST Client (`humao.rest-client`) | Instalada, 0.25.1 | Comprobar endpoints desde VS Code sin otra aplicacion |

Recomendaciones compartidas en [extensions.json](../.vscode/extensions.json).
Las extensiones se instalan en el perfil de VS Code; a diferencia de Superpowers
local, no quedan limitadas exclusivamente a esta carpeta.
No se agregaron snippets por comodidad ni herramientas de bases de datos,
Next.js o Tailwind que no necesita la preparacion.

## 11. Comprobaciones realizadas y limites

- CRUD real en servidor aislado: listado vacio, alta HTTP 201, consulta por ID,
  edicion, validacion de cupo negativo HTTP 400, eliminacion HTTP 200 con
  `data: null`, inexistente HTTP 404 y listado final vacio: **correctos**.
- Antes de comprobarlo faltaba Express instalado. Se ejecuto
  `npm ci --ignore-scripts --no-audit --no-fund` en backend usando el lockfile
  existente, sin cambiar manifiesto ni dependencias declaradas.
- CreateApp: ayuda/version, diagnostico, previsualizacion e instalacion incremental
  ejecutados. Su UI local respondio HTTP 200 y se detuvo al terminar la consulta.
- Consulta UX local sobre foco no oculto y calculo de contraste ejecutados;
  no se aplico otra paleta o un diseño generico de las referencias.
- Las dos nuevas extensiones informaron instalacion exitosa.
- Configuracion/politica coherentes, JSON de recomendaciones y frontmatter
  de `ca-workflow` comprobados; sus seis referencias existen y los 47 archivos
  de Superpowers coinciden con los hashes Git del lockfile.
- Los 32 enlaces locales de README, inicio de CreateApp y documentos de `info/`
  se resolvieron correctamente. No quedan directorios del proceso retirado.
- El backend no tiene diferencias respecto de Git. La comprobacion de whitespace
  paso reconociendo CRLF de Windows; no se normalizaron cambios previos ajenos.

**No se ejecuto** una suite de aplicacion inexistente, lint/build de un frontend
inexistente, un flujo React en navegador, reglas de reservas ni mediciones de
tiempo de esos flujos. La comprobacion del CRUD no acredita validaciones que
todavia faltan ni seguridad, persistencia o sistema completo.

Los procesos de comprobacion se detuvieron y los datos usados fueron sinteticos.
Los cambios de esta preparacion quedan en el directorio de trabajo, sin commit
ni publicacion. En una nueva sesion de Copilot se debe confirmar el descubrimiento
de `ca-workflow`: disponer de archivos no garantiza su invocacion automatica.

## 12. Proximo paso concreto

Crear el administrador local de manera interactiva, iniciar ambos procesos y
configurar precios/instructores desde React, siguiendo README. Cuando el usuario
autorice publicacion, configurar Neon/Vercel y comprobar el despliegue real.
No regenerar requisitos, simular pagos ni publicar la base local.

### Fuentes tecnicas consultadas

- Referencias de Superpowers fijadas por CreateApp: `brainstorming` y
  `writing-plans`, aplicadas bajo las excepciones del proyecto.
- [Repositorio oficial de Superpowers](https://github.com/obra/superpowers):
  diferencia entre perfiles adaptados y plugin oficial.
- [Plugins de agentes en VS Code](https://code.visualstudio.com/docs/agent-customization/agent-plugins):
  alcance, descubrimiento y comprobacion de instalaciones.
- Referencias locales UX/visual de CreateApp: solo los apartados pertinentes,
  sin activar sus procesos originales.

## 13. Registro de implementacion y cierre

Alcance aprobado: **sistema completo**, no solo la Entrega 3. Se conserva un solo
plan y se actualizan la especificacion y principios con las decisiones acordadas.

| Hito | Resultado persistido | Evidencia |
|---|---|---|
| T1 | Validacion estricta de clases/IDs/campos y errores HTTP compatibles | Regresion de validacion y sistema HTTP |
| T2 | React/Vite, Router, CSS propio, layout, formularios y avisos comunes | Build, Oxlint, componentes y navegador |
| T3 | Servicios centralizados, CSRF y validacion de DTO/envoltorios | Pruebas API y contratos, integracion real |
| T4 | Landing original en estructura; agenda semanal, filtros y polling | Capturas 360/768/1440, Axe, recorrido publico |
| T5 | CRUD real con formulario compartido, cancelacion y confirmaciones | Alta/edicion/baja y cancelacion sin peticion en E2E |
| T6 | Entrega React integrada, errores y documentacion de ejecucion | Tests, lint, build, teclado y zoom nativo 200% |
| T7 | Esquema relacional, relaciones, migracion y transacciones compartidas | Reapertura en disco conserva usuarios, pagos, clases, reservas y sesiones |
| T8 | Sesiones, scrypt, CSRF, roles y perfil | HTTP 400/401/403 y navegacion de los tres roles |
| T9 | Socios/estados, planes configurables, pagos idempotentes y renovacion | Limites 16 años, 7 dias, meses calendario y descuento anual |
| T10 | Reservas transaccionales y cancelacion propia | Ultimo cupo concurrente, duplicados, reduccion de capacidad y limite 2 h |
| T11 | Gracia, inicio/fin de clases, asistencia e historial | Tres dias exactos, regularizacion, inicio sin pago y asistencia real |
| T12 | Recorrido completo, documentacion y preparacion Vercel/Neon | 15 tests backend, 25 frontend y 3 E2E; produccion pendiente de configuracion |

### Comprobaciones ejecutadas

- `npm test`: 15 pruebas backend y 25 frontend aprobadas.
- `npm run lint`: Oxlint, sin advertencias.
- `npm run build`: salida de produccion de Vite; JS aproximadamente 96 kB gzip.
- `npm run test:e2e`: tres pruebas aprobadas, con servidor PostgreSQL embebido
  aislado y usuarios sinteticos. Admin configura plan/instructor/clase/pago;
  socio registra cuenta, modifica perfil, reserva/cancela; instructor marca
  asistencia; socio consulta historial y admin reportes/baja de clase.
- Comprobados 360/768/1440 px, foco de dialogo y retorno al disparador, Escape
  en menu movil, estados de error/reintento y Axe sin violaciones detectadas.
- Zoom **nativo de Chromium al 200%**, confirmado con `chrome.tabs.getZoom`,
  usando un perfil/extencion temporal de prueba, sin modificar el navegador
  habitual del usuario. Formulario/navegacion sin overflow horizontal.
- Umbrales SC-004 <10 segundos desde ingreso a landing hasta cupos visibles y
  SC-001 <60 segundos desde buscar hasta confirmar: aprobados localmente.
- `npm audit fix` aplico actualizaciones compatibles; auditoria posterior
  sin vulnerabilidades. No es una certificacion integral de seguridad.
- Oxlint y Playwright instalados como extensiones, junto con las herramientas
  ya presentes y Mermaid/REST Client instalados durante la preparacion.

### Correcciones demostradas durante la ejecucion

Se reprodujeron y corrigieron validacion permisiva del CRUD, meses cerca de
medianoche argentina, actualizacion de perfil con plan NULL tras pagar,
contraseña invalida que producia 500, IDs/historial inexistente, recursos obsoletos,
redirecciones de registro/logout por prioridades de Router, errores 401 antiguos,
precio final redondeado a cero y seleccion de pago conservada tras el exito.
Las escrituras fallidas no muestran un exito ni se reintentan automaticamente.

### Limites y operaciones que no se realizaron

No se crearon cuentas Neon/Vercel, no se pidieron credenciales por chat y no hubo
commits ni despliegues. El adaptador de produccion y las rutas/cron estan preparados,
pero requieren comprobacion real de SSL, cookies, rutas estaticas/SPA, cron y
concurrencia multiinstancia en Neon. PGlite no acredita por si solo ese entorno.
Chromium/Axe y las capturas no acreditan Safari/WebKit ni una auditoria manual
completa de accesibilidad. No se recuperaron fotos/contactos ausentes en las fuentes.
Los procesos de prueba se cerraron y la base local del usuario no se poblo.

## 14. Exploracion de identidad y rediseno - 2026-11-02

### Alcance acordado

El usuario solicito mejorar el diseno con referencias Hozon, Linear,
Still / Form y YAAS; antes de modificar la web, generar un manual de marca,
logos y multiples variantes. Consultado sobre el alcance, eligio
**renovacion total**: las tres propuestas pueden cambiar colores y tipografias.
Se conserva el nombre Target GYM y todos los requisitos funcionales.

Esta autorizacion habilita la exploracion; no equivale a elegir una identidad.
La paleta y fuentes existentes siguen vigentes en la aplicacion hasta que
se apruebe una propuesta. No se modifican React, backend, configuracion
CreateApp ni las decisiones funcionales por presentar variantes.

### Entregables de esta etapa

- [Estudio visual navegable](./marca/index.html): tres portadas y muestras
  de agenda responsive, comparacion, normas y descargas.
- [Manual de marca](./marca/Manual-de-marca.md): estrategia, tres sistemas
  de color/tipo, logos, espacio de proteccion, voz, fotografia, movimiento,
  accesibilidad y aplicaciones previstas.
- [Dossier visual PDF](./marca/Dossier-visual.pdf): seis paginas A3,
  texto seleccionable, etiquetado y fuentes incrustadas.
- Nueve SVG: logo principal, simbolo y monocromo de Enfoque, Cerca y Ritmo.
- Fuentes locales WOFF2 y sus licencias SIL OFL, sin servicios externos
  necesarios para abrir la lamina.

**Direcciones:** Enfoque (azul, preciso y luminoso, recomendado), Cerca
(bosque/lavanda, amable y comunitario), Ritmo (noche/coral, grafico y activo).
Los nombres identifican propuestas, no reemplazan el nombre del gimnasio.

### Secuencia y limite

1. Investigar contexto y referencias; preservar trabajo previo ajeno.
2. Preparar manual, logos y comparador independiente de la aplicacion.
3. Comprobar recursos, contraste, teclado, responsive e impresion.
4. Presentar resultados y solicitar eleccion de identidad.
5. Solo despues de aprobar el diseno: aplicar el sistema elegido a portada,
   agenda, acceso y paneles, verificando los flujos funcionales afectados.

YAAS pudo visualizarse en navegador. Las otras referencias fallaron en
el navegador integrado; se recuperaron contenido/CSS de Hozon y HTML parcial
de Linear/Still / Form. No se presenta esto como revision visual completa
ni se reutilizan sus imagenes, logos o codigo.

### Comprobaciones de esta etapa

- Chromium 156 instalado en el sistema, mediante Playwright existente:
  recursos, nueve SVG validos sin fuentes externas, enlaces internos,
  descargas y las cuatro familias tipograficas cargadas.
- 320, 360, 390, 768, 1024, 1440 y 1920 px: sin desbordamiento de pagina
  y acciones principales con altura minima de 44 px.
- Navegacion por teclado, enlace de salto con foco en el contenido,
  enlaces de propuestas y apertura/cierre de apartados con Enter.
- Axe en 360 y 1440 px, con todos los apartados abiertos: sin infracciones
  detectadas. No equivale a una auditoria manual completa.
- Contrastes de las combinaciones principales medidos: todos superan 4,5:1.
- Preferencia de movimiento reducido respetada; sin peticiones externas
  al abrir la lamina y sin errores JavaScript.
- Capturas revisadas de las tres propuestas; PDF de seis paginas generado,
  texto comprobado y paginas de propuesta/manual renderizadas e inspeccionadas.
- No se ejecutan pruebas funcionales de React/API porque no se modificaron.
  Safari/WebKit y la reproduccion fisica de los logos no se comprobaron.

Se corrigio durante la validacion el foco del enlace de salto y se habilito
el acceso por teclado al contenedor desplazable de la tabla comparativa.
Se eliminaron unicamente los archivos de cache creados por la consulta UX.
Los cambios previos del usuario en backend permanecen intactos.

**Estado de la primera exploracion:** entregada y verificada. El usuario
eligio Cerca en el siguiente intercambio; ver la continuacion.

## 15. Cerca en paletas naranjas - 2026-11-02

### Alcance solicitado

El usuario manifesto su preferencia por Cerca y solicito varias versiones
con mas naranja y naranja rojizo para comparar antes de implementar.
Se conserva el logo, la geometria de arcos, Outfit/DM Sans, composicion
y contenido. Solo se explora el sistema cromatico.

### Entregables

- [Comparativa de cuatro paletas](./marca/cerca-colores.html):
  Mandarina, Terracota, Coral y Brasa, con portada, colores y agenda.
- [PDF de la comparativa](./marca/Cerca-paletas.pdf): cinco paginas A3,
  una introduccion y una pagina por paleta.
- Cuatro SVG del logo Cerca en sus nuevos colores, descargables.
- Manual actualizado: Cerca es la direccion elegida; paleta pendiente.
  La comparativa original conserva las propuestas previas y enlaza la nueva.

Se recomienda Coral por su equilibrio entre naranja rojizo, energia y
cercania; Mandarina es la alternativa mas naranja y luminosa.
Brasa explora portada oscura, manteniendo clara la agenda.

### Verificacion

- Playwright con Chromium del sistema: logo conserva los mismos trazados,
  portada y agenda tienen contenido y dimensiones identicos entre paletas.
- 320, 360, 390, 768, 1024, 1440 y 1920 px: sin desbordamiento de pagina,
  acciones principales de al menos 44 px y composicion uniforme.
- Contrastes medidos del CSS renderizado: portada, accion, franja de apoyo,
  tarjeta, cupos y muestra de reserva superan 4,5:1 en las cuatro versiones.
- Navegacion, salto al contenido con foco, anclas y descargas comprobados.
- Axe en 360 y 1440 px: sin infracciones detectadas. Preferencia de
  movimiento reducido respetada; sin errores ni peticiones externas.
- Capturas de las cuatro portadas en movil/escritorio; PDF comprobado
  como cinco paginas con texto seleccionable.

Sin cambios en React/API, dependencias, datos ni configuracion de agentes.
No se ejecutan pruebas funcionales ajenas a estas laminas.
Safari/WebKit e impresion fisica no comprobados.

**Estado de esta exploracion:** el usuario eligio Mandarina y luego preciso
su aplicacion sobre blanco y gris oscuro; ver la siguiente seccion.

## 16. Mandarina como acento y seis logos de gimnasio - 2026-11-02

### Decision y alcance

El usuario eligio Mandarina, con blanco y gris oscuro como base, y aclaro
que no quiere una pagina invadida de color que parezca mas diseno que
gimnasio. Solicito nuevas variantes de logo con T, pesas u otras referencias
de entrenamiento. Se conserva el trato cercano y Outfit/DM Sans.

### Entregables

- [Estudio actual](./marca/cerca-logos.html): paleta neutra, muestra de
  aplicacion y comparativa de T esencial, T barra, Mancuerna, Monograma TG,
  Disco y Pesa rusa.
- [Dossier PDF](./marca/Cerca-logos.pdf): dos paginas A3 con la aplicacion
  neutra y las seis rutas de logo.
- Dieciocho SVG: principal, monocromo y simbolo de cada ruta; sin fuentes,
  imagenes raster ni dependencias.
- Manual actualizado a 0.3. Las exploraciones anteriores conservan sus
  documentos y enlazan el estado actual. No se regeneran los PDF historicos.

Se recomienda T barra por unir la inicial del nombre y el entrenamiento.
La eleccion final del logo sigue pendiente; usarlo en la muestra no implica
aprobacion del usuario.

### Verificacion

- Los 18 SVG son XML valido, con titulos accesibles, solo grafito/Mandarina
  en los principales y una tinta en los monocromos.
- 320, 360, 390, 768, 1024, 1440 y 1920 px: sin desbordamiento de pagina,
  enlaces con altura minima 44 px y simbolos realmente a 24/48 px.
- Contrastes medidos: texto principal 13,28:1; boton Mandarina 5,15:1;
  agenda neutra 12,27:1.
- Medicion de pixeles de la muestra de aplicacion: naranja 0,85 % y
  neutros claros 94,04 % en escritorio; naranja 2,17 % y neutros claros
  88,39 % en movil. Demuestra contencion del color en esa muestra,
  no impone una cuota de superficie al producto final.
- Teclado, salto con foco, navegacion, enlaces y recursos comprobados.
- Axe en 360 y 1440 px: sin infracciones tras corregir la semantica de
  los grupos de simbolos. Movimiento reducido respetado; sin errores ni
  peticiones externas.
- Capturas de aplicacion/comparativa y pagina de logos del PDF revisadas.

Sin cambios en React/API, datos, dependencias o configuracion de agentes.
No se ejecutan pruebas funcionales de la aplicacion intacta.
Safari/WebKit, favicon a 16 px e impresion fisica no comprobados.

**Estado de esta exploracion:** el usuario eligio Mancuerna y solicito
un preview de portada antes de autorizar el rediseno completo.

## 17. Preview con logo Mancuerna - 2026-11-02

### Alcance solicitado y limite

El usuario eligio Mancuerna y pidio un preview simple con la paleta y estilo
acordados. Solo si le gusta aprobara el cambio de la web completa.
Pidio expresamente el manual de marca final una vez aprobado.

Se crea una portada estatica independiente, no una nueva implementacion
de React ni un cambio de la aplicacion funcional. Se usa blanco/grafito,
acentos Mandarina y Outfit/DM Sans. No hay acciones simuladas de negocio.
El manual existente sigue siendo un borrador de trabajo, no la version final.

### Entregables

- [Preview de portada](./marca/preview.html): bienvenida, foto de referencia,
  horarios, actividades, acompañamiento y contacto; navegacion interna.
- Fotografia local WebP de Samuel Girven, Unsplash, con licencia gratuita
  verificada en la pagina oficial. Origen en
  [ORIGEN.txt](./marca/imagenes/ORIGEN.txt); identificada como referencia
  y no como instalaciones de Target GYM.
- Manual de trabajo 0.4 actualizado con logo elegido y aprobacion pendiente.
  Las laminas anteriores enlazan el preview actual.

### Comprobaciones realizadas

- Chromium del sistema: 320, 360, 390, 768, 1024, 1440 y 1920 px, sin
  desbordamiento horizontal; controles principales de al menos 44 px.
- Logo Mancuerna, foto y fuentes locales cargados; enlaces internos y
  archivos enlazados resueltos, sin peticiones externas ni errores de pagina.
- Teclado: salto al contenido, acciones hacia actividades/horarios y
  despliegue de la explicacion; preferencia de movimiento reducido respetada.
- Axe en 390 y 1440 px, con la explicacion desplegada: sin infracciones
  detectadas. Esto no sustituye una auditoria manual completa.
- Capturas de escritorio y movil revisadas visualmente. Se corrigieron
  dos separaciones de palabras al ocultar saltos de linea en movil.
- Safari/WebKit y dispositivos fisicos no comprobados. No se ejecutan
  pruebas funcionales de la aplicacion porque no se modifico su codigo.

**Estado:** preview listo para presentar. Pendiente la aprobacion del
usuario; no consolidar el manual final ni sustituir la interfaz completa
antes de esa aprobacion.

## 18. Revision del preview: menos plantilla, mas claridad - 2026-11-02

El usuario rechazo el lenguaje visual del primer preview y pidio una
propuesta minimalista, funcional, intuitiva y limpia, basada en sus cuatro
referencias. Se reemplaza la portada anterior, sin cambiar la aplicacion
ni volver a explorar el logo Mancuerna o la paleta elegida.

### Direccion y contraste con el pedido

Se visualizaron Hozon, Linear, Still / Form y YAAS en Chromium. Se toman
el protagonismo de una sola imagen, la jerarquia tipografica y la claridad
de navegacion. No se copian sus recursos, codigo, composiciones exactas,
animaciones, ilustraciones ni tipografias comerciales.

- Blanco #FFFFFF, Grafito #2C3035, gris #5C636B, gris claro #F5F6F7,
  linea #D8DDE2 y un acento Mandarina #F48335.
- Una familia de interfaz: DM Sans local. Titulares de peso medio y
  texto de 16 px; se elimina la expresividad redondeada del titular anterior.
- Composicion: titulo directo sobre ubicacion, explicacion y una accion;
  fotografia amplia debajo. Actividades desplegables en lugar de iconos
  y tarjetas repetidas. Horarios y direccion accesibles desde la cabecera.
- Sin esloganes de relleno, etiquetas decorativas, numeracion arbitraria,
  flechas repetidas, esquinas organicas ni bloques de color ornamentales.
- Las funciones del preview son reales: anclas, desplegables por teclado
  y enlace a mapas. No se incorporan login, pagos ni reservas ficticias.

Esquema de lectura:

    logo                         actividades / horarios / ubicacion
    titulo de ubicacion          explicacion + ver actividades
    fotografia amplia del espacio de referencia
    actividades                  listado desplegable
    visita                       horarios + direccion + como llegar
    pie y aclaracion de preview

La fotografia anterior desenfocada se sustituye por una vista del espacio
de Danielle Cerullo; autor, caracter gratuito y archivo original
comprobados en Unsplash. Debe seguir identificada como referencia.

Esta revision no es una aprobacion del diseno. El manual sigue siendo de
trabajo y se consolidara solo despues de la decision del usuario.

### Resultado y comprobacion

- HTML/CSS del preview reemplazados, sin nueva variante ni dependencias.
  Se retiro la portada anterior; logo y paleta se mantienen.
- Capturas de la pagina completa a 390 y 1440 px revisadas visualmente.
- 320, 360, 390, 768, 1024, 1440 y 1920 px: sin desbordamiento de pagina,
  con controles principales de al menos 44 px.
- Recursos y fuente local cargados, un H1, anclas resueltas y foto de
  referencia identificada; sin errores ni peticiones externas al cargar.
- Teclado: salto al contenido, foco en horarios/direccion y apertura/cierre
  de las cuatro actividades y de la nota de preview.
- Destino de Maps comprobado: URL oficial de busqueda con direccion
  completa del proyecto, sin API key ni integraciones nuevas.
- Axe en 360 y 1440 px con los desplegables abiertos: sin infracciones
  detectadas. Preferencia de movimiento reducido comprobada.
- Manual de trabajo actualizado a 0.5: nueva composicion, tipografia y
  procedencia de la foto. No se declara final.

No se comprobaron Safari/WebKit ni dispositivos fisicos. No se modifico
React, API, datos o dependencias, por lo que no se ejecuta la bateria
funcional de la aplicacion intacta. Se preservaron los cambios preexistentes.

**Estado:** revision lista para evaluar, pendiente de aprobacion del
usuario antes del manual final y del cambio de la interfaz completa.

## 19. Recuperar Cerca sin perder claridad - 2026-11-02

El usuario pidio acercar la ultima revision a Cerca, senalando la propuesta
original de index.html, para evitar que la limpieza resulte en una pagina
sin identidad. Se mantienen los parametros recientes, Mancuerna y la paleta.

La comparacion con Cerca identifica tres recursos pertinentes: Outfit en
titulares, bienvenida cercana y una composicion asimetrica con un arco.
Se recuperan sin volver a las ilustraciones abstractas ni a llenar el fondo
de color. La fotografia real de referencia ocupa el arco; el resto conserva
navegacion directa, contenido breve y acciones que funcionan.

    logo                         actividades / horarios / ubicacion
    foto en arco                 bienvenida + ubicacion + ver actividades
    introduccion                 actividades desplegables
    visita                       horarios + direccion + maps

Outfit se limita a titulares y nombres de actividad; DM Sans mantiene
lectura y controles. Radios de 16-24 px suavizan la accion y el desplegable
abierto, sin convertir la pagina en una grilla de tarjetas. Blanco/grafito
siguen siendo la base; Mandarina solo destaca la accion principal y el logo.

### Resultado y comprobacion

- Preview actualizado sin nueva variante, foto o dependencia; se conserva
  la fotografia de referencia identificada y el logo elegido.
- Capturas completas a 390 y 1440 px revisadas: se recuperan la composicion,
  el arco y la tipografia de Cerca, sin volver al color de fondo invasivo.
- 320, 360, 390, 768, 1024, 1440 y 1920 px: sin desbordamiento,
  controles principales de al menos 44 px. Comprobada foto a la izquierda
  en escritorio y texto antes de foto en movil.
- Ambas fuentes locales cargadas; Outfit aplicado al titular y boton con
  Mandarina exacto. Recursos, anclas y destino de Maps validos.
- Regresion de teclado: salto al contenido, foco en horarios/direccion y
  apertura/cierre de las cuatro actividades y de la nota de preview.
- Axe en 360 y 1440 px con todos los desplegables abiertos: sin infracciones
  detectadas ni desbordamiento. Movimiento reducido respetado.
- Sin errores de pagina ni peticiones externas al cargar. Manual de
  trabajo actualizado a 0.6; no se declara final.

Safari/WebKit y dispositivos fisicos no comprobados. Sin cambios en
React, API, datos o dependencias; se conservan los cambios preexistentes.

**Estado:** preview listo para evaluar. La interfaz completa y el manual
final siguen esperando aprobacion del usuario.

## 20. Identidad Cerca aprobada: aplicacion completa y manual - 2026-11-02

El usuario aprobo explicitamente la revision de la seccion 19 y pidio
aplicarla a toda la web y generar el manual de marca.

### Alcance de implementacion

- Conservar Mancuerna, blanco/grafito/Mandarina, Outfit/DM Sans y el arco
  fotografico de la portada aprobada. Mantener la foto como referencia
  identificada hasta contar con una foto autorizada del gimnasio.
- Actualizar logo, favicon y fuentes locales con sus licencias.
- Portada: bienvenida y foto aprobadas, actividades desplegables, acceso
  real a la agenda y presentacion institucional existente.
- Componentes compartidos: cabecera responsive, navegacion publica y por
  rol, formularios, filtros, clases, registros, membresia, reportes,
  notificaciones, dialogos y estados de carga/vacio/error.
- Mantener rutas, validaciones, permisos, API, persistencia, reservas,
  pagos, membresias y asistencia. Preservar cambios ajenos del backend.
- Consolidar un manual final de una sola identidad, separando las
  exploraciones historicas. Entregar tambien una version visual PDF.
- Verificar build, lint, pruebas frontend y flujos existentes de navegador,
  ampliados para las superficies de cada rol y la marca aprobada.

Se reutilizan los componentes actuales y CSS propio. Sin bibliotecas de UI,
subagentes, commits ni despliegue. Los estados de error no heredan el
naranja de marca: mantienen un color semantico y texto explicito.

### Implementacion realizada

- Portada aprobada aplicada a React, con bienvenida Outfit, arco fotografico,
  actividades desplegables y acceso a la agenda real. Se conserva Nosotros.
- Cabecera y pie con Mancuerna; favicon actualizado. Fuentes locales y
  licencias distribuidas en public/marca. Se retiran Oswald/Nunito Sans del
  manifest y lockfile mediante npm; sin nuevos paquetes.
- Tokens y CSS compartidos actualizados para todas las rutas: agenda,
  formularios de acceso/registro/perfil, socio, gestion e instructor,
  registros, filtros, membresia, reportes, dialogos y estados.
- Grafito sobre Mandarina en acciones. Error separado de marca, con borde
  rojo oscuro y mensaje; notificaciones de confirmacion diferenciadas.
- Manual final 1.0 en Markdown, visual HTML y PDF A4 etiquetado de 6 paginas.
  Incluye maestros de logo, proteccion proporcional, paleta/contraste,
  tipografia/licencias, componentes, voz, fotografia y limites de publicacion.
  Se conserva el borrador anterior como exploracion historica separada.
- README y FR-020 actualizados con la identidad explicitamente aprobada.
  No se cambian reglas ni otros requisitos. Configuracion CreateApp alineada.

### Verificacion realizada

- npm run build y npm run lint correctos con la entrega integrada.
- 26 pruebas frontend aprobadas en 7 archivos, incluyendo una prueba de
  portada, enlaces reales y referencia fotografica. El descubridor integrado
  no detecto Vitest; se uso el runner npm existente.
- 3 recorridos Playwright aprobados: administracion/socio/instructor
  completos, interfaz publica y zoom nativo 200 %. Se verificaron alta de
  instructor/clase/socio, precio, pago sin duplicar, permisos, perfil,
  reserva/cancelacion, asistencia, reportes y eliminacion con historial.
- Identidad y Axe a 360/1440 px en 14 rutas de los tres roles, ademas de
  portada responsive a 320/360/390/768/1024/1440/1920. Sin infracciones
  detectadas ni desbordamiento de pagina en esas comprobaciones.
- Desplegables por teclado, menu con Escape y foco, errores/reintento,
  campos y formularios, dialogo y retorno de foco comprobados.
- Capturas de portada escritorio/movil y superficies de los tres roles
  revisadas visualmente. Sin perdida de funciones ni color de marca anterior.
- Se adapto la configuracion E2E a rutas multiplataforma y Chromium del
  sistema mediante variable opcional. Se uso el puerto 5175 porque 5174
  pertenecia a otro proyecto; no se detuvo ni reutilizo ese servidor.
- Un selector de prueba global de dd alcanzo el nuevo horario semantico
  del pie; se acoto a report-values. La repeticion completa paso.
- Manual HTML: responsive y Axe a 360/1440 sin infracciones; seis hojas
  ajustadas, PDF de seis paginas confirmado y revisado visualmente.
- Contrastes finales medidos: Grafito/blanco 13,28:1, Grafito/Mandarina
  5,15:1, secundario/gris claro 5,62:1, borde/blanco 4,28:1 y error/fondo
  7,60:1. Assets de distribucion identicos a sus maestros; enlaces del
  manual resueltos; diff --check correcto respetando CRLF.
- Web real comprobada con API local: health correcto, fuentes y assets
  locales, anclas con foco, agenda/acceso, movil y movimiento reducido.
  Sin errores de pagina ni peticiones externas al cargar.
- Frontend y backend de desarrollo disponibles en 127.0.0.1:5173 y :3000,
  con readiness HTTP verificada. Sin poblar la base local con datos E2E.

No se ejecutaron nuevamente pruebas backend ni auditoria de dependencias:
su codigo no fue modificado por esta tarea. Se conservaron los cambios
ajenos en Database.js y persistencia.test.js.

**Limites:** Safari/WebKit, dispositivos fisicos, impresion fisica,
Neon/Vercel y publicacion no comprobados. La foto sigue identificada como
referencia y los datos institucionales requieren confirmacion. La aprobacion
visual no equivale a publicacion ni certificacion de accesibilidad o marca.

**Estado:** identidad aprobada aplicada a toda la interfaz, manual final
entregado y comprobaciones locales completadas. Sin commits ni despliegue.

## 21. Ajustes de uso, cabecera y planes en inicio - 2026-11-02

Pedido: avisos temporales, ocultar logo y usar el nombre, planes/precios
en portada, retirar leyenda fotografica, simplificar navbar y animar
el despliegue del menu movil.

- Notificaciones: autocierre independiente de 6 s (confirmacion) y 10 s
  (error), pausa al pasar el puntero o enfocar, cierre manual y limpieza
  al desmontar. Posicion flotante sin desplazar el contenido ni quedar
  atrapadas antes de la cabecera.
- Nombre temporal Target gym en Outfit, sin simbolo en cabecera/pie;
  conservar maestros y documentar la excepcion temporal.
- Inicio con los planes obtenidos de /api/planes, total por periodo en ARS
  y descuento configurado. No inventar precios ni simular cobro online;
  carga, error con reintento y precio no configurado explicitos.
- Navegacion publica: Inicio, Clases y Planes, mas acceso/cuenta y rutas
  del rol sin duplicar la agenda del socio. Mantener acceso a toda funcion.
- Menu movil con entrada suave al abrir, Escape/cierre por enlace y
  preferencia de movimiento reducido. Opciones cerradas no enfocables.
- Retirar la leyenda visible de portada, conservando origen/licencia y
  aclaracion de la fotografia en documentacion. No atribuirla al gimnasio.
- Actualizar manual y PDF con cambios operativos/temporales.

Prueba de regresion de notificaciones ejecutada antes del arreglo: tres
casos fallan por ausencia de temporizadores/autocierre. Los demas cambios
se comprobaran con pruebas de planes y navegador responsive/accesible.

### Resultado y comprobaciones

- Implementados todos los ajustes. El favicon temporal usa una T; los SVG
  originales permanecen sin cambios. No se modificaron backend ni precios.
- 37 pruebas frontend aprobadas en 8 archivos: autocierre a 6000/10000 ms,
  temporizadores independientes, pausa puntero/foco, cierre manual y
  limpieza en StrictMode/desmontaje; planes, descuento, precio nulo,
  carga/vacio/error/reintento y acciones por rol.
- Tres recorridos Playwright aprobados juntos en Chromium del sistema:
  administrador/socio/instructor, interfaz publica y zoom nativo al 200%.
  Verificados precios configurados, total por periodo, menu de 220 ms,
  movimiento reducido, Escape/retorno de foco y cierre por enlace.
- El aviso de error desaparece en navegador a los 10 s; su panel de error
  y reintento permanecen. La pila es flotante y no mueve el contenido.
- Responsive de portada entre 320 y 1920 px, Axe sin violaciones en los
  estados comprobados y capturas revisadas en movil/escritorio.
- Build de produccion, lint y comprobacion de espacios correctos.
  La primera comprobacion de moneda de pruebas se ajusto para normalizar
  espacios no separables y convertir centavos a ARS en el oraculo E2E.
- Manual 1.1 en Markdown/HTML y PDF etiquetado regenerado: seis hojas A4
  sin desborde; revisadas visualmente las hojas de logo y sistema.
  Actualizados README y registros de origen sin borrar autor/licencia.
- Aplicacion real local comprobada con sus planes vigentes. Sin commits
  ni despliegue. Chromium no acredita Safari/WebKit ni dispositivos fisicos;
  no se repitieron backend, auditoria de dependencias o pruebas de produccion.

**Estado:** pedido implementado y validado localmente.

## 22. Catalogo de planes e informacion del gimnasio - 2026-11-02

Alcance confirmado por el usuario:

- Crear, editar y eliminar planes con nombre, duracion en meses, precio,
  porcentaje de descuento y condiciones opcionales. Mantener Cerca.
- Deshabilitar los retira de portada/registro y bloquea contrataciones
  nuevas; quienes ya tuvieron el plan pueden seguir renovandolo.
- Eliminar los retira tambien de renovaciones, conservando membresias,
  importes y nombres historicos. Identificador estable, no reutilizable.
- Administrador puede cambiar el plan vigente de un socio a uno habilitado
  sin cobrar ni modificar fechas; conservar anterior y auditar autor/fecha.
- Condiciones/método de descuento se muestran con precio base y promocional;
  administrador confirma presencialmente si se cumplen al registrar pago.
  Los descuentos generales conservan su aplicacion automatica.
- Sin cupos: el usuario retiro expresamente ese pedido. Sin pagos online:
  integrar Mercado Pago/tarjeta queda para otro paso autorizado.
- Nueva carpeta info/target-gym con datos extraidos de las fuentes aportadas,
  fecha y procedencia por dato. No inventar WhatsApp a partir de un telefono.
  Solo publicar contactos verificados; grilla de clases no equivale a
  sesiones reales de la agenda ni se carga automaticamente.
- Migracion versionada de las tablas existentes, API con rol administrador,
  CSRF, validacion estricta y transacciones; todas las superficies usan el
  catalogo dinamico, sin enum fijo mensual/trimestral/anual.

Pruebas iniciales: cuatro casos nuevos fallan antes de implementar por
ausencia de CRUD, renovaciones diferenciadas y rutas protegidas.

### Resultado y evidencia

- Catalogo dinamico implementado en API, administracion, portada, registro,
  solicitudes, pagos y detalle del socio. Los nombres visibles no exponen
  identificadores tecnicos. La seleccion de plan en registro sigue requerida.
- Migracion versionada 2: mantiene los identificadores iniciales y datos
  previos; nombres/importes/condiciones se guardan en los pagos nuevos y el
  nombre en cada membresia. No se infieren descuentos de pagos antiguos.
- Deshabilitar permite renovar a quienes tienen membresias anteriores del
  plan; eliminar lo retira tambien de renovaciones sin borrar las vigencias.
  Los cambios administrativos conservan fechas y se muestran con autor/fecha
  en el historial; nunca inventan un pago.
- Condiciones/método opcionales se publican junto al precio promocional
  separado del base. El cobro condicionado exige confirmacion explicita
  compatible con el metodo; cambiar de socio/plan/metodo la reinicia.
  El servidor calcula montos y conserva idempotencia por UUID.
- Relevamiento: Maps confirma telefono 011 4795-5087, lunes-viernes 6-22 h,
  sabados 8-20 h y domingos cerrado. Perfil/publicacion de Instagram
  confirman direccion y actividades de referencia. Se agregan telefono,
  Instagram y horarios al pie; feriados por consultar.
- Nueva carpeta info/target-gym con JSON de datos y FUENTES.md, procedencia
  por dato y limitaciones. WhatsApp no confirmado: no se inventa wa.me.
  Instagram restringe parte del contenido sin sesion; no se elude.
  targetgym.net devolvio 404. La grilla no se importa como sesiones/cupos.
- Pruebas: 20 backend y 44 frontend aprobadas; seis casos de backend
  focalizados repetidos tras los ajustes de auditoria y persistencia.
  Incluyen permisos/CSRF, entradas invalidas, redondeo, condiciones,
  renovaciones, eliminacion logica, migracion desde esquema previo y
  persistencia de plan personalizado/deshabilitado al reabrir la base.
- Cuatro recorridos Playwright aprobados juntos: flujo completo por roles,
  interfaz publica, catalogo/promocion/renovacion/cambio/eliminacion y zoom
  nativo al 200%. Axe sin violaciones en estados comprobados, responsive
  de portada entre 320-1920 px y formularios nuevos a 360/1440 px.
- Capturas revisadas de gestion y portada real movil/escritorio; catalogo
  real conserva sus precios originales. Build, lint y espacios correctos.
  Manual actualizado y PDF etiquetado de seis hojas A4 sin desborde.
- Sin nuevas dependencias, cupos de planes, pagos online, commits ni
  despliegue. Neon/Vercel, Safari/WebKit y dispositivos fisicos no probados.

**Estado:** pedido implementado, persistido y verificado localmente.

## 23. WhatsApp confirmado por el usuario - 2026-11-02

Numero informado: 1168244559. Guardado como 11 6824-4559 y enlace
https://wa.me/5491168244559, con fuente de confirmacion directa del usuario.
Agregado al pie, separado del telefono fijo de Maps. Actualizados JSON,
FUENTES.md y README; sin afirmar verificacion externa de titularidad.

Comprobaciones: prueba focalizada del pie aprobada, build y lint correctos.
Chromium a 390/1440 px: enlace exacto, area tactil de 44 px, sin desborde
horizontal y Axe sin violaciones en el pie. La pestaña integrada no pudo
desplazarse estando oculta; la verificacion se completo en Chromium local.
No se abrio una conversacion ni se enviaron mensajes. No se repitieron
backend ni bateria completa por este ajuste de contenido.

**Estado:** contacto incorporado y comprobado.

## 24. Asociacion, espacio del socio y portal del equipo - 2026-11-02

**Alcance aprobado:** aplicar la propuesta de accesos y entregar un informe.
Asociate para altas nuevas, Ya soy socio para ingresar y Mi espacio cuando
existe una sesion. Portal del equipo separado visualmente, con la misma
autenticacion y permisos por rol.

Plan obligatorio con precio y metodo de pago manual en el registro publico.
Cuenta creada no equivale a membresia activa: efectivo requiere cobro
confirmado, transferencia requiere verificacion del administrador. Declarar
una transferencia no acredita dinero ni habilita reservas.

Altas administrativas sin compartir contraseñas, mediante invitacion de
primer acceso de un uso y vencimiento. Panel de gestion centrado en altas,
pagos pendientes y vencimientos. Conservar planes, historial y reglas actuales.

Secuencia: pruebas de reglas y permisos; migracion y API; interfaz responsive;
pruebas de integracion y navegador; requisitos, README e informe solicitado.
Fuera de esta etapa: pasarela online, correo automatico, comprobantes subidos
a la web y segundo factor. No inventar datos bancarios ni enviar mensajes.

**Cierre:** implementacion local completa. Migracion 3 conserva cuentas y
membresias; plan con precio y metodo obligatorios en alta publica; declaracion
de transferencia no activa nada; cobro confirmado, idempotencia y permisos
comprobados. Invitaciones de un uso/48 horas con hash, reemplazo y expiracion.

Verificacion final: 26 pruebas backend, 58 frontend y seis flujos Playwright
aprobados; build, lint y diff --check correctos. Persistencia de solicitudes e
invitaciones comprobada tras cerrar/reabrir la base. Responsive, teclado,
Escape, movimiento reducido y Axe en las pantallas comprobadas; zoom nativo
Chromium al 200%. Manual 1.2: seis paginas A4 etiquetadas, sin desborde.

Entregado [informe de cambios](./Informe-de-asociacion-y-accesos.md).
Actualizados requisitos FR-001 y FR-023/024/025, README y manual de marca.
Aplicacion local disponible. Sin pasarela, mensajes, servicios externos,
commits ni despliegue; no se acredita Safari/iPhone ni Neon/Vercel reales.

**Estado:** aplicado, documentado y verificado localmente.
