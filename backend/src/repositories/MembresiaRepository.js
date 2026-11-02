import { filas, una } from './query.js';

const columnas = `id,socio_id AS "socioId",tipo_plan AS "tipoPlan",nombre_plan AS "nombrePlan",fecha_inicio AS "fechaInicio",fecha_vencimiento AS "fechaVencimiento",estado,
anulada,fecha_inicio_original AS "fechaInicioOriginal",fecha_vencimiento_original AS "fechaVencimientoOriginal"`;
export default class MembresiaRepository {
    constructor(db) { this.db = db; }
    actual(socioId, tx = this.db) { return una(tx, `SELECT ${columnas} FROM membresias WHERE socio_id=$1 AND NOT anulada ORDER BY id DESC LIMIT 1`, [socioId]); }
    historial(socioId, tx = this.db) { return filas(tx, `SELECT ${columnas} FROM membresias WHERE socio_id=$1 ORDER BY id DESC`, [socioId]); }
    cambios(socioId, tx = this.db) {
        return filas(tx, `SELECT c.id,c.fecha,u.nombre || ' ' || u.apellido AS administrador,
        anterior.nombre_plan AS "planAnterior",nuevo.nombre_plan AS "planNuevo",c.requisitos_verificados AS "requisitosVerificados"
        FROM cambios_plan c JOIN usuarios u ON u.id=c.administrador_id
        JOIN membresias anterior ON anterior.id=c.membresia_anterior_id JOIN membresias nuevo ON nuevo.id=c.membresia_nueva_id
        WHERE c.socio_id=$1 ORDER BY c.id DESC`, [socioId]);
    }
    async create(socioId, plan, inicio, fin, tx) {
        await tx.query(`UPDATE membresias SET estado='reemplazada' WHERE socio_id=$1 AND estado <> 'reemplazada'`, [socioId]);
        return una(tx, `INSERT INTO membresias(socio_id,tipo_plan,nombre_plan,fecha_inicio,fecha_vencimiento,estado,fecha_inicio_original,fecha_vencimiento_original)
        VALUES($1,$2,$3,$4,$5,'activa',$4,$5) RETURNING ${columnas}`, [socioId, plan.tipo, plan.nombre, inicio, fin]);
    }
    pagos(socioId = null, tx = this.db) {
        return filas(tx, `SELECT p.id,p.socio_id AS "socioId",p.tipo_plan AS "tipoPlan",p.monto_centavos AS "montoCentavos",
        p.nombre_plan AS "nombrePlan",p.precio_base_centavos AS "precioBaseCentavos",p.descuento_porcentaje AS "descuentoPorcentaje",
        p.condiciones_descuento AS "condicionesDescuento",p.metodo_pago AS "metodoPago",p.operacion_id AS "operacionId",p.fecha,u.nombre || ' ' || u.apellido AS socio,
        p.anulado_en AS "anuladoEn",autor.nombre || ' ' || autor.apellido AS "anuladoPor",p.motivo_anulacion AS "motivoAnulacion",
        p.descuento_centavos AS "descuentoCentavos",p.requisitos_acceso AS "requisitosAcceso",p.confirmacion_requisitos AS "confirmacionRequisitos"
        FROM pagos p JOIN usuarios u ON u.id=p.socio_id LEFT JOIN usuarios autor ON autor.id=p.anulado_por
        WHERE ($1::INTEGER IS NULL OR p.socio_id=$1) ORDER BY p.fecha DESC,p.id DESC`, [socioId]);
    }
    pagoPorOperacion(operacionId, tx) {
        return una(tx, `SELECT id,socio_id AS "socioId",tipo_plan AS "tipoPlan",metodo_pago AS "metodoPago",monto_centavos AS "montoCentavos",
        confirmacion_descuento AS "confirmacionDescuento",confirmacion_requisitos AS "confirmacionRequisitos",anulado_en AS "anuladoEn" FROM pagos WHERE operacion_id=$1`, [operacionId]);
    }
    pagoPorId(id, tx) { return una(tx, 'SELECT id,socio_id AS "socioId",anulado_en AS "anuladoEn" FROM pagos WHERE id=$1', [id]); }
    anularPago(id, administradorId, motivo, ahora, tx) {
        return tx.query('UPDATE pagos SET anulado_en=$2,anulado_por=$3,motivo_anulacion=$4 WHERE id=$1', [id, ahora, administradorId, motivo]);
    }
    eventos(socioId, tx) {
        return filas(tx, `SELECT m.id,m.fecha_inicio_original AS "fechaInicioOriginal",m.fecha_vencimiento_original AS "fechaVencimientoOriginal",
        p.id AS "pagoId",p.fecha AS "fechaPago",p.meses_contratados AS meses,p.dias_contratados AS dias,p.anulado_en AS "anuladoEn",
        c.id AS "cambioId",c.fecha AS "fechaCambio" FROM membresias m
        LEFT JOIN pagos p ON p.membresia_id=m.id LEFT JOIN cambios_plan c ON c.membresia_nueva_id=m.id
        WHERE m.socio_id=$1 ORDER BY m.id`, [socioId]);
    }
    recalcular(membresia, estado, tx) {
        return tx.query('UPDATE membresias SET fecha_inicio=$2,fecha_vencimiento=$3,anulada=$4,estado=$5 WHERE id=$1',
            [membresia.id, membresia.inicio, membresia.fin, membresia.anulada, estado]);
    }
    registrarPago(datos, plan, descuento, membresiaId, monto, administradorId, ahora, tx) {
        return una(tx, `INSERT INTO pagos(socio_id,membresia_id,tipo_plan,monto_centavos,metodo_pago,operacion_id,fecha,administrador_id,
        nombre_plan,precio_base_centavos,descuento_porcentaje,condiciones_descuento,confirmacion_descuento,meses_contratados,dias_contratados,descuento_centavos,confirmacion_requisitos,requisitos_acceso)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id,monto_centavos AS "montoCentavos"`,
        [datos.socioId, membresiaId, datos.tipoPlan, monto, datos.metodoPago, datos.operacionId, ahora, administradorId,
            plan.nombre, plan.precioCentavos, descuento, plan.condicionesDescuento, datos.aplicarDescuento === true, plan.meses, plan.dias,
            plan.precioCentavos-monto,datos.confirmarRequisitos === true,plan.requisitosAcceso]);
    }
}
