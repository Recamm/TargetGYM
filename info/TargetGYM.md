FUNCIONALIDADES PRINCIPALES

•  Registrar y gestionar membresias: El socio puede darse de alta eligiendo un plan (mensual,

trimestral, anual) y el sistema lleva el estado y vencimiento de cada membresia.

•

Inscribirse a clases grupales: El socio puede ver el calendario semanal de clases (spinning,
funcional, zumba, etc.) y reservar su lugar con un clic.

•  Gestionar clases y horarios (CRUD): El administrador puede crear, editar, cancelar y eliminar

clases, asignando instructor, horario y cupo maximo.

•  Consultar historial de asistencia: Tanto el socio como el administrador pueden ver el historial

de clases a las que asistio cada miembro.

•  Gestion de pagos de cuota: El administrador registra los pagos de cuotas y el sistema muestra

alertas de membresias vencidas o proximas a vencer.

•  Administrar socios: El administrador puede dar de alta, modificar, suspender o dar de baja

socios, y ver su informacion completa.

•  Panel de disponibilidad en tiempo real: Cualquier visitante puede ver que clases tienen lugares

disponibles antes de registrarse.

REGLAS DE NEGOCIO

•  No permitir inscripcion a una clase sin cupo disponible: Si la clase llego al limite de

participantes, no se puede reservar lugar.

•  Solo socios con membresia activa pueden inscribirse a clases: Un socio con cuota vencida o

membresia cancelada queda bloqueado.

•  No permitir doble inscripcion: Un socio no puede inscribirse dos veces a la misma clase en el

mismo horario.

•  No cancelar una inscripcion con menos de 2 horas de anticipacion: Si la clase ya esta por

comenzar, la cancelacion no esta disponible.

•  No aceptar usuarios con un email ya registrado: El email es unico por cuenta en el sistema.

•  Los descuentos por plan anual se aplican unicamente al contratar ese plan: No es retroactivo

ni transferible a otros planes.

•  Solo el administrador puede modificar o eliminar clases y usuarios: Los socios solo pueden

ver y gestionar sus propias inscripciones.

VALIDACIONES

•  Campos obligatorios: Nombre, apellido, email, contraseña, DNI y telefono son requeridos en el

registro.

•  Formato valido de email: El sistema valida el formato usuario@dominio.com antes de aceptar el

registro o actualizacion.

•  Fecha de nacimiento valida: El socio debe ser mayor de 16 años para registrarse de forma

autonoma.

•  Contraseña segura: Minimo 8 caracteres, al menos una mayuscula y un numero.

•  Cupo mayor que cero al crear una clase: No se puede crear una clase con cupo 0 o negativo.

•  Fecha y hora validas: Al crear o editar una clase, la fecha/hora no puede ser en el pasado.

TIPOS DE USUARIOS

Administrador

Acceso total al sistema.

-  Gestiona socios (alta, baja, modificacion, suspension).
-  Crea, edita y elimina clases y horarios.
-  Registra pagos y consulta el estado de membresias.
-  Ve reportes de asistencia y ocupacion por clase.
-  Asigna instructores a clases.

Socio / Cliente

Usuario registrado con membresia.

-  Se registra y gestiona su perfil y contraseña.
-  Contrata o renueva su plan de membresia.
-  Consulta el calendario semanal de clases.
-  Se inscribe o cancela su lugar en una clase (respetando la regla de las 2 horas).
-  Consulta su historial de asistencia.

Instructor / Empleado

Perfil intermedio para profes del gimnasio.

-  Visualiza las clases que tiene asignadas.
-  Confirma la asistencia de los socios al inicio de cada clase.
-  No puede modificar datos de socios ni planes.

ESTADOS DEL SISTEMA

Entidad: Inscripcion a clase

Estado

Descripcion

Pendiente

El socio solicito el lugar pero aun no se confirmo (por ejemplo, si requiere pago
previo).

Confirmada

El lugar esta reservado. La membresia esta activa y hay cupo disponible.

En curso

La clase comenzo. Ya no se puede cancelar la inscripcion.

Finalizada

La clase termino. Se registra en el historial de asistencia del socio.

Cancelada

El socio cancelo con anticipacion suficiente, o el administrador cancelo la clase.
El cupo se libera.

REQUISITOS MINIMOS DEL PROYECTO

Requisito

Autenticacion

Implementacion de Target GYM

Login y Registro para Socios y Administradores.

Dos tipos de usuarios

Administrador y Socio (mas el perfil Instructor como plus).

CRUD principal

CRUD completo sobre Clases: crear, ver listado, editar y eliminar
clases.

Funcionalidad propia del negocio

Inscripcion a clases grupales con control de cupo y cancelacion.

Flujo de estados

Pendiente → Confirmada → En Curso → Finalizada / Cancelada
sobre la inscripcion.

Validaciones de negocio

Membresia activa, cupo disponible, email unico, no doble
inscripcion, etc.

Relacion entre entidades

Socio → Inscripcion → Clase (un socio puede tener muchas
inscripciones; una clase tiene muchos socios inscriptos).

