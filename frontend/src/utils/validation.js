export const zona = 'America/Argentina/Buenos_Aires';
export function fechaActual() { return new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(new Date()); }
export function fechaTexto(fecha) {
    return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeZone: zona }).format(new Date(`${fecha}T12:00:00-03:00`));
}
export function fechaHora(fecha) { return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short', timeZone: zona }).format(new Date(fecha)); }
export function dinero(centavos) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(centavos / 100); }
export function semanaDe(fecha) {
    const date = new Date(`${fecha}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, offset) => {
        const dia = new Date(date); dia.setUTCDate(dia.getUTCDate() + offset); return dia.toISOString().slice(0, 10);
    });
}
export function moverSemana(fecha, cantidad) {
    const date = new Date(`${fecha}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 7 * cantidad); return date.toISOString().slice(0, 10);
}
function textoValido(value) { return typeof value === 'string' && value.trim().length > 0; }
function entero(value, max) { return /^\d+$/.test(String(value)) && Number(value) > 0 && Number(value) <= max; }
function fechaValida(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validarClase(datos) {
    const errors = {};
    for (const campo of ['nombre','tipo']) if (!textoValido(datos[campo]) || datos[campo].trim().length > 120) errors[campo] = 'Completá este campo (hasta 120 caracteres).';
    if (!fechaValida(datos.fecha)) errors.fecha = 'Elegí una fecha válida.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.horaInicio ?? '')) errors.horaInicio = 'Elegí una hora válida.';
    if (!errors.fecha && !errors.horaInicio && new Date(`${datos.fecha}T${datos.horaInicio}:00-03:00`) <= new Date()) errors.fecha = 'La clase debe comenzar en el futuro.';
    if (!entero(datos.cupoMaximo, 1000)) errors.cupoMaximo = 'Ingresá un entero entre 1 y 1000.';
    if (!entero(datos.instructorId, 1000000)) errors.instructorId = 'Seleccioná un instructor.';
    if (!entero(datos.duracionMinutos, 480)) errors.duracionMinutos = 'Ingresá de 1 a 480 minutos.';
    return errors;
}
export function passwordValida(value) { return typeof value === 'string' && value.length >= 8 && value.length <= 128 && /[A-Z]/.test(value) && /\d/.test(value); }
export function validarUsuario(datos, { editar = false, instructor = false } = {}) {
    const errors = {};
    for (const campo of ['nombre','apellido']) if (!textoValido(datos[campo]) || datos[campo].trim().length > 120) errors[campo] = 'Completá este campo (hasta 120 caracteres).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email ?? '') || datos.email?.length > 254) errors.email = 'Ingresá un email válido.';
    if (!/^\d{7,9}$/.test(datos.dni ?? '')) errors.dni = 'Ingresá de 7 a 9 dígitos.';
    if (!/^\+?[\d ()-]{7,24}$/.test(datos.telefono ?? '')) errors.telefono = 'Ingresá un teléfono válido.';
    const hoy = fechaActual();
    if (!fechaValida(datos.fechaNacimiento) || datos.fechaNacimiento > `${Number(hoy.slice(0, 4)) - 16}${hoy.slice(4)}`) errors.fechaNacimiento = 'Debés tener al menos 16 años.';
    if ((!editar || datos.password) && !passwordValida(datos.password)) errors.password = 'Usá 8 a 128 caracteres, una mayúscula y un número.';
    if (instructor && !textoValido(datos.especialidad)) errors.especialidad = 'Indicá la especialidad.';
    return errors;
}
export function enfocarError(form, errors) { form.elements.namedItem(Object.keys(errors)[0])?.focus(); }
