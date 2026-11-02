import { request, sesion } from './api.js';
import { sesionValida, usuario } from './contratos.js';
export const consultarSesion = sesion;
export const iniciarSesion = body => request('/auth/login', { method: 'POST', body, validate: sesionValida });
export const registrarUsuario = body => request('/auth/registro', { method: 'POST', body, validate: sesionValida });
export const cerrarSesion = () => request('/auth/logout', { method: 'POST', body: {}, validate: value => value?.usuario === null && value?.csrfToken === null });
export const actualizarPerfil = body => request('/mi-cuenta', { method: 'PUT', body, validate: usuario });
