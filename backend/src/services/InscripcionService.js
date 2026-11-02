import InscripcionRepository from '../repositories/InscripcionRepository.js';
import MembresiaRepository from '../repositories/MembresiaRepository.js';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import ClaseRepository from '../repositories/ClaseRepository.js';
import { objeto, id, exigir } from '../utils/validation.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../exceptions/AppError.js';

export default class InscripcionService {
    constructor(db, estados) {
        this.repository = new InscripcionRepository(db); this.membresias = new MembresiaRepository(db);
        this.usuarios = new UsuarioRepository(db); this.clases = new ClaseRepository(db); this.estados = estados;
    }
    list(socioId, historial = false) { return this.estados.ejecutar(tx => this.repository.list({ socioId, historial }, tx)); }
    historial(socioId) {
        return this.estados.ejecutar(async tx => {
            const socio = await this.usuarios.findById(id(socioId), tx);
            if (!socio || socio.rol !== 'Socio') throw new NotFoundError('El socio no existe.');
            return this.repository.list({ socioId: socio.id, historial: true }, tx);
        });
    }
    reservar(datos, actor) {
        objeto(datos, ['claseId']);
        const claseId = id(datos.claseId);
        return this.estados.ejecutar(async (tx, ahora) => {
            const clase = await this.clases.findById(claseId, tx);
            if (!clase) throw new NotFoundError('La clase no existe.');
            const socio = await this.usuarios.findById(actor.id, tx);
            const membresia = await this.membresias.actual(actor.id, tx);
            if (socio.estado !== 'activo' || !membresia || new Date(membresia.fechaVencimiento) <= ahora) throw new ConflictError('Necesitas una membresia activa para inscribirte.');
            if (clase.estado !== 'Programada') throw new ConflictError('La clase no esta disponible para inscripcion.');
            if (await this.repository.activa(actor.id, claseId, tx)) throw new ConflictError('Ya estas inscripto a esta clase.');
            if (clase.cupoDisponible <= 0) throw new ConflictError('La clase no tiene cupos disponibles.');
            return this.repository.create(actor.id, claseId, ahora, tx);
        });
    }
    cancelar(idReserva, actor) {
        return this.estados.ejecutar(async (tx, ahora) => {
            const reserva = await this.repository.find(id(idReserva), tx);
            if (!reserva) throw new NotFoundError('La inscripcion no existe.');
            if (reserva.socioId !== actor.id) throw new ForbiddenError();
            if (reserva.estado === 'Cancelada') return reserva;
            if (!['Pendiente','Confirmada'].includes(reserva.estado) || new Date(reserva.inicio).getTime() - ahora.getTime() < 2 * 3600000) throw new ConflictError('Solo puedes cancelar con al menos 2 horas de anticipacion.');
            return this.repository.estado(reserva.id, 'Cancelada', tx);
        });
    }
    async claseAutorizada(idClase, actor, tx) {
        const clase = await this.clases.findById(id(idClase), tx);
        if (!clase) throw new NotFoundError('La clase no existe.');
        if (actor.rol === 'Instructor' && clase.instructorId !== actor.id) throw new ForbiddenError();
        return clase;
    }
    participantes(idClase, actor) {
        return this.estados.ejecutar(async tx => {
            await this.claseAutorizada(idClase, actor, tx);
            return this.repository.list({ claseId: id(idClase) }, tx);
        });
    }
    asistencia(idReserva, datos, actor) {
        objeto(datos, ['asistio']);
        exigir(typeof datos.asistio === 'boolean', 'La asistencia debe ser verdadera o falsa.');
        return this.estados.ejecutar(async tx => {
            const reserva = await this.repository.find(id(idReserva), tx);
            if (!reserva) throw new NotFoundError('La inscripcion no existe.');
            await this.claseAutorizada(reserva.claseId, actor, tx);
            if (!['En curso','Finalizada'].includes(reserva.estado)) throw new ConflictError('La asistencia se registra desde el inicio de la clase.');
            return this.repository.asistencia(reserva.id, datos.asistio, tx);
        });
    }
    reportes() { return this.estados.ejecutar(tx => this.repository.reportes(tx)); }
}
