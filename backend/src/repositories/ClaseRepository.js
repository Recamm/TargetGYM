import { filas, una } from './query.js';
import { inicioClase } from '../utils/validation.js';

const consulta = `SELECT c.id,c.nombre,c.tipo,c.fecha,c.hora_inicio AS "horaInicio",c.inicio,
c.duracion_minutos AS "duracionMinutos",c.cupo_maximo AS "cupoMaximo",c.instructor_id AS "instructorId",c.estado,
u.nombre || ' ' || u.apellido AS instructor,
c.cupo_maximo - (SELECT COUNT(*)::INTEGER FROM inscripciones i WHERE i.clase_id=c.id
AND i.estado IN ('Pendiente','Confirmada','En curso')) AS "cupoDisponible"
FROM clases c JOIN usuarios u ON u.id=c.instructor_id`;

export default class ClaseRepository {
    constructor(db) { this.db = db; }
    findAll(tx = this.db, instructorId = null) {
        return filas(tx, `${consulta} WHERE NOT c.eliminada AND ($1::INTEGER IS NULL OR c.instructor_id=$1) ORDER BY c.inicio,c.id`, [instructorId]);
    }
    findById(id, tx = this.db) { return una(tx, `${consulta} WHERE c.id=$1 AND NOT c.eliminada`, [id]); }
    async create(datos, tx) {
        const clase = await una(tx, `INSERT INTO clases(nombre,tipo,fecha,hora_inicio,inicio,duracion_minutos,cupo_maximo,instructor_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [datos.nombre, datos.tipo, datos.fecha, datos.horaInicio, inicioClase(datos.fecha, datos.horaInicio), datos.duracionMinutos, datos.cupoMaximo, datos.instructorId]);
        return this.findById(clase.id, tx);
    }
    async update(id, datos, tx) {
        await tx.query(`UPDATE clases SET nombre=$2,tipo=$3,fecha=$4,hora_inicio=$5,inicio=$6,duracion_minutos=$7,cupo_maximo=$8,instructor_id=$9 WHERE id=$1`,
            [id, datos.nombre, datos.tipo, datos.fecha, datos.horaInicio, inicioClase(datos.fecha, datos.horaInicio), datos.duracionMinutos, datos.cupoMaximo, datos.instructorId]);
        return this.findById(id, tx);
    }
    async cancelar(id, eliminar, tx) {
        await tx.query(`UPDATE clases SET estado='Cancelada',eliminada=$2 WHERE id=$1`, [id, eliminar]);
        await tx.query(`UPDATE inscripciones SET estado='Cancelada' WHERE clase_id=$1 AND estado IN ('Pendiente','Confirmada','En curso')`, [id]);
    }
}
