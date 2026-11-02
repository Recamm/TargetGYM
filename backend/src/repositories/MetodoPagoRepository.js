import { filas, una } from './query.js';
import { exigir } from '../utils/validation.js';
import { ConflictError } from '../exceptions/AppError.js';

const columnas = 'codigo,habilitado,permite_socio AS "permiteSocio"';
export default class MetodoPagoRepository {
    constructor(db) { this.db = db; }
    findAll() { return filas(this.db, `SELECT ${columnas} FROM metodos_pago ORDER BY CASE codigo WHEN 'Efectivo' THEN 1 WHEN 'Transferencia' THEN 2 ELSE 3 END`); }
    disponibles() { return filas(this.db, `SELECT ${columnas} FROM metodos_pago WHERE habilitado AND permite_socio ORDER BY codigo`); }
    find(codigo, tx = this.db) { return una(tx, `SELECT ${columnas} FROM metodos_pago WHERE codigo=$1`, [codigo]); }
    update(codigo, habilitado, tx) { return una(tx, `UPDATE metodos_pago SET habilitado=$2 WHERE codigo=$1 RETURNING ${columnas}`, [codigo, habilitado]); }
    async exigirDisponible(codigo, tx) {
        exigir(['Efectivo','Transferencia','Tarjeta'].includes(codigo), 'Elegi un metodo de pago valido.');
        const metodo = await this.find(codigo, tx);
        if (!metodo?.habilitado || !metodo.permiteSocio) throw new ConflictError('Este metodo de pago esta deshabilitado. Elegi uno disponible o consulta en el gimnasio.');
    }
}
