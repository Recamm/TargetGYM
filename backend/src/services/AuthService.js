import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import { una } from '../repositories/query.js';
import { objeto, texto, exigir, fechaValida, id } from '../utils/validation.js';
import { UnauthorizedError, NotFoundError, ConflictError, TooManyRequestsError } from '../exceptions/AppError.js';

const scrypt = promisify(scryptCallback);
const opciones = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const campos = ['nombre','apellido','email','password','dni','telefono','fechaNacimiento','tipoPlan','especialidad'];
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
        exigir(['mensual','trimestral','anual'].includes(datos.tipoPlan), 'El plan no es valido.');
        limpio.tipoPlan = datos.tipoPlan;
    }
    if (datos.especialidad !== undefined) limpio.especialidad = texto(datos.especialidad, 'Especialidad');
    return limpio;
}

export default class AuthService {
    constructor(db, clock = () => new Date()) { this.db = db; this.clock = clock; this.repository = new UsuarioRepository(db); }
    async registrar(datos, rol = 'Socio') {
        objeto(datos, campos);
        const limpio = validarUsuario(datos, this.clock());
        if (rol === 'Instructor') exigir(Boolean(limpio.especialidad), 'La especialidad del instructor es obligatoria.');
        const passwordHash = await hashPassword(datos.password);
        return this.db.transaction((tx) => this.repository.create(limpio, rol, passwordHash, tx));
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
        if (!hash || !timingSafeEqual(entrada, Buffer.from(hash, 'hex')) || usuario.estado === 'baja') throw new UnauthorizedError('Email o contraseña incorrectos.');
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
            if (limpio.estado !== 'activo') await tx.query(`UPDATE inscripciones SET estado='Cancelada'
            WHERE socio_id=$1 AND estado IN ('Pendiente','Confirmada') AND clase_id IN (SELECT id FROM clases WHERE inicio>$2)`, [idUsuario, this.clock()]);
            return updated;
        });
    }
}
