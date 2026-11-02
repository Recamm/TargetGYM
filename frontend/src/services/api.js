import { sesionValida } from './contratos.js';
let csrfToken = null;
let bootstrap = null;
let expiredHandler = null;

export class ApiError extends Error {
    constructor(status, message) { super(message); this.name = 'ApiError'; this.status = status; }
}
export function resetSession() { csrfToken = null; bootstrap = null; }
export function onSessionExpired(handler) { expiredHandler = handler; }

export async function request(path, { method = 'GET', body, signal, validate } = {}) {
    if (!['GET','HEAD'].includes(method) && !csrfToken) await sesion();
    const token = csrfToken;
    let response;
    try {
        response = await fetch(`/api${path}`, {
            method, signal, credentials: 'same-origin',
            headers: { Accept: 'application/json', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(token ? { 'X-CSRF-Token': token } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa la conexion e intenta otra vez.');
    }
    let envelope;
    try { envelope = JSON.parse(await response.text()); }
    catch { throw new ApiError(response.status, `El servidor respondio HTTP ${response.status} sin JSON valido.`); }
    if (!response.ok || envelope?.success === false) {
        if (response.status === 401 && !path.startsWith('/auth/') && token === csrfToken) { resetSession(); expiredHandler?.(); }
        throw new ApiError(response.status, typeof envelope?.message === 'string' ? envelope.message : `La operacion fallo (HTTP ${response.status}).`);
    }
    if (!envelope || envelope.success !== true || !Object.hasOwn(envelope, 'data')) throw new ApiError(response.status, 'La respuesta del servidor no tiene el formato esperado.');
    if (validate && !validate(envelope.data)) throw new ApiError(response.status, 'El servidor respondio con datos invalidos. Reintenta o contacta al administrador.');
    if (path.startsWith('/auth/') && envelope.data && Object.hasOwn(envelope.data, 'csrfToken') && (path !== '/auth/sesion' || token === csrfToken)) csrfToken = envelope.data.csrfToken;
    return envelope.data;
}

export function sesion() {
    if (!bootstrap) bootstrap = request('/auth/sesion', { validate: sesionValida }).finally(() => { bootstrap = null; });
    return bootstrap;
}
