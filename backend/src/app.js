import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import routes from './routes/index.js';
import SessionStore from './repositories/SessionStore.js';
import AuthService from './services/AuthService.js';
import ClaseService from './services/ClaseService.js';
import MembresiaService from './services/MembresiaService.js';
import InscripcionService from './services/InscripcionService.js';
import EstadoService from './services/EstadoService.js';
import errorHandler from './middlewares/errorHandler.js';
import { csrf, iguales } from './middlewares/auth.js';
import { ForbiddenError, NotFoundError } from './exceptions/AppError.js';
import { responder } from './controllers/ClaseController.js';

export function createApp({ db, clock = () => new Date(), sessionSecret = process.env.SESSION_SECRET, cronSecret = process.env.CRON_SECRET } = {}) {
    if (!db) throw new Error('Se requiere una base de datos.');
    if (typeof sessionSecret !== 'string' || sessionSecret.length < 32) throw new Error('SESSION_SECRET requiere al menos 32 caracteres aleatorios.');
    const app = express();
    app.disable('x-powered-by');
    if (process.env.VERCEL) app.set('trust proxy', 1);
    app.use(helmet());
    app.use(express.json({ limit: '16kb' }));
    app.use('/api', (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
    const estados = new EstadoService(db, clock);
    app.get('/api/health', responder(async () => { await db.query('SELECT 1'); return { estado: 'ok' }; }));
    app.get('/api/maintenance', (req, res, next) => {
        if (!cronSecret || !iguales(req.get('Authorization'), `Bearer ${cronSecret}`)) return next(new ForbiddenError());
        next();
    }, responder(() => estados.mantenimiento()));
    app.use(session({
        name: 'targetgym.sid', secret: sessionSecret, store: new SessionStore(db),
        resave: false, saveUninitialized: false, rolling: true,
        cookie: { httpOnly: true, sameSite: 'lax', secure: Boolean(process.env.VERCEL || process.env.NODE_ENV === 'production'), maxAge: 8 * 3600000, path: '/' },
    }));
    app.use('/api', csrf);
    app.use('/api', routes({
        auth: new AuthService(db, clock), clases: new ClaseService(db, estados),
        membresias: new MembresiaService(db, estados), inscripciones: new InscripcionService(db, estados),
    }));
    app.use((req, res, next) => next(new NotFoundError('El recurso solicitado no existe.')));
    app.use(errorHandler);
    return app;
}
