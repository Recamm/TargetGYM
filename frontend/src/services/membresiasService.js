import { request } from './api.js';
import { lista, precio, membresiaNullable, solicitud, pago, pagoRegistrado } from './contratos.js';
export const listarPlanes = signal => request('/planes', { signal, validate: lista(precio) });
export const configurarPlan = (tipo, body) => request(`/planes/${tipo}`, { method: 'PUT', body, validate: precio });
export const miMembresia = signal => request('/mi-membresia', { signal, validate: membresiaNullable });
export const solicitarPlan = body => request('/mi-membresia/solicitud', { method: 'POST', body, validate: solicitud });
export const misPagos = signal => request('/mis-pagos', { signal, validate: lista(pago) });
export const listarPagos = signal => request('/pagos', { signal, validate: lista(pago) });
export const registrarPago = body => request('/pagos', { method: 'POST', body, validate: pagoRegistrado });
