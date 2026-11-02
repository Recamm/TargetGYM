import { filas, una } from './query.js';

const columnas = `tipo,meses,precio_centavos AS "precioCentavos",descuento_porcentaje AS "descuentoPorcentaje"`;
export default class PlanRepository {
    constructor(db) { this.db = db; }
    findAll(tx = this.db) { return filas(tx, `SELECT ${columnas} FROM planes ORDER BY meses`); }
    find(tipo, tx = this.db) { return una(tx, `SELECT ${columnas} FROM planes WHERE tipo=$1`, [tipo]); }
    async update(tipo, datos, tx) {
        await tx.query('UPDATE planes SET precio_centavos=$2,descuento_porcentaje=$3 WHERE tipo=$1', [tipo, datos.precioCentavos, datos.descuentoPorcentaje]);
        return this.find(tipo, tx);
    }
}
