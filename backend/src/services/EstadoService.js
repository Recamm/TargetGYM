import { filas } from '../repositories/query.js';

export default class EstadoService {
    constructor(db, clock = () => new Date()) { this.db = db; this.clock = clock; }
    ejecutar(work) {
        return this.db.transaction(async (tx) => {
            const ahora = this.clock();
            await this.conciliar(tx, ahora);
            return work(tx, ahora);
        });
    }
    async conciliar(tx, ahora) {
        await tx.query(`UPDATE membresias SET estado='vencida' WHERE estado='activa' AND fecha_vencimiento <= $1`, [ahora]);
        const reservas = await filas(tx, `SELECT i.id,i.estado,c.inicio,c.duracion_minutos,c.estado AS clase_estado,
        u.estado AS socio_estado,m.fecha_inicio,m.fecha_vencimiento FROM inscripciones i JOIN clases c ON c.id=i.clase_id
        JOIN usuarios u ON u.id=i.socio_id LEFT JOIN LATERAL
        (SELECT fecha_inicio,fecha_vencimiento FROM membresias WHERE socio_id=i.socio_id AND NOT anulada ORDER BY id DESC LIMIT 1) m ON TRUE
        WHERE i.estado IN ('Pendiente','Confirmada','En curso')`);
        for (const reserva of reservas) {
            const inicio = new Date(reserva.inicio);
            const fin = new Date(inicio.getTime() + reserva.duracion_minutos * 60000);
            const vence = reserva.fecha_vencimiento ? new Date(reserva.fecha_vencimiento) : null;
            let estado = reserva.estado;
            if (reserva.clase_estado === 'Cancelada') estado = 'Cancelada';
            else if (estado === 'En curso') { if (ahora >= fin) estado = 'Finalizada'; }
            else if (ahora >= inicio) {
                const habilitadoAlInicio = vence && vence > inicio && new Date(reserva.fecha_inicio) <= inicio && reserva.socio_estado === 'activo';
                estado = estado === 'Confirmada' && habilitadoAlInicio ? (ahora >= fin ? 'Finalizada' : 'En curso') : 'Cancelada';
            } else if (reserva.socio_estado !== 'activo' || !vence) estado = 'Cancelada';
            else if (vence <= ahora) estado = ahora.getTime() >= vence.getTime() + 3 * 86400000 ? 'Cancelada' : 'Pendiente';
            else estado = 'Confirmada';
            if (estado !== reserva.estado) await tx.query('UPDATE inscripciones SET estado=$2 WHERE id=$1', [reserva.id, estado]);
        }
        await tx.query(`UPDATE clases SET estado=CASE WHEN inicio + duracion_minutos * INTERVAL '1 minute' <= $1 THEN 'Finalizada'
        WHEN inicio <= $1 THEN 'En curso' ELSE 'Programada' END WHERE estado <> 'Cancelada'`, [ahora]);
    }
    mantenimiento() {
        return this.ejecutar(async (tx) => {
            await tx.query('DELETE FROM sesiones WHERE expira <= CURRENT_TIMESTAMP');
            await tx.query(`DELETE FROM intentos_auth WHERE inicio < CURRENT_TIMESTAMP - INTERVAL '1 day'`);
            return { procesado: true };
        });
    }
}
