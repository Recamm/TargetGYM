import Usuario from './Usuario.js';

class Administrador extends Usuario {
    constructor(id, nombre, apellido, email, passwordHash, dni, telefono, fechaNacimiento) {
        super(id, nombre, apellido, email, passwordHash, dni, telefono, fechaNacimiento);
    }
}

export default Administrador;
