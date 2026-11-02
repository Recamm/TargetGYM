import { request } from './api.js';
import { lista, usuario, socio, detalleSocio, instructor, inscripcion } from './contratos.js';
export const listarSocios = signal => request('/socios', { signal, validate: lista(socio) });
export const obtenerSocio = (id, signal) => request(`/socios/${id}`, { signal, validate: detalleSocio });
export const crearSocio = body => request('/socios', { method: 'POST', body, validate: usuario });
export const actualizarSocio = (id, body) => request(`/socios/${id}`, { method: 'PUT', body, validate: usuario });
export const historialSocio = (id, signal) => request(`/socios/${id}/historial`, { signal, validate: lista(inscripcion) });
export const listarInstructores = signal => request('/instructores', { signal, validate: lista(instructor) });
export const crearInstructor = body => request('/instructores', { method: 'POST', body, validate: instructor });
