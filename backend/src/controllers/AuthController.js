import { randomBytes } from 'node:crypto';
import { responder } from './ClaseController.js';

const regenerate = (req) => new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
const save = (req) => new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));

export default class AuthController {
    constructor(service) {
        const abrirSesion = async (req, usuario) => {
            await regenerate(req);
            req.session.userId = usuario.id;
            req.session.csrfToken = randomBytes(32).toString('hex');
            await save(req);
            return { usuario, csrfToken: req.session.csrfToken };
        };
        this.sesion = responder(async req => {
            if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex');
            const usuario = req.session.userId ? await service.repository.findById(req.session.userId) : null;
            if (usuario?.estado === 'baja') delete req.session.userId;
            return { usuario: usuario?.estado === 'baja' ? null : usuario, csrfToken: req.session.csrfToken };
        });
        this.login = responder(async req => abrirSesion(req, await service.login(req.body, req.ip)));
        this.registro = responder(async req => {
            await service.limitar(req.ip);
            return abrirSesion(req, await service.registrar(req.body, 'Socio', { asociacion: true }));
        }, 201);
        this.logout = responder(async (req, res) => {
            await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
            res.clearCookie('targetgym.sid', { path: '/', httpOnly: true, sameSite: 'lax', secure: Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production') });
            return { usuario: null, csrfToken: null };
        });
        this.perfil = responder(req => service.actualizar(req.user.id, req.body));
        this.activarAcceso = responder(async req => abrirSesion(req, await service.activarAcceso(req.body, req.ip)));
        this.crearSocio = responder(req => service.crearSocio(req.body), 201);
        this.editarSocio = responder(req => service.actualizar(req.params.id, req.body, true));
        this.crearInstructor = responder(req => service.registrar(req.body, 'Instructor'), 201);
    }
}
