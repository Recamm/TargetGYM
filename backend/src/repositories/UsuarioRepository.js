import { filas, una } from './query.js';

const columnas = `id, nombre, apellido, email, dni, telefono, fecha_nacimiento AS "fechaNacimiento",
rol, estado, especialidad, plan_solicitado AS "tipoPlan",
(SELECT nombre FROM planes WHERE tipo=usuarios.plan_solicitado AND NOT eliminado) AS "nombrePlanSolicitado",
metodo_pago_solicitado AS "metodoPagoSolicitado", fecha_solicitud_plan AS "solicitadoEn",
pago_reportado_en AS "pagoReportadoEn", acceso_pendiente AS "accesoPendiente", fecha_alta AS "fechaAlta"`;

export default class UsuarioRepository {
    constructor(db) { this.db = db; }
    findById(id, tx = this.db) { return una(tx, `SELECT ${columnas} FROM usuarios WHERE id = $1`, [id]); }
    findByEmail(email, tx = this.db) { return una(tx, `SELECT ${columnas}, password_hash AS "passwordHash" FROM usuarios WHERE email = $1`, [email]); }
    findAll(rol, tx = this.db) { return filas(tx, `SELECT ${columnas} FROM usuarios WHERE rol = $1 ORDER BY apellido, nombre`, [rol]); }
    async create(datos, rol, passwordHash, tx) {
        const user = await una(tx, `INSERT INTO usuarios(nombre,apellido,email,password_hash,dni,telefono,fecha_nacimiento,rol,especialidad,plan_solicitado,metodo_pago_solicitado,fecha_solicitud_plan,acceso_pendiente)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        [datos.nombre, datos.apellido, datos.email, passwordHash, datos.dni ?? null, datos.telefono ?? null,
            datos.fechaNacimiento ?? null, rol, datos.especialidad ?? null, datos.tipoPlan ?? null,
            datos.metodoPago ?? null, datos.solicitadoEn ?? null, datos.accesoPendiente ?? false]);
        return this.findById(user.id, tx);
    }
    async update(id, datos, passwordHash, tx) {
        await tx.query(`UPDATE usuarios SET nombre=$2,apellido=$3,email=$4,dni=$5,telefono=$6,
        fecha_nacimiento=$7,estado=$8,password_hash=COALESCE($9,password_hash),
        acceso_pendiente=CASE WHEN $9::TEXT IS NOT NULL THEN FALSE ELSE acceso_pendiente END WHERE id=$1`,
        [id, datos.nombre, datos.apellido, datos.email, datos.dni, datos.telefono, datos.fechaNacimiento, datos.estado, passwordHash]);
        return this.findById(id, tx);
    }
}
