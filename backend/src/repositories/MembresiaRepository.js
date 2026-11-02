import { filas, una } from './query.js';

const columnas = `id,socio_id AS "socioId",tipo_plan AS "tipoPlan",fecha_inicio AS "fechaInicio",fecha_vencimiento AS "fechaVencimiento",estado`;
export default class MembresiaRepository {
    constructor(db) { this.db = db; }
    actual(socioId, tx = this.db) { return una(tx, `SELECT ${columnas} FROM membresias WHERE socio_id=$1 ORDER BY id DESC LIMIT 1`, [socioId]); }
    historial(socioId, tx = this.db) { return filas(tx, `SELECT ${columnas} FROM membresias WHERE socio_id=$1 ORDER BY id DESC`, [socioId]); }
    async create(socioId, tipoPlan, inicio, fin, tx) {
        await tx.query(`UPDATE membresias SET estado='reemplazada' WHERE socio_id=$1 AND estado <> 'reemplazada'`, [socioId]);
        return una(tx, `INSERT INTO membresias(socio_id,tipo_plan,fecha_inicio,fecha_vencimiento,estado)
        VALUES($1,$2,$3,$4,'activa') RETURNING ${columnas}`, [socioId, tipoPlan, inicio, fin]);
    }
    pagos(socioId = null, tx = this.db) {
        return filas(tx, `SELECT p.id,p.socio_id AS "socioId",p.tipo_plan AS "tipoPlan",p.monto_centavos AS "montoCentavos",
        p.metodo_pago AS "metodoPago",p.operacion_id AS "operacionId",p.fecha,u.nombre || ' ' || u.apellido AS socio
        FROM pagos p JOIN usuarios u ON u.id=p.socio_id WHERE ($1::INTEGER IS NULL OR p.socio_id=$1) ORDER BY p.fecha DESC,p.id DESC`, [socioId]);
    }
    pagoPorOperacion(operacionId, tx) {
        return una(tx, `SELECT id,socio_id AS "socioId",tipo_plan AS "tipoPlan",metodo_pago AS "metodoPago",monto_centavos AS "montoCentavos" FROM pagos WHERE operacion_id=$1`, [operacionId]);
    }
    registrarPago(datos, membresiaId, monto, administradorId, ahora, tx) {
        return una(tx, `INSERT INTO pagos(socio_id,membresia_id,tipo_plan,monto_centavos,metodo_pago,operacion_id,fecha,administrador_id)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,monto_centavos AS "montoCentavos"`,
        [datos.socioId, membresiaId, datos.tipoPlan, monto, datos.metodoPago, datos.operacionId, ahora, administradorId]);
    }
}
