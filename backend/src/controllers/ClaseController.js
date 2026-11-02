import { sendSuccess } from '../responses/ApiResponse.js';

export function responder(operation, status = 200) {
    return async (req, res, next) => {
        try { sendSuccess(res, await operation(req, res), status); }
        catch (error) { next(error); }
    };
}

export default class ClaseController {
    constructor(service) {
        this.getAll = responder(req => service.getAll(req.user));
        this.getById = responder(req => service.getById(req.params.id));
        this.create = responder(req => service.create(req.body), 201);
        this.update = responder(req => service.update(req.params.id, req.body));
        this.delete = responder(req => service.cancelar(req.params.id, true));
        this.cancelar = responder(req => service.cancelar(req.params.id));
    }
}
