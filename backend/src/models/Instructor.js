import Usuario from './Usuario.js';

class Instructor extends Usuario {
    constructor(id, nombre, apellido, email, passwordHash, dni, telefono, fechaNacimiento, especialidad) {
        super(id, nombre, apellido, email, passwordHash, dni, telefono, fechaNacimiento);
        this.especialidad = especialidad;
    }
}

export default Instructor;
