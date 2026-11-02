import { Router } from 'express';
import ClaseController from '../controllers/ClaseController.js';
import { requireRoles } from '../middlewares/auth.js';

export default function claseRoutes(service, usuarios) {
    const router = Router();
    const controller = new ClaseController(service);
    const admin = requireRoles(usuarios, 'Administrador');
    router.get('/', async (req, res, next) => {
        try { req.user = req.session.userId ? await usuarios.findById(req.session.userId) : null; next(); }
        catch (error) { next(error); }
    }, controller.getAll);
    router.get('/:id', controller.getById);
    router.post('/', admin, controller.create);
    router.put('/:id', admin, controller.update);
    router.delete('/:id', admin, controller.delete);
    router.post('/:id/cancelar', admin, controller.cancelar);
    return router;
}
