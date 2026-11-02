import ClaseRepository from '../repositories/ClaseRepository.js';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import { validarClase, camposClase, objeto, id, exigir, inicioClase } from '../utils/validation.js';
import { ConflictError, NotFoundError } from '../exceptions/AppError.js';
import { una } from '../repositories/query.js';

export default class ClaseService {
    constructor(db, estados) { this.repository = new ClaseRepository(db); this.usuarios = new UsuarioRepository(db); this.estados = estados; }
    getAll(actor) { return this.estados.ejecutar((tx) => this.repository.findAll(tx, actor?.rol === 'Instructor' ? actor.id : null)); }
    async encontrar(idClase, tx) {
        const clase = await this.repository.findById(id(idClase), tx);
        if (!clase) throw new NotFoundError('La clase no existe.');
        return clase;
    }
    getById(idClase) { return this.estados.ejecutar((tx) => this.encontrar(idClase, tx)); }
    async validar(datos, tx, ahora, actual = null) {
        const valido = validarClase(datos, ahora);
        exigir(valido.instructorId !== undefined && valido.duracionMinutos !== undefined, 'Instructor y duracion son obligatorios.');
        const instructor = await this.usuarios.findById(valido.instructorId, tx);
        exigir(instructor?.rol === 'Instructor' && instructor.estado === 'activo', 'El instructor no esta disponible.');
        const inicio = inicioClase(valido.fecha, valido.horaInicio);
        const fin = new Date(inicio.getTime() + valido.duracionMinutos * 60000);
        const superpuesta = await una(tx, `SELECT id FROM clases WHERE instructor_id=$1 AND estado <> 'Cancelada'
        AND NOT eliminada AND inicio<$2 AND inicio + duracion_minutos * INTERVAL '1 minute' > $3
        AND ($4::INTEGER IS NULL OR id<>$4)`, [valido.instructorId, fin, inicio, actual?.id ?? null]);
        if (superpuesta) throw new ConflictError('El instructor ya tiene otra clase en ese horario.');
        if (actual && valido.cupoMaximo < actual.cupoMaximo - actual.cupoDisponible) throw new ConflictError('El cupo no puede ser menor que las reservas existentes.');
        return valido;
    }
    create(datos) { return this.estados.ejecutar(async (tx, ahora) => this.repository.create(await this.validar(datos, tx, ahora), tx)); }
    update(idClase, cambios) {
        return this.estados.ejecutar(async (tx, ahora) => {
            const clase = await this.encontrar(idClase, tx);
            if (clase.estado !== 'Programada') throw new ConflictError('Solo se pueden editar clases programadas.');
            objeto(cambios, camposClase);
            exigir(Object.keys(cambios).length > 0, 'No hay cambios para guardar.');
            const actuales = Object.fromEntries(camposClase.map(campo => [campo, clase[campo]]));
            return this.repository.update(clase.id, await this.validar({ ...actuales, ...cambios }, tx, ahora, clase), tx);
        });
    }
    cancelar(idClase, eliminar = false) {
        return this.estados.ejecutar(async (tx) => {
            const clase = await this.encontrar(idClase, tx);
            if (!eliminar && clase.estado === 'Finalizada') throw new ConflictError('Una clase finalizada no puede cancelarse.');
            await this.repository.cancelar(clase.id, eliminar, tx);
            return eliminar ? null : this.repository.findById(clase.id, tx);
        });
    }
}
