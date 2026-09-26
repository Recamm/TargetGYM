# Feature Specification: Sistema de Gestion de Gimnasio Target GYM

**Feature Branch**: `001-sistema-gestion-gimnasio`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Basate en info" (fichas tecnicas, funcionalidades, reglas de negocio, diagrama de clases y diseño UX/UI de Target GYM provistos en la carpeta `info/`)

## Clarifications

### Session 2026-09-25

- Q: ¿Con cuántos días de anticipación al vencimiento debe el sistema mostrar la alerta de "membresía próxima a vencer" al administrador? → A: 7 días antes del vencimiento
- Q: ¿Qué duración exacta debe tener cada plan de membresía para calcular la fecha de vencimiento? → A: Duración en meses calendario (1, 3 o 12 meses segun el plan); el vencimiento cae el mismo dia del mes de inicio N meses despues (ej. contratado el 20 de enero vence el 20 de febrero para un plan de 1 mes)
- Q: Cuando la membresía de un socio vence o es suspendida, ¿qué debe pasar con sus inscripciones futuras ya "Confirmada" a clases? → A: Pasan a "Pendiente" durante un periodo de gracia de 3 dias para que el socio regularice el pago; si no renueva en ese plazo, la inscripcion se cancela y el cupo se libera

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un socio se inscribe a una clase grupal (Priority: P1)

Un socio con membresia activa quiere ver el calendario semanal de clases (spinning,
funcional, zumba, etc.), elegir una que tenga cupo disponible y reservar su lugar con
un clic.

**Why this priority**: Es la funcionalidad de negocio central del sistema (inscripcion
a clases grupales con control de cupo); sin ella el resto de las funcionalidades no
generan valor operativo para el gimnasio.

**Independent Test**: Puede probarse de forma independiente creando un socio con
membresia activa y una clase con cupo disponible, inscribiendolo, y verificando que la
inscripcion queda en estado "Confirmada" y el cupo disponible de la clase se reduce en
uno.

**Acceptance Scenarios**:

1. **Given** un socio con membresia activa y una clase con cupo disponible, **When**
   el socio se inscribe a la clase, **Then** la inscripcion queda "Confirmada" y el
   cupo disponible de la clase disminuye en uno.
2. **Given** un socio con membresia vencida o cancelada, **When** intenta inscribirse
   a una clase, **Then** el sistema rechaza la inscripcion e informa que su membresia
   no esta activa.
3. **Given** una clase que ya alcanzo su cupo maximo, **When** un socio intenta
   inscribirse, **Then** el sistema rechaza la inscripcion informando que no hay
   cupo disponible.
4. **Given** un socio ya inscripto a una clase en un horario determinado, **When**
   intenta inscribirse nuevamente a la misma clase y horario, **Then** el sistema
   rechaza la doble inscripcion.
5. **Given** un socio con una inscripcion "Confirmada" a una clase que comienza en
   mas de 2 horas, **When** cancela su inscripcion, **Then** la inscripcion pasa a
   "Cancelada" y el cupo de la clase se libera.
6. **Given** un socio con una inscripcion "Confirmada" a una clase que comienza en
   menos de 2 horas, **When** intenta cancelar su inscripcion, **Then** el sistema
   rechaza la cancelacion.

---

### User Story 2 - El administrador gestiona clases y horarios (Priority: P1)

Un administrador quiere crear, editar, cancelar y eliminar clases grupales,
asignandoles instructor, horario y cupo maximo, para mantener actualizada la oferta
semanal del gimnasio.

**Why this priority**: Sin esta gestion no existirian clases disponibles para que los
socios se inscriban; es un prerrequisito operativo del CRUD principal del sistema.

**Independent Test**: Puede probarse de forma independiente iniciando sesion como
administrador, creando una clase con instructor, horario y cupo maximo validos, y
verificando que aparece en el listado de clases disponible para los socios.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea una clase con nombre, tipo,
   fecha/hora futura, cupo maximo mayor a cero e instructor asignado, **Then** la
   clase queda disponible en el calendario semanal.
2. **Given** un administrador autenticado, **When** intenta crear una clase con cupo
   igual o menor a cero, **Then** el sistema rechaza la creacion.
3. **Given** un administrador autenticado, **When** intenta crear o editar una clase
   con fecha/hora en el pasado, **Then** el sistema rechaza la operacion.
4. **Given** una clase existente sin inscripciones en curso, **When** el
   administrador la edita (horario, instructor o cupo) o la elimina, **Then** los
   cambios se reflejan inmediatamente en el calendario visible para los socios.
5. **Given** una clase con socios inscriptos, **When** el administrador la cancela,
   **Then** todas las inscripciones asociadas pasan a estado "Cancelada" y se libera
   el cupo.
6. **Given** un usuario con rol Socio o Instructor, **When** intenta crear, editar o
   eliminar una clase, **Then** el sistema rechaza la operacion por falta de permisos.

---

### User Story 3 - El administrador gestiona socios y membresias (Priority: P2)

Un administrador quiere dar de alta, modificar, suspender o dar de baja socios, y
registrar los pagos de sus cuotas, para mantener el estado de las membresias al dia.

**Why this priority**: Habilita el ciclo de vida completo del socio y es necesario
para que la regla "solo socios con membresia activa pueden inscribirse" tenga datos
reales con los cuales operar; depende de que existan clases (US2) para tener sentido
practico, pero no bloquea la demostracion de valor de US1 en un escenario de datos
precargados.

**Independent Test**: Puede probarse de forma independiente dando de alta un socio,
asignandole un plan (mensual, trimestral o anual), registrando un pago, y verificando
que el estado de la membresia queda "activa" con su fecha de vencimiento calculada.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** da de alta un socio con datos
   validos y un plan de membresia, **Then** el socio queda registrado con su
   membresia en estado activo y fecha de vencimiento calculada segun el plan.
2. **Given** un socio con datos ya registrados, **When** el administrador intenta
   registrar otro socio con el mismo email, **Then** el sistema rechaza el alta.
3. **Given** un socio con cuota vencida, **When** el administrador registra el pago
   correspondiente, **Then** la membresia vuelve a estado activo y se actualiza la
   fecha de vencimiento.
4. **Given** un socio con membresia proxima a vencer o ya vencida, **When** el
   administrador consulta el listado de socios, **Then** el sistema muestra una
   alerta visible indicando ese estado.
5. **Given** un socio existente, **When** el administrador lo suspende o da de baja,
   **Then** el socio queda bloqueado para inscribirse a nuevas clases manteniendo su
   historial visible.
6. **Given** un socio que contrata un plan anual, **When** se le aplica el descuento
   correspondiente, **Then** el descuento se aplica solo a esa contratacion y no se
   traslada a renovaciones con otro tipo de plan.
7. **Given** un socio con inscripciones futuras "Confirmada" cuya membresia acaba de
   vencer, **When** transcurre el periodo de gracia de 3 dias sin que renueve el pago,
   **Then** esas inscripciones pasan a "Cancelada" y el cupo de las clases se libera.

---

### User Story 4 - Consulta de disponibilidad e historial de asistencia (Priority: P3)

Cualquier visitante quiere ver que clases tienen lugares disponibles antes de
registrarse, y tanto el socio como el administrador quieren consultar el historial de
clases a las que asistio cada socio.

**Why this priority**: Aporta valor de visibilidad y confianza (atrae potenciales
socios y da trazabilidad de asistencia), pero el sistema es funcional sin esta vista
si las inscripciones (US1) y clases (US2) ya existen.

**Independent Test**: Puede probarse de forma independiente accediendo sin
autenticacion al panel de disponibilidad y verificando que se listan las clases con
cupo restante; y por separado, consultando el historial de un socio autenticado y
verificando que muestra las clases finalizadas a las que asistio.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** accede al panel de disponibilidad,
   **Then** ve el listado de clases con su cupo disponible actualizado, sin poder
   inscribirse hasta registrarse.
2. **Given** un socio autenticado, **When** consulta su historial de asistencia,
   **Then** ve las clases finalizadas a las que asistio con fecha y estado.
3. **Given** un administrador autenticado, **When** consulta el historial de
   asistencia de un socio o el reporte de ocupacion de una clase, **Then** ve el
   detalle correspondiente.
4. **Given** un instructor autenticado, **When** confirma la asistencia de los socios
   al inicio de su clase, **Then** las inscripciones correspondientes quedan
   registradas como asistidas para el historial.

---

### Edge Cases

- ¿Que pasa si dos socios intentan reservar simultaneamente el ultimo lugar
  disponible de una clase? El sistema debe garantizar que solo uno obtenga la
  confirmacion y el otro reciba el rechazo por falta de cupo.
- ¿Que pasa si un administrador elimina una clase que tiene inscripciones
  "Confirmada" o "Pendiente"? Las inscripciones deben pasar a "Cancelada" y
  notificar la liberacion de cupo, no quedar huerfanas.
- ¿Que pasa si un socio intenta registrarse con menos de 16 años? El alta autonoma
  debe rechazarse.
- ¿Que pasa si se intenta registrar un pago para una membresia ya activa y vigente?
  El sistema debe permitirlo como renovacion anticipada, extendiendo la fecha de
  vencimiento desde la fecha actual de vencimiento (no desde hoy).
- ¿Que pasa cuando vence la membresia de un socio con inscripciones futuras
  "Confirmada"? Esas inscripciones pasan a "Pendiente" durante un periodo de gracia
  de 3 dias; si el socio no renueva en ese plazo, se cancelan automaticamente y se
  libera el cupo para otros socios.
- ¿Que pasa si una clase pasa a estado "En curso"? Las inscripciones asociadas ya no
  pueden cancelarse, independientemente del tiempo restante.
- ¿Que pasa si un instructor intenta editar los datos de un socio o de un plan? El
  sistema debe rechazar la operacion por falta de permisos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir a un visitante registrarse como socio
  eligiendo un plan de membresia (mensual, trimestral o anual), validando nombre,
  apellido, email, contraseña, DNI, telefono y fecha de nacimiento (16 años o mas).
- **FR-002**: El sistema MUST validar que el email sea unico y tenga formato
  `usuario@dominio.com` antes de aceptar un registro o actualizacion.
- **FR-003**: El sistema MUST exigir contraseñas de al menos 8 caracteres, con al
  menos una mayuscula y un numero.
- **FR-004**: El sistema MUST permitir a un administrador dar de alta, modificar,
  suspender y dar de baja socios, viendo su informacion completa.
- **FR-005**: El sistema MUST calcular y mantener el estado (activa, vencida,
  suspendida, cancelada) y la fecha de vencimiento de cada membresia segun el plan
  contratado, sumando a la fecha de inicio la cantidad de meses calendario del plan
  (mensual = 1 mes, trimestral = 3 meses, anual = 12 meses), venciendo el mismo dia
  del mes de inicio N meses despues (ej. contratada el 20 de enero, un plan mensual
  vence el 20 de febrero).
- **FR-006**: El sistema MUST permitir al administrador registrar pagos de cuotas y
  mostrar alertas de membresias vencidas o que vencen dentro de los proximos 7 dias.
- **FR-007**: El sistema MUST aplicar el descuento del plan anual unicamente en el
  momento de contratar ese plan, sin trasladarlo a otros planes ni de forma
  retroactiva.
- **FR-008**: El sistema MUST permitir al administrador crear, editar, cancelar y
  eliminar clases grupales, asignando instructor, horario y cupo maximo.
- **FR-009**: El sistema MUST rechazar la creacion o edicion de una clase con cupo
  maximo igual o menor a cero, o con fecha/hora en el pasado.
- **FR-010**: El sistema MUST mostrar a los socios el calendario semanal de clases
  disponibles con su cupo restante.
- **FR-011**: El sistema MUST mostrar a cualquier visitante (sin necesidad de
  registrarse) un panel de disponibilidad de clases en tiempo real.
- **FR-012**: El sistema MUST permitir a un socio con membresia activa inscribirse a
  una clase con cupo disponible, reduciendo el cupo disponible en uno al confirmar.
- **FR-013**: El sistema MUST rechazar la inscripcion de un socio sin membresia
  activa, o a una clase sin cupo disponible, o cuando el socio ya esta inscripto a
  esa misma clase y horario.
- **FR-013a**: Cuando la membresia de un socio vence, el sistema MUST pasar sus
  inscripciones futuras "Confirmada" a estado "Pendiente" durante un periodo de
  gracia de 3 dias; si el socio no renueva su membresia dentro de ese plazo, el
  sistema MUST cancelar automaticamente esas inscripciones y liberar el cupo
  correspondiente.
- **FR-014**: El sistema MUST permitir a un socio cancelar su inscripcion solo si
  faltan 2 horas o mas para el inicio de la clase, liberando el cupo al cancelar.
- **FR-015**: El sistema MUST modelar el ciclo de vida de una inscripcion con los
  estados Pendiente, Confirmada, En curso, Finalizada y Cancelada, sin permitir
  transiciones invalidas (por ejemplo, cancelar una inscripcion "En curso" o
  "Finalizada").
- **FR-016**: El sistema MUST permitir a un instructor visualizar unicamente las
  clases que tiene asignadas y confirmar la asistencia de los socios inscriptos al
  inicio de cada clase.
- **FR-017**: El sistema MUST permitir a socios y administradores consultar el
  historial de clases a las que asistio cada socio.
- **FR-018**: El sistema MUST permitir al administrador consultar reportes de
  asistencia y ocupacion por clase.
- **FR-019**: El sistema MUST restringir cada operacion segun el rol del usuario
  autenticado: solo el administrador puede modificar o eliminar clases y usuarios;
  los socios solo pueden ver y gestionar sus propias inscripciones y perfil; los
  instructores solo pueden ver sus clases asignadas y confirmar asistencia.
- **FR-020**: El sistema MUST presentar la interfaz publica (paginas de presentacion,
  calendario y panel de disponibilidad) respetando la identidad visual definida
  (paleta negro/blanco/rojo y tipografias Oswald/Nunito Sans).

### Key Entities *(include if feature involves data)*

- **Usuario**: entidad base con nombre, apellido, email (unico), contraseña, DNI,
  telefono y fecha de nacimiento; se especializa en Administrador, Socio e
  Instructor, cada uno con permisos distintos.
- **Socio**: usuario registrado con membresia; tiene fecha de alta y estado (activo,
  suspendido, dado de baja); se relaciona con Membresia (1 a muchas, historial de
  planes) e Inscripcion (1 a muchas).
- **Membresia**: plan contratado por un socio (mensual = 1 mes, trimestral = 3 meses,
  anual = 12 meses) con fecha de inicio, fecha de vencimiento calculada en meses
  calendario desde el inicio, estado (activa/vencida) y precio; se relaciona con
  Pago (1 a muchas).
- **Pago**: registro de un pago de cuota o membresia, con fecha, monto y metodo de
  pago; pertenece a una Membresia.
- **Clase**: actividad grupal con nombre, tipo, fecha, hora de inicio, cupo maximo y
  cupo disponible; dictada por un Instructor; recibe muchas Inscripciones.
- **Inscripcion**: vinculo entre un Socio y una Clase, con fecha de inscripcion y
  estado (Pendiente, Confirmada, En curso, Finalizada, Cancelada) que determina si
  puede cancelarse o no.
- **Instructor**: usuario con especialidad, asignado a una o varias Clases; confirma
  asistencia de los socios inscriptos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un socio puede completar el flujo de inscripcion a una clase (buscar,
  seleccionar y confirmar) en menos de 1 minuto.
- **SC-002**: El 100% de los intentos de inscripcion a clases sin cupo disponible o
  con membresia inactiva son rechazados por el sistema, sin excepciones.
- **SC-003**: El 100% de las clases creadas por el administrador cumplen las
  validaciones de cupo positivo y fecha futura antes de quedar disponibles para los
  socios.
- **SC-004**: Un visitante puede consultar la disponibilidad de clases sin
  registrarse en menos de 10 segundos desde que ingresa al sitio.
- **SC-005**: El sistema mantiene consistencia de cupo (cupo disponible + inscriptos
  confirmados = cupo maximo) en el 100% de las clases en todo momento.
- **SC-006**: El 100% de los intentos de acceso a operaciones fuera del rol del
  usuario (por ejemplo, un socio editando una clase) son bloqueados.

## Assumptions

- Se asume autenticacion estandar basada en sesion/credenciales (email + contraseña)
  para Socios, Administradores e Instructores; no se especifico un metodo de
  autenticacion externo (SSO/OAuth).
- Se asume que el registro de pagos es manual por parte del administrador (no se
  especifico integracion con pasarela de pagos online).
- Se asume que el rol Instructor es parte del alcance del proyecto como "plus" sobre
  los roles obligatorios Administrador y Socio, segun lo indicado en los requisitos
  minimos del proyecto.
- Se asume que el panel de disponibilidad publico solo muestra informacion agregada
  de cupo (sin datos personales de los socios inscriptos).
- Se asume que la renovacion de membresia antes del vencimiento extiende la fecha
  desde el vencimiento anterior, y no desde la fecha del pago, para no perjudicar al
  socio.
