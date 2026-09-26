import claseRepository from '../repositories/ClaseRepository.js';
import { BadRequestError, NotFoundError } from '../exceptions/AppError.js';
import { Messages } from '../enums/Messages.js';

// Reglas de negocio del CRUD de Clases
class ClaseService {
    getAll() {
        return claseRepository.findAll();
    }

    getById(id) {
        const clase = claseRepository.findById(id);
        if (!clase) {
            throw new NotFoundError(Messages.CLASE_NOT_FOUND);
        }
        return clase;
    }

    create(datos) {
        const { nombre, tipo, fecha, horaInicio, cupoMaximo } = datos;
        if (!nombre || !tipo || !fecha || !horaInicio || !cupoMaximo) {
            throw new BadRequestError(Messages.INVALID_DATA);
        }
        if (cupoMaximo <= 0) {
            throw new BadRequestError(Messages.INVALID_CUPO);
        }
        return claseRepository.create({ nombre, tipo, fecha, horaInicio, cupoMaximo });
    }

    update(id, cambios) {
        this.getById(id);
        if (cambios.cupoMaximo !== undefined && cambios.cupoMaximo <= 0) {
            throw new BadRequestError(Messages.INVALID_CUPO);
        }
        return claseRepository.update(id, cambios);
    }

    delete(id) {
        this.getById(id);
        claseRepository.delete(id);
    }
}

export default new ClaseService();
