import { filas, una } from './query.js';

const columnas = `tipo,nombre,meses,precio_centavos AS "precioCentavos",descuento_porcentaje AS "descuentoPorcentaje",
condiciones_descuento AS "condicionesDescuento",metodo_descuento AS "metodoDescuento",habilitado`;
export default class PlanRepository {
    constructor(db) { this.db = db; }
    findAll(tx = this.db) { return filas(tx, `SELECT ${columnas} FROM planes WHERE NOT eliminado ORDER BY meses,nombre,tipo`); }
    disponibles(socioId = null, tx = this.db) {
        return filas(tx, `SELECT ${columnas} FROM planes p WHERE NOT eliminado AND (habilitado OR
        EXISTS(SELECT 1 FROM membresias m WHERE m.socio_id=$1 AND m.tipo_plan=p.tipo)) ORDER BY meses,nombre,tipo`, [socioId]);
    }
    find(tipo, tx = this.db) { return una(tx, `SELECT ${columnas} FROM planes WHERE tipo=$1 AND NOT eliminado`, [tipo]); }
    create(tipo, datos, tx) {
        return una(tx, `INSERT INTO planes(tipo,nombre,meses,precio_centavos,descuento_porcentaje,condiciones_descuento,metodo_descuento,habilitado)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${columnas}`, [tipo, datos.nombre, datos.meses, datos.precioCentavos, datos.descuentoPorcentaje, datos.condicionesDescuento, datos.metodoDescuento, datos.habilitado]);
    }
    async update(tipo, datos, tx) {
        await tx.query(`UPDATE planes SET nombre=$2,meses=$3,precio_centavos=$4,descuento_porcentaje=$5,
        condiciones_descuento=$6,metodo_descuento=$7,habilitado=$8 WHERE tipo=$1`, [tipo, datos.nombre, datos.meses, datos.precioCentavos, datos.descuentoPorcentaje, datos.condicionesDescuento, datos.metodoDescuento, datos.habilitado]);
        return this.find(tipo, tx);
    }
    eliminar(tipo, tx) { return tx.query('UPDATE planes SET eliminado=TRUE,habilitado=FALSE WHERE tipo=$1', [tipo]); }
    async autorizaRenovacion(tipo, socioId, tx) {
        return Boolean(await una(tx, 'SELECT id FROM membresias WHERE socio_id=$1 AND tipo_plan=$2 LIMIT 1', [socioId, tipo]));
    }
}
