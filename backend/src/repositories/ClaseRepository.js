import Clase from '../models/Clase.js';

// Persistencia en memoria de Clases (arrays)
class ClaseRepository {
    #clases = [];
    #nextId = 1;

    findAll() {
        return this.#clases;
    }

    findById(id) {
        return this.#clases.find((clase) => clase.id === id);
    }

    create({ nombre, tipo, fecha, horaInicio, cupoMaximo }) {
        const clase = new Clase(this.#nextId++, nombre, tipo, fecha, horaInicio, cupoMaximo, cupoMaximo);
        this.#clases.push(clase);
        return clase;
    }

    update(id, cambios) {
        const clase = this.findById(id);
        if (!clase) return null;
        Object.assign(clase, cambios);
        return clase;
    }

    delete(id) {
        const index = this.#clases.findIndex((clase) => clase.id === id);
        if (index === -1) return false;
        this.#clases.splice(index, 1);
        return true;
    }
}

export default new ClaseRepository();
