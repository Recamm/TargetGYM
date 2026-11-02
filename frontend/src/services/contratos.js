const objeto = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const texto = value => typeof value === 'string';
const positivo = value => Number.isSafeInteger(value) && value > 0;
const cantidad = value => Number.isSafeInteger(value) && value >= 0;
const fecha = value => texto(value) && Number.isFinite(Date.parse(value));
const dia = value => texto(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && fecha(`${value}T12:00:00Z`);
const plan = value => ['mensual','trimestral','anual'].includes(value);
const nullable = (value, validar) => value === null || validar(value);
export const lista = validar => value => Array.isArray(value) && value.every(validar);
export const usuario = value => objeto(value) && positivo(value.id) && texto(value.nombre) && texto(value.apellido) && texto(value.email)
    && ['Socio','Instructor','Administrador'].includes(value.rol) && ['activo','suspendido','baja'].includes(value.estado)
    && nullable(value.dni, texto) && nullable(value.telefono, texto) && nullable(value.fechaNacimiento, dia) && nullable(value.tipoPlan, plan);
export const sesionValida = value => objeto(value) && nullable(value.usuario, usuario) && texto(value.csrfToken) && value.csrfToken.length > 0;
export const clase = value => objeto(value) && positivo(value.id) && texto(value.nombre) && texto(value.tipo) && dia(value.fecha)
    && texto(value.horaInicio) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.horaInicio) && fecha(value.inicio) && positivo(value.duracionMinutos)
    && positivo(value.instructorId) && texto(value.instructor) && positivo(value.cupoMaximo) && cantidad(value.cupoDisponible) && value.cupoDisponible <= value.cupoMaximo
    && ['Programada','En curso','Finalizada','Cancelada'].includes(value.estado);
export const membresia = value => objeto(value) && positivo(value.id) && positivo(value.socioId) && plan(value.tipoPlan)
    && fecha(value.fechaInicio) && fecha(value.fechaVencimiento) && ['activa','vencida','reemplazada'].includes(value.estado);
export const membresiaNullable = value => nullable(value, membresia);
export const precio = value => objeto(value) && plan(value.tipo) && positivo(value.meses) && nullable(value.precioCentavos, positivo)
    && cantidad(value.descuentoPorcentaje) && value.descuentoPorcentaje <= 99;
export const pago = value => objeto(value) && positivo(value.id) && positivo(value.socioId) && plan(value.tipoPlan)
    && positivo(value.montoCentavos) && texto(value.metodoPago) && fecha(value.fecha);
export const pagoRegistrado = value => objeto(value) && positivo(value.id) && positivo(value.montoCentavos);
export const socio = value => usuario(value) && value.rol === 'Socio' && membresiaNullable(value.membresia) && typeof value.proximaAVencer === 'boolean';
export const detalleSocio = value => usuario(value) && value.rol === 'Socio' && lista(membresia)(value.membresias) && lista(pago)(value.pagos);
export const instructor = value => usuario(value) && value.rol === 'Instructor' && texto(value.especialidad);
export const inscripcion = value => objeto(value) && positivo(value.id) && positivo(value.socioId) && positivo(value.claseId)
    && texto(value.nombre) && texto(value.tipo) && texto(value.socio) && dia(value.fecha) && texto(value.horaInicio) && fecha(value.inicio)
    && ['Pendiente','Confirmada','En curso','Finalizada','Cancelada'].includes(value.estado) && nullable(value.asistio, item => typeof item === 'boolean');
export const reporte = value => objeto(value) && positivo(value.id) && texto(value.nombre) && dia(value.fecha)
    && positivo(value.cupoMaximo) && cantidad(value.inscripciones) && cantidad(value.asistencias);
export const solicitud = value => objeto(value) && plan(value.tipoPlan) && value.pendienteDePago === true && fecha(value.solicitadoEn);
