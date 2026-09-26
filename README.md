# Target GYM — Sistema de Gestión de Gimnasio

Sistema web de gestión para **Target GYM**, un gimnasio de barrio ubicado en Florida, Vicente López (BSAS), que actualmente no tiene presencia web funcional. El proyecto digitaliza la gestión de socios, membresías, clases grupales e inscripciones, siguiendo una metodología de *Spec-Driven Development* con [Speckit](https://speckit.org/).

## Sobre el negocio

- **Nombre**: Target GYM
- **Rubro**: Gimnasio / Fitness
- **Dirección**: Gral. José de San Martín 2462, Florida, Vicente López, BSAS
- **Horarios**: Lunes a viernes 6:00 a 22:00 hs; sábados horario reducido; domingos y feriados variable
- **Público objetivo**: jóvenes y adultos (18-45 años) del barrio, trabajadores de oficina de la zona y vecinos que buscan un gimnasio de cercanía

Más detalle en [info/TP - Fichas Tecnicas (Targer GYM).md](info/TP%20-%20Fichas%20Tecnicas%20(Targer%20GYM).md).

## Funcionalidades principales

- **Registro y gestión de membresías**: alta de socios con plan mensual, trimestral o anual, con cálculo automático de vencimiento.
- **Inscripción a clases grupales**: calendario semanal (spinning, funcional, zumba, etc.) con reserva de cupo con un clic.
- **Gestión de clases y horarios (CRUD)**: el administrador crea, edita, cancela y elimina clases, asignando instructor, horario y cupo máximo.
- **Historial de asistencia**: consulta de clases a las que asistió cada socio.
- **Gestión de pagos de cuota**: registro de pagos y alertas de membresías vencidas o próximas a vencer (7 días antes).
- **Administración de socios**: alta, modificación, suspensión y baja, con historial visible.
- **Panel de disponibilidad público**: cualquier visitante puede ver cupos disponibles sin registrarse.

## Tipos de usuario

| Rol | Permisos principales |
|---|---|
| **Administrador** | Acceso total: gestiona socios, clases, pagos, instructores y reportes de asistencia/ocupación. |
| **Socio / Cliente** | Se registra, contrata/renueva membresía, consulta el calendario, se inscribe o cancela su lugar en clases (regla de 2 hs de anticipación) y ve su historial. |
| **Instructor / Empleado** | Visualiza únicamente sus clases asignadas y confirma asistencia de los socios. No puede modificar socios ni planes. |

## Reglas de negocio clave

- No se permite inscripción a una clase sin cupo disponible.
- Solo socios con membresía **activa** pueden inscribirse a clases.
- No se permite doble inscripción a la misma clase y horario.
- Las cancelaciones requieren **2 horas o más** de anticipación al inicio de la clase.
- El email es único por cuenta.
- El descuento del plan anual aplica únicamente al contratarlo (no retroactivo ni transferible).
- Solo el administrador puede modificar o eliminar clases y usuarios.
- Al vencer la membresía, las inscripciones "Confirmada" pasan a "Pendiente" durante un período de gracia de 3 días; si no se renueva, se cancelan y se libera el cupo.

## Validaciones

- Campos obligatorios: nombre, apellido, email, contraseña, DNI, teléfono y fecha de nacimiento.
- Email con formato `usuario@dominio.com`, único en el sistema.
- Edad mínima de 16 años para registro autónomo.
- Contraseña de al menos 8 caracteres, con una mayúscula y un número.
- Cupo máximo de clase mayor a cero.
- Fecha/hora de clase no puede estar en el pasado.

## Modelo de dominio

Entidades principales (ver [info/diagrama-clases.md](info/diagrama-clases.md)):

- **Usuario** (base abstracta) → especializada en **Administrador**, **Socio** e **Instructor**
- **Membresía**: plan contratado por un socio (mensual, trimestral, anual)
- **Pago**: registro de pago de una cuota/membresía
- **Clase**: actividad grupal con horario, cupo e instructor asignado
- **Inscripción**: vínculo entre un Socio y una Clase, con flujo de estados `Pendiente → Confirmada → En curso → Finalizada / Cancelada`

## Identidad visual (UX/UI)

| Rol | Color | Hex | Uso |
|---|---|---|---|
| Principal | Negro profundo | `#1A1A1A` | Fondos, navbar, secciones |
| Secundario | Blanco humo | `#F5F5F5` | Textos, contraste |
| Acento | Rojo energía | `#E63946` | Botones y llamados a la acción |

**Tipografías**: [Oswald](https://fonts.google.com/specimen/Oswald) para títulos (condensada, impactante) y [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans) para cuerpo de texto (legible, amigable).

Detalle completo en [info/Entregar - Target GYM (UX-UI).md](info/Entregar%20-%20Target%20GYM%20(UX-UI).md).

## Estructura del proyecto

```
TargetGYM/
├── backend/
│   └── src/
│       └── models/       # Clases de dominio (sin lógica de negocio)
├── specs/
│   └── 001-sistema-gestion-gimnasio/
│       ├── spec.md       # Especificación funcional (Speckit)
│       └── checklists/
├── info/                 # Fichas técnicas, reglas de negocio y diseño UX/UI
└── how-to-use-speckit.md # Guía de uso de Speckit en este proyecto
```

## Desarrollo con Speckit

Este proyecto usa [Speckit](https://speckit.org/) para *Spec-Driven Development*. Ver [how-to-use-speckit.md](how-to-use-speckit.md) para instalación y flujo de trabajo (`/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, `/speckit.implement`).

## Requisitos mínimos del proyecto (consigna académica)

| Requisito | Implementación en Target GYM |
|---|---|
| Autenticación | Login y registro para Socios y Administradores |
| Dos tipos de usuario | Administrador y Socio (más Instructor como plus) |
| CRUD principal | CRUD completo de Clases |
| Funcionalidad propia del negocio | Inscripción a clases grupales con control de cupo y cancelación |
| Flujo de estados | Pendiente → Confirmada → En Curso → Finalizada / Cancelada |
| Validaciones de negocio | Membresía activa, cupo disponible, email único, no doble inscripción |
| Relación entre entidades | Socio → Inscripción → Clase |
