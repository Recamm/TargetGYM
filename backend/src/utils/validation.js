import { BadRequestError } from '../exceptions/AppError.js';

export function exigir(condicion, mensaje) {
    if (!condicion) throw new BadRequestError(mensaje);
}

export function objeto(datos, campos) {
    exigir(datos !== null && typeof datos === 'object' && !Array.isArray(datos), 'Se esperaba un objeto de datos.');
    exigir(Object.keys(datos).every((campo) => campos.includes(campo)), 'El formulario contiene campos no permitidos.');
}

export function texto(valor, nombre, maximo = 120) {
    exigir(typeof valor === 'string' && valor.trim().length > 0 && valor.trim().length <= maximo, `${nombre} es obligatorio (hasta ${maximo} caracteres).`);
    return valor.trim();
}

export function entero(valor, nombre, maximo = 1000000) {
    exigir(Number.isSafeInteger(valor) && valor > 0 && valor <= maximo, `${nombre} debe ser un entero positivo.`);
    return valor;
}

export function id(valor) {
    exigir(/^[1-9]\d*$/.test(String(valor)), 'El identificador debe ser un entero positivo.');
    return entero(Number(valor), 'Identificador', Number.MAX_SAFE_INTEGER);
}

export function fechaValida(valor) {
    if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const date = new Date(`${valor}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valor;
}

export function inicioClase(fecha, horaInicio) {
    exigir(fechaValida(fecha), 'La fecha no es valida.');
    exigir(typeof horaInicio === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(horaInicio), 'La hora no es valida.');
    return new Date(`${fecha}T${horaInicio}:00-03:00`);
}

export const camposClase = ['nombre', 'tipo', 'fecha', 'horaInicio', 'cupoMaximo', 'instructorId', 'duracionMinutos'];

export function validarClase(datos, ahora = new Date()) {
    objeto(datos, camposClase);
    const resultado = {
        nombre: texto(datos.nombre, 'Nombre'),
        tipo: texto(datos.tipo, 'Actividad'),
        fecha: datos.fecha,
        horaInicio: datos.horaInicio,
        cupoMaximo: entero(datos.cupoMaximo, 'Cupo', 1000),
    };
    exigir(inicioClase(resultado.fecha, resultado.horaInicio) > ahora, 'La clase debe comenzar en el futuro.');
    if (datos.instructorId !== undefined) resultado.instructorId = entero(datos.instructorId, 'Instructor');
    if (datos.duracionMinutos !== undefined) resultado.duracionMinutos = entero(datos.duracionMinutos, 'Duracion', 480);
    return resultado;
}

export function sumarMeses(fecha, meses) {
    // Conservar dia y hora del gimnasio (UTC-03), no el dia UTC de una operacion nocturna.
    const resultado = new Date(new Date(fecha).getTime() - 3 * 3600000);
    const dia = resultado.getUTCDate();
    resultado.setUTCDate(1);
    resultado.setUTCMonth(resultado.getUTCMonth() + meses);
    const ultimo = new Date(Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)).getUTCDate();
    resultado.setUTCDate(Math.min(dia, ultimo));
    return new Date(resultado.getTime() + 3 * 3600000);
}
