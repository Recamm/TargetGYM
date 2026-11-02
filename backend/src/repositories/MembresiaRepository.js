import { filas, una } from './query.js';

const columnas = `id,socio_id AS "socioId",tipo_plan AS "tipoPlan",nombre_plan AS "nombrePlan",fecha_inicio AS "fechaInicio",fecha_vencimiento AS "fechaVencimiento",estado`;
export default class MembresiaRepository {
    constructor(db) { this.db = db; }
    actual(socioId, tx = this.db) { return una(tx, `SELECT ${columnas} FROM membresias WHERE socio_id=$1 ORDER BY id DESC LIMIT 1`, [socioId]); }
    historial(socioId, tx = this.db) { return filas(tx, `SELECT ${columnas} FROM membresias WHERE socio_id=$1 ORDER BY id DESC`, [socioId]); }
    cambios(socioId, tx = this.db) {
        return filas(tx, `SELECT c.id,c.fecha,u.nombre || ' ' || u.apellido AS administrador,
        anterior.nombre_plan AS "planAnterior",nuevo.nombre_plan AS "planNuevo"
        FROM cambios_plan c JOIN usuarios u ON u.id=c.administrador_id
        JOIN membresias anterior ON anterior.id=c.membresia_anterior_id JOIN membresias nuevo ON nuevo.id=c.membresia_nueva_id
        WHERE c.socio_id=$1 ORDER BY c.id DESC`, [socioId]);
    }
    async create(socioId, plan, inicio, fin, tx) {
        await tx.query(`UPDATE membresias SET estado='reemplazada' WHERE socio_id=$1 AND estado <> 'reemplazada'`, [socioId]);
        return una(tx, `INSERT INTO membresias(socio_id,tipo_plan,nombre_plan,fecha_inicio,fecha_vencimiento,estado)
        VALUES($1,$2,$3,$4,$5,'activa') RETURNING ${columnas}`, [socioId, plan.tipo, plan.nombre, inicio, fin]);
    }
    pagos(socioId = null, tx = this.db) {
        return filas(tx, `SELECT p.id,p.socio_id AS "socioId",p.tipo_plan AS "tipoPlan",p.monto_centavos AS "montoCentavos",
        p.nombre_plan AS "nombrePlan",p.precio_base_centavos AS "precioBaseCentavos",p.descuento_porcentaje AS "descuentoPorcentaje",
        p.condiciones_descuento AS "condicionesDescuento",p.metodo_pago AS "metodoPago",p.operacion_id AS "operacionId",p.fecha,u.nombre || ' ' || u.apellido AS socio
        FROM pagos p JOIN usuarios u ON u.id=p.socio_id WHERE ($1::INTEGER IS NULL OR p.socio_id=$1) ORDER BY p.fecha DESC,p.id DESC`, [socioId]);
    }
    pagoPorOperacion(operacionId, tx) {
        return una(tx, `SELECT id,socio_id AS "socioId",tipo_plan AS "tipoPlan",metodo_pago AS "metodoPago",monto_centavos AS "montoCentavos",
        confirmacion_descuento AS "confirmacionDescuento" FROM pagos WHERE operacion_id=$1`, [operacionId]);
    }
    registrarPago(datos, plan, descuento, membresiaId, monto, administradorId, ahora, tx) {
        return una(tx, `INSERT INTO pagos(socio_id,membresia_id,tipo_plan,monto_centavos,metodo_pago,operacion_id,fecha,administrador_id,
        nombre_plan,precio_base_centavos,descuento_porcentaje,condiciones_descuento,confirmacion_descuento)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id,monto_centavos AS "montoCentavos"`,
        [datos.socioId, membresiaId, datos.tipoPlan, monto, datos.metodoPago, datos.operacionId, ahora, administradorId,
            plan.nombre, plan.precioCentavos, descuento, plan.condicionesDescuento, datos.aplicarDescuento === true]);
    }
}
