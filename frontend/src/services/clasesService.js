import { request } from './api.js';
import { clase, lista } from './contratos.js';
export const listarClases = signal => request('/clases', { signal, validate: lista(clase) });
export const obtenerClase = (id, signal) => request(`/clases/${id}`, { signal, validate: clase });
export const crearClase = body => request('/clases', { method: 'POST', body, validate: clase });
export const actualizarClase = (id, body) => request(`/clases/${id}`, { method: 'PUT', body, validate: clase });
export const eliminarClase = id => request(`/clases/${id}`, { method: 'DELETE', validate: value => value === null });
export const cancelarClase = id => request(`/clases/${id}/cancelar`, { method: 'POST', body: {}, validate: clase });
