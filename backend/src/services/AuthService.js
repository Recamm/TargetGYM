import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import MetodoPagoRepository from '../repositories/MetodoPagoRepository.js';
import { metodoAdmitido } from '../../../shared/planes.js';
import { una } from '../repositories/query.js';
import { objeto, texto, exigir, fechaValida, id } from '../utils/validation.js';
import { UnauthorizedError, NotFoundError, ConflictError, TooManyRequestsError } from '../exceptions/AppError.js';

const scrypt = promisify(scryptCallback);
const opciones = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const campos = ['nombre','apellido','email','password','dni','telefono','fechaNacimiento','tipoPlan','especialidad','metodoPago'];
function validarPassword(password) {
    exigir(typeof password === 'string' && password.length >= 8 && password.length <= 128
        && /[A-Z]/.test(password) && /\d/.test(password), 'La contraseña requiere 8 a 128 caracteres, una mayuscula y un numero.');
}

export async function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    const hash = await scrypt(password, salt, 64, opciones);
    return `${salt}:${hash.toString('hex')}`;
}

function validarUsuario(datos, ahora, requierePassword = true) {
    const limpio = {
        nombre: texto(datos.nombre, 'Nombre'),
        apellido: texto(datos.apellido, 'Apellido'),
        email: texto(datos.email, 'Email', 254).toLowerCase(),
        dni: texto(datos.dni, 'DNI', 12),
        telefono: texto(datos.telefono, 'Telefono', 24),
        fechaNacimiento: datos.fechaNacimiento,
    };
    exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio.email), 'El email no es valido.');
    exigir(/^\d{7,9}$/.test(limpio.dni), 'El DNI debe contener entre 7 y 9 digitos.');
    exigir(/^\+?[\d ()-]{7,24}$/.test(limpio.telefono), 'El telefono no es valido.');
    exigir(fechaValida(limpio.fechaNacimiento), 'La fecha de nacimiento no es valida.');
    const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(ahora);
    const limite = `${Number(hoy.slice(0, 4)) - 16}${hoy.slice(4)}`;
    exigir(limpio.fechaNacimiento <= limite, 'El registro requiere tener al menos 16 años.');
    if (requierePassword || datos.password !== undefined) {
        validarPassword(datos.password);
    }
    if (datos.tipoPlan !== undefined) {
        exigir(typeof datos.tipoPlan === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(datos.tipoPlan), 'El plan no es valido.');
        limpio.tipoPlan = datos.tipoPlan;
    }
    if (datos.especialidad !== undefined) limpio.especialidad = texto(datos.especialidad, 'Especialidad');
    return limpio;
}

export default class AuthService {
    constructor(db, clock = () => new Date()) { this.db = db; this.clock = clock; this.repository = new UsuarioRepository(db); }
    async registrar(datos, rol = 'Socio', { asociacion = false, invitacion = false } = {}) {
        objeto(datos, campos);
        const limpio = validarUsuario(datos, this.clock(), !invitacion);
        if (asociacion) {
            exigir(Boolean(limpio.tipoPlan), 'Elegi un plan habilitado para asociarte.');
            exigir(['Efectivo','Transferencia','Tarjeta'].includes(datos.metodoPago), 'Elegi un metodo de pago valido.');
        }
        if (datos.metodoPago !== undefined) exigir(rol === 'Socio' && ['Efectivo','Transferencia','Tarjeta'].includes(datos.metodoPago), 'El metodo de pago solicitado no es valido.');
        limpio.metodoPago = datos.metodoPago;
        limpio.solicitadoEn = limpio.tipoPlan ? this.clock() : null;
        limpio.accesoPendiente = invitacion;
        if (rol === 'Instructor') exigir(Boolean(limpio.especialidad), 'La especialidad del instructor es obligatoria.');
        const passwordHash = await hashPassword(invitacion ? randomBytes(32).toString('hex') : datos.password);
        return this.db.transaction(async tx => {
            if (asociacion) await new MetodoPagoRepository(this.db).exigirDisponible(datos.metodoPago, tx);
            if (limpio.tipoPlan) {
                const plan = await new PlanRepository(this.db).find(limpio.tipoPlan, tx);
                if (!plan?.habilitado) throw new ConflictError('El plan no esta disponible para nuevas contrataciones.');
                if (asociacion && plan.precioCentavos === null) throw new ConflictError('El plan necesita un precio configurado antes de asociarte.');
                if (datos.metodoPago !== undefined && !metodoAdmitido(plan, datos.metodoPago)) throw new ConflictError('El plan solo admite el metodo de pago indicado en sus condiciones.');
            }
            return this.repository.create(limpio, rol, passwordHash, tx);
        });
    }
    crearSocio(datos) {
        objeto(datos, campos);
        return this.registrar(datos, 'Socio', { invitacion: datos.password === undefined });
    }
    crearInvitacion(usuarioId, administrador, datos = {}) {
        objeto(datos, []);
        return this.db.transaction(async tx => {
            const usuario = await this.repository.findById(id(usuarioId), tx);
            if (!usuario || usuario.rol !== 'Socio' || !usuario.accesoPendiente || usuario.estado !== 'activo') throw new ConflictError('La cuenta no admite una invitacion de primer acceso.');
            const token = randomBytes(32).toString('hex');
            const expira = new Date(this.clock().getTime() + 48 * 3600000);
            await tx.query(`INSERT INTO invitaciones_acceso(usuario_id,token_hash,expira,administrador_id)
            VALUES($1,$2,$3,$4) ON CONFLICT(usuario_id) DO UPDATE SET
            token_hash=$2,expira=$3,administrador_id=$4,usada_en=NULL`,
            [usuario.id, createHash('sha256').update(token).digest('hex'), expira, administrador.id]);
            return { token, expira };
        });
    }
    async activarAcceso(datos, ip) {
        objeto(datos, ['token','password']);
        exigir(typeof datos.token === 'string' && /^[a-f0-9]{64}$/.test(datos.token), 'El enlace de acceso no es valido.');
        validarPassword(datos.password);
        await this.limitar(ip);
        const passwordHash = await hashPassword(datos.password);
        return this.db.transaction(async tx => {
            const invitacion = await una(tx, 'SELECT * FROM invitaciones_acceso WHERE token_hash=$1', [createHash('sha256').update(datos.token).digest('hex')]);
            const usuario = invitacion ? await this.repository.findById(invitacion.usuario_id, tx) : null;
            const ahora = this.clock();
            if (!invitacion || invitacion.usada_en || new Date(invitacion.expira) <= ahora || !usuario?.accesoPendiente || usuario.estado !== 'activo') throw new ConflictError('El enlace vencio, fue utilizado o ya no esta disponible. Pedi una nueva invitacion en el gimnasio.');
            await tx.query('UPDATE usuarios SET password_hash=$2,acceso_pendiente=FALSE WHERE id=$1', [usuario.id, passwordHash]);
            await tx.query('UPDATE invitaciones_acceso SET usada_en=$2 WHERE usuario_id=$1', [usuario.id, ahora]);
            return this.repository.findById(usuario.id, tx);
        });
    }
    async crearAdministrador(datos) {
        objeto(datos, ['nombre','apellido','email','password']);
        const nombre = texto(datos.nombre, 'Nombre'), apellido = texto(datos.apellido, 'Apellido');
        const email = texto(datos.email, 'Email', 254).toLowerCase();
        exigir(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'El email no es valido.');
        exigir(typeof datos.password === 'string' && datos.password.length >= 12 && datos.password.length <= 128
            && /[A-Z]/.test(datos.password) && /\d/.test(datos.password), 'La contraseña inicial requiere 12 caracteres, mayuscula y numero.');
        const passwordHash = await hashPassword(datos.password);
        return this.db.transaction((tx) => this.repository.create({ nombre, apellido, email }, 'Administrador', passwordHash, tx));
    }
    async limitar(ip) {
        const clave = createHash('sha256').update(`login:${ip}`).digest('hex');
        const permitido = await this.db.transaction(async (tx) => {
            const row = await una(tx, `INSERT INTO intentos_auth(clave,cantidad,inicio) VALUES($1,1,$2)
            ON CONFLICT(clave) DO UPDATE SET cantidad=CASE WHEN intentos_auth.inicio < $2::TIMESTAMPTZ - INTERVAL '15 minutes'
            THEN 1 ELSE intentos_auth.cantidad+1 END,inicio=CASE WHEN intentos_auth.inicio < $2::TIMESTAMPTZ - INTERVAL '15 minutes'
            THEN $2 ELSE intentos_auth.inicio END RETURNING cantidad`, [clave, this.clock()]);
            return row.cantidad <= 30;
        });
        if (!permitido) throw new TooManyRequestsError('Demasiados intentos. Espera 15 minutos.');
    }
    async login(datos, ip) {
        objeto(datos, ['email','password']);
        const email = texto(datos.email, 'Email', 254).toLowerCase();
        exigir(typeof datos.password === 'string' && datos.password.length <= 128, 'La contraseña no es valida.');
        await this.limitar(ip);
        const usuario = await this.repository.findByEmail(email);
        const [salt, hash] = usuario?.passwordHash?.split(':') ?? ['usuario-inexistente', null];
        const entrada = await scrypt(datos.password, salt, 64, opciones);
        if (!hash || !timingSafeEqual(entrada, Buffer.from(hash, 'hex')) || usuario.estado === 'baja' || usuario.accesoPendiente) throw new UnauthorizedError('Email o contraseña incorrectos.');
        const { passwordHash, ...seguro } = usuario;
        return seguro;
    }
    async actualizar(idUsuario, datos, permitirEstado = false) {
        id(idUsuario);
        objeto(datos, ['nombre','apellido','email','dni','telefono','fechaNacimiento','password', ...(permitirEstado ? ['estado'] : [])]);
        if (datos.password !== undefined) validarPassword(datos.password);
        const hash = datos.password !== undefined ? await hashPassword(datos.password) : null;
        return this.db.transaction(async (tx) => {
            const actual = await this.repository.findById(idUsuario, tx);
            if (!actual) throw new NotFoundError('El usuario no existe.');
            if (permitirEstado && actual.rol !== 'Socio') throw new ConflictError('Solo se gestionan socios en esta operacion.');
            const perfil = Object.fromEntries(['nombre','apellido','email','dni','telefono','fechaNacimiento'].map(campo => [campo, actual[campo]]));
            const limpio = validarUsuario({ ...perfil, ...datos }, this.clock(), false);
            limpio.estado = permitirEstado && datos.estado !== undefined ? datos.estado : actual.estado;
            exigir(['activo','suspendido','baja'].includes(limpio.estado), 'El estado del socio no es valido.');
            const updated = await this.repository.update(idUsuario, limpio, hash, tx);
            if (hash) await tx.query('UPDATE invitaciones_acceso SET usada_en=$2 WHERE usuario_id=$1', [idUsuario, this.clock()]);
            if (limpio.estado !== 'activo') await tx.query(`UPDATE inscripciones SET estado='Cancelada'
            WHERE socio_id=$1 AND estado IN ('Pendiente','Confirmada') AND clase_id IN (SELECT id FROM clases WHERE inicio>$2)`, [idUsuario, this.clock()]);
            return updated;
        });
    }
}
