<!--
Sync Impact Report
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first adoption, all principles newly defined)
- Added sections:
  - Core Principles I-V (Integridad de Reglas de Negocio, Control de Acceso por Rol,
    Validacion Estricta de Datos, Consistencia de Identidad Visual y UX, Alcance Minimo Viable)
  - Modelo de Datos y Flujo de Estados
  - Flujo de Trabajo de Desarrollo
  - Governance
- Removed sections: none (template placeholders replaced)
- Deferred / TODO placeholders: none
- Templates requiring follow-up: none identified at this time (plan/spec/tasks templates
  read this file at runtime; no updates required for this ratification)
-->

# Target GYM Constitution

## Core Principles

### I. Integridad de Reglas de Negocio (NON-NEGOTIABLE)
Las reglas de negocio del gimnasio son de cumplimiento obligatorio en toda la aplicacion,
tanto en el backend como en cualquier validacion de UI, y no pueden ser omitidas por
conveniencia de implementacion:
- No se permite inscripcion a una clase sin cupo disponible.
- Solo socios con membresia activa pueden inscribirse a clases; membresia vencida o
  cancelada bloquea la inscripcion.
- No se permite doble inscripcion de un mismo socio a la misma clase y horario.
- No se puede cancelar una inscripcion con menos de 2 horas de anticipacion al inicio
  de la clase.
- El email es unico por cuenta; no se aceptan registros con un email ya existente.
- Los descuentos por plan anual aplican unicamente al contratar ese plan; no son
  retroactivos ni transferibles a otros planes.
- Solo el administrador puede modificar o eliminar clases y usuarios; los socios
  gestionan exclusivamente sus propias inscripciones.

Rationale: estas reglas modelan el funcionamiento real del gimnasio; violarlas produce
overbooking, fraude de membresias o inconsistencias de datos que afectan directamente
la operacion del negocio.

### II. Control de Acceso por Rol
El sistema define tres roles con permisos estrictamente delimitados y verificados en
cada operacion sensible (no solo ocultos en la UI):
- **Administrador**: acceso total — alta/baja/modificacion/suspension de socios, CRUD
  completo de clases y horarios, registro de pagos, asignacion de instructores,
  visualizacion de reportes de asistencia y ocupacion.
- **Socio/Cliente**: gestiona su propio perfil y contraseña, contrata o renueva su
  plan, consulta el calendario de clases, se inscribe/cancela su lugar (respetando la
  regla de las 2 horas) y consulta su propio historial de asistencia.
- **Instructor/Empleado**: visualiza unicamente las clases que tiene asignadas y
  confirma la asistencia de los socios; no puede modificar datos de socios ni planes.

Rationale: la separacion de permisos protege la integridad de los datos de socios y
pagos, y evita que un rol realice acciones fuera de su responsabilidad funcional.

### III. Validacion Estricta de Datos
Toda entrada de datos debe validarse antes de persistirse, tanto en el cliente como en
el servidor:
- Campos obligatorios en el registro: nombre, apellido, email, contraseña, DNI y
  telefono.
- Formato de email valido (`usuario@dominio.com`).
- El socio debe ser mayor de 16 años para registrarse de forma autonoma.
- Contraseña con minimo 8 caracteres, al menos una mayuscula y un numero.
- El cupo de una clase debe ser mayor que cero al crearla.
- La fecha/hora de una clase no puede ser en el pasado al crearla o editarla.

Rationale: la validacion temprana evita estados de datos invalidos o inconsistentes
que romperian las reglas de negocio y la experiencia de los usuarios.

### IV. Consistencia de Identidad Visual y UX
Toda interfaz visible al usuario debe respetar el sistema de diseño definido para
Target GYM:
- Paleta de colores: negro profundo `#1A1A1A` (fondos/navbar), blanco humo `#F5F5F5`
  (texto/contraste), rojo energia `#E63946` (exclusivo para botones de accion y
  acentos, ej. "Empeza Hoy", "Contactar").
- Tipografia: Oswald para titulos (impacto, condensada), Nunito Sans para cuerpo de
  texto (legibilidad, tono amigable).
- Estructura de navegacion consistente con el wireframe validado: navbar fija,
  seccion hero con mensaje claro, "Sobre Nosotros", servicios en grilla, footer con
  datos de contacto.

Rationale: el negocio busca reforzar una identidad deportiva fuerte y coherente frente
a una competencia local que carece de presencia web funcional; la inconsistencia
visual diluye la credibilidad ganada con el nuevo sitio.

### V. Alcance Minimo Viable
El desarrollo se limita a los requisitos minimos definidos para el proyecto,
evitando funcionalidad especulativa no solicitada:
- Autenticacion: login y registro para Socios y Administradores.
- Roles: Administrador y Socio como obligatorios; Instructor como perfil adicional.
- CRUD principal: gestion completa de Clases (crear, listar, editar, eliminar).
- Funcionalidad de negocio: inscripcion a clases grupales con control de cupo y
  cancelacion.
- Flujo de estados de inscripcion: Pendiente → Confirmada → En Curso →
  Finalizada / Cancelada.

Cualquier funcionalidad adicional debe justificarse explicitamente contra estos
requisitos antes de incorporarse.

Rationale: mantener el alcance acotado asegura que el proyecto entregue el nucleo de
valor (gestion de membresias, clases e inscripciones) sin sobrecostos de complejidad.

## Modelo de Datos y Flujo de Estados

La relacion central del dominio es Socio → Inscripcion → Clase: un socio puede tener
muchas inscripciones y una clase puede tener muchos socios inscriptos. Toda
Inscripcion transita por los siguientes estados, sin saltos hacia atras:

| Estado | Descripcion |
|---|---|
| Pendiente | El socio solicito el lugar pero aun no se confirmo. |
| Confirmada | El lugar esta reservado; la membresia esta activa y hay cupo disponible. |
| En curso | La clase comenzo; ya no se puede cancelar la inscripcion. |
| Finalizada | La clase termino; se registra en el historial de asistencia del socio. |
| Cancelada | El socio cancelo con anticipacion suficiente, o el administrador cancelo la clase; el cupo se libera. |

Cualquier feature que modifique este modelo (nuevas entidades, nuevos estados) debe
documentar explicitamente el impacto en las reglas de negocio de la Seccion I.

## Flujo de Trabajo de Desarrollo

- Toda especificacion de feature (`/speckit-specify`) debe verificar explicitamente
  que no contradice las reglas de negocio, validaciones y permisos de rol definidos en
  este documento.
- Los cambios que toquen la UI deben respetar la paleta de colores y tipografias
  definidas en el Principio IV; cualquier desvio debe justificarse en el plan de la
  feature.
- Las reglas de negocio (Principio I) y las validaciones (Principio III) deben tener
  cobertura de prueba antes de considerarse completada una tarea que las implemente.

## Governance

Esta constitucion prevalece sobre cualquier otra practica o convencion de desarrollo
del proyecto Target GYM. Las plantillas de `/speckit-plan`, `/speckit-tasks` y
`/speckit-implement` deben verificar cumplimiento con los principios aqui definidos en
tiempo de ejecucion.

- **Enmiendas**: cualquier cambio a este documento requiere describir el cambio, su
  justificacion y su impacto en features existentes antes de aplicarse.
- **Versionado**: se usa versionado semantico (MAJOR.MINOR.PATCH):
  - MAJOR: eliminacion o redefinicion incompatible de principios o reglas de negocio.
  - MINOR: adicion de un principio o expansion material de una guia existente.
  - PATCH: aclaraciones, correcciones de redaccion o ajustes no semanticos.
- **Cumplimiento**: toda revision de plan o pull request debe verificar el
  cumplimiento de los principios; la complejidad adicional no justificada por el
  alcance minimo viable (Principio V) debe ser rechazada o justificada explicitamente.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
