import Usuario from './Usuario.js';

class Socio extends Usuario {
    constructor(id, nombre, apellido, email, passwordHash, dni, telefono, fechaNacimiento, fechaAlta, estado) {
        super(id, nombre, apellido, email, passwordHash, dni, telefono, fechaNacimiento);
        this.fechaAlta = fechaAlta;
        this.estado = estado;
    }
}

export default Socio;
