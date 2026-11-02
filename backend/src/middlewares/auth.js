import { timingSafeEqual } from 'node:crypto';
import { UnauthorizedError, ForbiddenError } from '../exceptions/AppError.js';

export function iguales(a, b) {
    return typeof a === 'string' && typeof b === 'string' && a.length === b.length && a.length <= 256
        && timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function csrf(req, res, next) {
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
    if (!iguales(req.get('X-CSRF-Token'), req.session?.csrfToken)) return next(new ForbiddenError('La sesion del formulario vencio. Recarga e intenta otra vez.'));
    next();
}

export function requireRoles(repository, ...roles) {
    return async (req, res, next) => {
        try {
            const user = req.session?.userId ? await repository.findById(req.session.userId) : null;
            if (!user || user.estado === 'baja') throw new UnauthorizedError();
            if (roles.length && !roles.includes(user.rol)) throw new ForbiddenError();
            req.user = user;
            next();
        } catch (error) { next(error); }
    };
}
