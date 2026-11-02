import { filas, una } from './query.js';

const consulta = `SELECT i.id,i.socio_id AS "socioId",i.clase_id AS "claseId",i.estado,i.asistio,
i.fecha_inscripcion AS "fechaInscripcion",c.nombre,c.tipo,c.fecha,c.hora_inicio AS "horaInicio",
c.inicio,c.duracion_minutos AS "duracionMinutos",c.instructor_id AS "instructorId",
u.nombre || ' ' || u.apellido AS socio FROM inscripciones i
JOIN clases c ON c.id=i.clase_id JOIN usuarios u ON u.id=i.socio_id`;
export default class InscripcionRepository {
    constructor(db) { this.db = db; }
    find(id, tx = this.db) { return una(tx, `${consulta} WHERE i.id=$1`, [id]); }
    list({ socioId = null, claseId = null, historial = false } = {}, tx = this.db) {
        return filas(tx, `${consulta} WHERE ($1::INTEGER IS NULL OR i.socio_id=$1)
        AND ($2::INTEGER IS NULL OR i.clase_id=$2) AND (NOT $3::BOOLEAN OR (i.estado='Finalizada' AND i.asistio=TRUE))
        ORDER BY c.inicio DESC,i.id DESC`, [socioId, claseId, historial]);
    }
    activa(socioId, claseId, tx) { return una(tx, `SELECT id FROM inscripciones WHERE socio_id=$1 AND clase_id=$2 AND estado IN ('Pendiente','Confirmada','En curso')`, [socioId, claseId]); }
    async create(socioId, claseId, ahora, tx) {
        const row = await una(tx, `INSERT INTO inscripciones(socio_id,clase_id,estado,fecha_inscripcion) VALUES($1,$2,'Confirmada',$3) RETURNING id`, [socioId, claseId, ahora]);
        return this.find(row.id, tx);
    }
    async estado(id, estado, tx) { await tx.query('UPDATE inscripciones SET estado=$2 WHERE id=$1', [id, estado]); return this.find(id, tx); }
    async asistencia(id, asistio, tx) { await tx.query('UPDATE inscripciones SET asistio=$2 WHERE id=$1', [id, asistio]); return this.find(id, tx); }
    reportes(tx = this.db) {
        return filas(tx, `SELECT c.id,c.nombre,c.fecha,c.cupo_maximo AS "cupoMaximo",
        COUNT(i.id) FILTER (WHERE i.estado <> 'Cancelada')::INTEGER AS inscripciones,
        COUNT(i.id) FILTER (WHERE i.estado='Finalizada' AND i.asistio=TRUE)::INTEGER AS asistencias
        FROM clases c LEFT JOIN inscripciones i ON i.clase_id=c.id GROUP BY c.id ORDER BY c.inicio DESC`);
    }
}
