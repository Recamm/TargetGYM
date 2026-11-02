import { request } from './api.js';
import { lista, inscripcion, reporte } from './contratos.js';
export const misInscripciones = signal => request('/inscripciones', { signal, validate: lista(inscripcion) });
export const reservarClase = claseId => request('/inscripciones', { method: 'POST', body: { claseId }, validate: inscripcion });
export const cancelarInscripcion = id => request(`/inscripciones/${id}/cancelar`, { method: 'POST', body: {}, validate: inscripcion });
export const miHistorial = signal => request('/mi-historial', { signal, validate: lista(inscripcion) });
export const participantes = (id, signal) => request(`/clases/${id}/participantes`, { signal, validate: lista(inscripcion) });
export const marcarAsistencia = (id, asistio) => request(`/inscripciones/${id}/asistencia`, { method: 'PUT', body: { asistio }, validate: inscripcion });
export const listarReportes = signal => request('/reportes', { signal, validate: lista(reporte) });
