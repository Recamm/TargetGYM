const objeto = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const texto = value => typeof value === 'string';
const positivo = value => Number.isSafeInteger(value) && value > 0;
const cantidad = value => Number.isSafeInteger(value) && value >= 0;
const fecha = value => texto(value) && Number.isFinite(Date.parse(value));
const dia = value => texto(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && fecha(`${value}T12:00:00Z`);
const plan = value => texto(value) && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value);
const nullable = (value, validar) => value === null || validar(value);
export const lista = validar => value => Array.isArray(value) && value.every(validar);
export const usuario = value => objeto(value) && positivo(value.id) && texto(value.nombre) && texto(value.apellido) && texto(value.email)
    && ['Socio','Instructor','Administrador'].includes(value.rol) && ['activo','suspendido','baja'].includes(value.estado)
    && nullable(value.dni, texto) && nullable(value.telefono, texto) && nullable(value.fechaNacimiento, dia) && nullable(value.tipoPlan, plan)
    && nullable(value.nombrePlanSolicitado, texto) && typeof value.accesoPendiente === 'boolean'
    && nullable(value.metodoPagoSolicitado, item => ['Efectivo','Transferencia','Tarjeta'].includes(item))
    && nullable(value.solicitadoEn, fecha) && nullable(value.pagoReportadoEn, fecha);
export const sesionValida = value => objeto(value) && nullable(value.usuario, usuario) && texto(value.csrfToken) && value.csrfToken.length > 0;
export const clase = value => objeto(value) && positivo(value.id) && texto(value.nombre) && texto(value.tipo) && dia(value.fecha)
    && texto(value.horaInicio) && /^([01]\d|2[0-3]):[0-5]\d$/.test(value.horaInicio) && fecha(value.inicio) && positivo(value.duracionMinutos)
    && positivo(value.instructorId) && texto(value.instructor) && positivo(value.cupoMaximo) && cantidad(value.cupoDisponible) && value.cupoDisponible <= value.cupoMaximo
    && ['Programada','En curso','Finalizada','Cancelada'].includes(value.estado);
export const membresia = value => objeto(value) && positivo(value.id) && positivo(value.socioId) && plan(value.tipoPlan) && texto(value.nombrePlan)
    && fecha(value.fechaInicio) && fecha(value.fechaVencimiento) && ['activa','vencida','reemplazada'].includes(value.estado)
    && typeof value.anulada === 'boolean' && fecha(value.fechaInicioOriginal) && fecha(value.fechaVencimientoOriginal);
export const membresiaNullable = value => nullable(value, membresia);
export const precio = value => objeto(value) && plan(value.tipo) && texto(value.nombre) && value.nombre.trim().length > 0 && value.nombre.length <= 120
    && ((positivo(value.meses) && value.meses <= 120 && value.dias === null) || (value.meses === null && positivo(value.dias) && value.dias <= 3660))
    && nullable(value.precioCentavos, item => positivo(item) && item <= 100000000)
    && nullable(value.precioDescuentoCentavos, item => positivo(item) && value.precioCentavos !== null && item < value.precioCentavos && value.descuentoPorcentaje === 0)
    && texto(value.descripcion) && value.descripcion.length <= 500 && texto(value.requisitosAcceso) && value.requisitosAcceso.length <= 500
    && nullable(value.metodoExclusivo, item => ['Efectivo','Transferencia','Tarjeta'].includes(item)) && typeof value.permiteTarjeta === 'boolean'
    && cantidad(value.descuentoPorcentaje) && value.descuentoPorcentaje <= 99 && typeof value.habilitado === 'boolean'
    && texto(value.condicionesDescuento) && value.condicionesDescuento.length <= 500 && nullable(value.metodoDescuento, item => ['Efectivo','Transferencia','Tarjeta'].includes(item));
export const planEliminado = value => objeto(value) && value.eliminado === true;
export const metodoPago = value => objeto(value) && ['Efectivo','Transferencia','Tarjeta'].includes(value.codigo)
    && typeof value.habilitado === 'boolean' && typeof value.permiteSocio === 'boolean';
export const pago = value => objeto(value) && positivo(value.id) && positivo(value.socioId) && plan(value.tipoPlan)
    && texto(value.nombrePlan) && positivo(value.montoCentavos) && positivo(value.precioBaseCentavos)
    && cantidad(value.descuentoPorcentaje) && value.descuentoPorcentaje <= 99 && texto(value.condicionesDescuento) && texto(value.metodoPago) && fecha(value.fecha)
    && nullable(value.anuladoEn, fecha) && nullable(value.anuladoPor, texto) && texto(value.motivoAnulacion) && value.motivoAnulacion.length <= 500
    && ((value.anuladoEn === null) === (value.anuladoPor === null))
    && cantidad(value.descuentoCentavos) && value.descuentoCentavos === value.precioBaseCentavos - value.montoCentavos
    && texto(value.requisitosAcceso) && typeof value.confirmacionRequisitos === 'boolean';
export const pagoAnulado = value => objeto(value) && value.anulado === true;
export const pagoRegistrado = value => objeto(value) && positivo(value.id) && positivo(value.montoCentavos);
export const socio = value => usuario(value) && value.rol === 'Socio' && membresiaNullable(value.membresia) && typeof value.proximaAVencer === 'boolean';
const cambioPlan = value => objeto(value) && positivo(value.id) && fecha(value.fecha) && texto(value.administrador) && texto(value.planAnterior) && texto(value.planNuevo) && texto(value.requisitosVerificados);
export const detalleSocio = value => usuario(value) && value.rol === 'Socio' && lista(membresia)(value.membresias) && lista(pago)(value.pagos) && lista(cambioPlan)(value.cambiosPlan);
export const instructor = value => usuario(value) && value.rol === 'Instructor' && texto(value.especialidad);
export const inscripcion = value => objeto(value) && positivo(value.id) && positivo(value.socioId) && positivo(value.claseId)
    && texto(value.nombre) && texto(value.tipo) && texto(value.socio) && dia(value.fecha) && texto(value.horaInicio) && fecha(value.inicio)
    && ['Pendiente','Confirmada','En curso','Finalizada','Cancelada'].includes(value.estado) && nullable(value.asistio, item => typeof item === 'boolean');
export const reporte = value => objeto(value) && positivo(value.id) && texto(value.nombre) && dia(value.fecha)
    && positivo(value.cupoMaximo) && cantidad(value.inscripciones) && cantidad(value.asistencias);
export const solicitud = value => objeto(value) && plan(value.tipoPlan) && value.pendienteDePago === true && fecha(value.solicitadoEn);
export const invitacion = value => objeto(value) && texto(value.token) && /^[a-f0-9]{64}$/.test(value.token) && fecha(value.expira);
