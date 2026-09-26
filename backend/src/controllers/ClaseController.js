import claseService from '../services/ClaseService.js';
import { sendSuccess } from '../responses/ApiResponse.js';

// Traduce peticiones HTTP hacia el servicio de Clases
class ClaseController {
    getAll(req, res, next) {
        try {
            const clases = claseService.getAll();
            sendSuccess(res, clases);
        } catch (error) {
            next(error);
        }
    }

    getById(req, res, next) {
        try {
            const clase = claseService.getById(Number(req.params.id));
            sendSuccess(res, clase);
        } catch (error) {
            next(error);
        }
    }

    create(req, res, next) {
        try {
            const clase = claseService.create(req.body);
            sendSuccess(res, clase, 201);
        } catch (error) {
            next(error);
        }
    }

    update(req, res, next) {
        try {
            const clase = claseService.update(Number(req.params.id), req.body);
            sendSuccess(res, clase);
        } catch (error) {
            next(error);
        }
    }

    delete(req, res, next) {
        try {
            claseService.delete(Number(req.params.id));
            sendSuccess(res, null);
        } catch (error) {
            next(error);
        }
    }
}

export default new ClaseController();
