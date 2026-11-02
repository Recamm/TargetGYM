import MembresiaRepository from '../repositories/MembresiaRepository.js';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import MetodoPagoRepository from '../repositories/MetodoPagoRepository.js';
import { objeto, exigir, entero, texto, id, sumarDuracion } from '../utils/validation.js';
import { importeCobro, metodoAdmitido, tieneDescuento } from '../../../shared/planes.js';
import { ConflictError, NotFoundError } from '../exceptions/AppError.js';

const camposPlan = ['nombre','meses','dias','precioCentavos','precioDescuentoCentavos','descuentoPorcentaje','condicionesDescuento','metodoDescuento','habilitado','descripcion','requisitosAcceso','metodoExclusivo','permiteTarjeta'];
function validarPlan(datos) {
    const nombre = texto(datos.nombre, 'Nombre del plan');
    const meses = datos.meses ?? null, dias = datos.dias ?? null;
    exigir((meses !== null) !== (dias !== null), 'Elegi una duracion en meses o dias, no ambas.');
    if (meses !== null) entero(meses, 'Duracion en meses', 120);
    if (dias !== null) entero(dias, 'Duracion en dias', 3660);
    if (datos.precioCentavos !== null) entero(datos.precioCentavos, 'Precio en centavos', 100000000);
    exigir(Number.isInteger(datos.descuentoPorcentaje) && datos.descuentoPorcentaje >= 0 && datos.descuentoPorcentaje <= 99, 'El descuento debe ser de 0 a 99%.');
    exigir(typeof datos.condicionesDescuento === 'string' && datos.condicionesDescuento.length <= 500, 'Las condiciones admiten hasta 500 caracteres.');
    exigir(datos.metodoDescuento === null || ['Efectivo','Transferencia','Tarjeta'].includes(datos.metodoDescuento), 'El metodo del descuento no es valido.');
    exigir(typeof datos.habilitado === 'boolean', 'El estado del plan debe ser habilitado o deshabilitado.');
    if (datos.precioDescuentoCentavos !== null) {
        entero(datos.precioDescuentoCentavos, 'Precio promocional en centavos', 100000000);
        exigir(datos.precioCentavos !== null && datos.precioDescuentoCentavos < datos.precioCentavos && datos.descuentoPorcentaje === 0, 'El precio promocional debe ser menor al base y no puede combinarse con un porcentaje.');
    }
    exigir(tieneDescuento(datos) || (!datos.condicionesDescuento.trim() && datos.metodoDescuento === null), 'Un plan sin descuento no admite condiciones de descuento.');
    for (const campo of ['descripcion','requisitosAcceso']) exigir(typeof datos[campo] === 'string' && datos[campo].length <= 500, 'Descripcion y requisitos admiten hasta 500 caracteres.');
    exigir(datos.metodoExclusivo === null || ['Efectivo','Transferencia','Tarjeta'].includes(datos.metodoExclusivo), 'El metodo exclusivo no es valido.');
    exigir(!datos.metodoExclusivo || !datos.metodoDescuento || datos.metodoExclusivo === datos.metodoDescuento, 'El descuento debe ser compatible con el metodo exclusivo del plan.');
    exigir(typeof datos.permiteTarjeta === 'boolean' && (datos.permiteTarjeta || (datos.metodoExclusivo !== 'Tarjeta' && datos.metodoDescuento !== 'Tarjeta')), 'Revisa la disponibilidad de tarjeta para este plan.');
    if (datos.precioCentavos !== null) exigir(Math.round(datos.precioCentavos * (100 - datos.descuentoPorcentaje) / 100) > 0, 'El precio final con descuento debe ser de al menos un centavo.');
    return { nombre, meses, dias, precioCentavos: datos.precioCentavos, descuentoPorcentaje: datos.descuentoPorcentaje,
        precioDescuentoCentavos: datos.precioDescuentoCentavos, descripcion: datos.descripcion.trim(), requisitosAcceso: datos.requisitosAcceso.trim(), metodoExclusivo: datos.metodoExclusivo, permiteTarjeta: datos.permiteTarjeta,
        condicionesDescuento: datos.condicionesDescuento.trim(), metodoDescuento: datos.metodoDescuento, habilitado: datos.habilitado };
}

export default class MembresiaService {
    constructor(db, estados) { this.repository = new MembresiaRepository(db); this.usuarios = new UsuarioRepository(db); this.planes = new PlanRepository(db); this.metodos = new MetodoPagoRepository(db); this.estados = estados; }
    actual(socioId) { return this.estados.ejecutar((tx) => this.repository.actual(id(socioId), tx)); }
    planesDisponibles() { return this.planes.disponibles(); }
    planesGestion() { return this.planes.findAll(); }
    metodosPagoDisponibles() { return this.metodos.disponibles(); }
    metodosPagoGestion() { return this.metodos.findAll(); }
    configurarMetodoPago(codigo, datos) {
        objeto(datos, ['habilitado']);
        exigir(typeof datos.habilitado === 'boolean', 'El estado del metodo debe ser habilitado o deshabilitado.');
        return this.estados.ejecutar(async tx => {
            if (!await this.metodos.find(codigo, tx)) throw new NotFoundError('El metodo de pago no existe.');
            return this.metodos.update(codigo, datos.habilitado, tx);
        });
    }
    planesParaSocio(socioId) {
        return this.estados.ejecutar(async tx => {
            const socio = await this.usuarios.findById(id(socioId), tx);
            if (!socio || socio.rol !== 'Socio') throw new NotFoundError('El socio no existe.');
            return this.planes.disponibles(socio.id, tx);
        });
    }
    crearPlan(datos) {
        objeto(datos, camposPlan);
        const limpio = validarPlan({ descuentoPorcentaje: 0, precioDescuentoCentavos: null, descripcion: '', requisitosAcceso: '', metodoExclusivo: null, permiteTarjeta: true,
            condicionesDescuento: '', metodoDescuento: null, habilitado: true, ...datos });
        return this.estados.ejecutar(tx => this.planes.create(`plan-${randomUUID()}`, limpio, tx));
    }
    configurar(tipo, datos) {
        objeto(datos, camposPlan);
        exigir(Object.keys(datos).length > 0, 'Envia al menos un cambio.');
        return this.estados.ejecutar(async (tx) => {
            const actual = await this.planes.find(tipo, tx);
            if (!actual) throw new NotFoundError('El plan no existe.');
            return this.planes.update(tipo, validarPlan({ ...actual, ...datos }), tx);
        });
    }
    eliminarPlan(tipo) {
        return this.estados.ejecutar(async tx => {
            if (!await this.planes.find(tipo, tx)) throw new NotFoundError('El plan no existe.');
            await this.planes.eliminar(tipo, tx);
            await tx.query('UPDATE usuarios SET plan_solicitado=NULL,metodo_pago_solicitado=NULL,fecha_solicitud_plan=NULL,pago_reportado_en=NULL WHERE plan_solicitado=$1', [tipo]);
            return { eliminado: true };
        });
    }
    async planContratable(tipo, socioId, tx) {
        exigir(typeof tipo === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(tipo), 'El plan no es valido.');
        const plan = await this.planes.find(tipo, tx);
        if (!plan) throw new ConflictError('El plan no esta disponible.');
        if (!plan.habilitado && !await this.planes.autorizaRenovacion(tipo, socioId, tx)) throw new ConflictError('El plan esta deshabilitado para nuevas contrataciones.');
        if (!plan.precioCentavos) throw new ConflictError('El administrador debe configurar primero el precio del plan.');
        return plan;
    }
    cambiarPlan(socioId, datos, administrador) {
        objeto(datos, ['tipoPlan','confirmarRequisitos']);
        exigir(datos.confirmarRequisitos === undefined || typeof datos.confirmarRequisitos === 'boolean', 'La verificacion de requisitos debe ser booleana.');
        return this.estados.ejecutar(async (tx, ahora) => {
            const socio = await this.usuarios.findById(id(socioId), tx);
            if (!socio || socio.rol !== 'Socio' || socio.estado === 'baja') throw new ConflictError('El socio no esta disponible.');
            const actual = await this.repository.actual(socio.id, tx);
            if (!actual || actual.estado !== 'activa') throw new ConflictError('El socio necesita una membresia vigente para cambiar de plan sin un pago.');
            const plan = await this.planContratable(datos.tipoPlan, socio.id, tx);
            exigir(!plan.requisitosAcceso || datos.confirmarRequisitos === true, 'Confirma que verificaste los requisitos de acceso del plan.');
            if (!plan.habilitado) throw new ConflictError('Para cambiar de plan elegi uno habilitado.');
            if (plan.tipo === actual.tipoPlan) throw new ConflictError('El socio ya tiene este plan.');
            const nueva = await this.repository.create(socio.id, plan, actual.fechaInicio, actual.fechaVencimiento, tx);
            await tx.query(`INSERT INTO cambios_plan(socio_id,membresia_anterior_id,membresia_nueva_id,administrador_id,fecha,requisitos_verificados)
            VALUES($1,$2,$3,$4,$5,$6)`, [socio.id, actual.id, nueva.id, administrador.id, ahora, plan.requisitosAcceso]);
            await tx.query('UPDATE usuarios SET plan_solicitado=NULL,metodo_pago_solicitado=NULL,fecha_solicitud_plan=NULL,pago_reportado_en=NULL WHERE id=$1', [socio.id]);
            return nueva;
        });
    }
    pagos(socioId) { return this.repository.pagos(socioId); }
    anularPago(pagoId, datos, administrador) {
        pagoId = id(pagoId);
        objeto(datos, ['motivo']);
        exigir(datos.motivo === undefined || (typeof datos.motivo === 'string' && datos.motivo.length <= 500), 'El motivo admite hasta 500 caracteres.');
        return this.estados.ejecutar(async (tx, ahora) => {
            const pago = await this.repository.pagoPorId(pagoId, tx);
            if (!pago) throw new NotFoundError('El pago no existe.');
            if (pago.anuladoEn) return { anulado: true };
            await this.repository.anularPago(pagoId, administrador.id, (datos.motivo ?? '').trim(), ahora, tx);
            const eventos = await this.repository.eventos(pago.socioId, tx), recalculadas = [];
            if (new Set(eventos.map(evento => evento.id)).size !== eventos.length) throw new ConflictError('El historial tiene movimientos incompatibles. No se pudo anular el pago.');
            let actual = null;
            for (const evento of eventos) {
                let inicio = new Date(evento.fechaInicioOriginal), fin = new Date(evento.fechaVencimientoOriginal);
                let anulada = Boolean(evento.pagoId && evento.anuladoEn);
                if (evento.pagoId && !anulada) {
                    const fecha = new Date(evento.fechaPago), vigente = actual && actual.fin > fecha;
                    inicio = vigente ? actual.inicio : fecha;
                    fin = sumarDuracion(vigente ? actual.fin : fecha, evento);
                } else if (evento.cambioId) {
                    const fecha = new Date(evento.fechaCambio);
                    anulada = !actual || actual.inicio > fecha || actual.fin <= fecha;
                    if (!anulada) { inicio = actual.inicio; fin = actual.fin; }
                }
                const membresia = { id: evento.id, inicio, fin, anulada };
                recalculadas.push(membresia);
                if (!anulada) actual = membresia;
            }
            for (const membresia of recalculadas) {
                const estado = membresia.id === actual?.id ? membresia.fin > ahora ? 'activa' : 'vencida' : 'reemplazada';
                await this.repository.recalcular(membresia, estado, tx);
            }
            await this.estados.conciliar(tx, ahora);
            return { anulado: true };
        });
    }
    solicitar(datos, actor) {
        objeto(datos, ['tipoPlan','metodoPago']);
        return this.estados.ejecutar(async (tx, ahora) => {
            await this.metodos.exigirDisponible(datos.metodoPago, tx);
            const plan = await this.planContratable(datos.tipoPlan, actor.id, tx);
            if (!metodoAdmitido(plan, datos.metodoPago)) throw new ConflictError('El plan solo admite el metodo de pago indicado en sus condiciones.');
            await tx.query('UPDATE usuarios SET plan_solicitado=$2,metodo_pago_solicitado=$3,fecha_solicitud_plan=$4,pago_reportado_en=NULL WHERE id=$1', [actor.id, plan.tipo, datos.metodoPago, ahora]);
            return { tipoPlan: plan.tipo, solicitadoEn: ahora, pendienteDePago: true };
        });
    }
    reportarPago(datos, actor) {
        objeto(datos, []);
        return this.estados.ejecutar(async (tx, ahora) => {
            const socio = await this.usuarios.findById(actor.id, tx);
            if (!socio.tipoPlan || socio.metodoPagoSolicitado !== 'Transferencia' || socio.estado !== 'activo') throw new ConflictError('No hay una transferencia pendiente que puedas informar.');
            await tx.query('UPDATE usuarios SET pago_reportado_en=COALESCE(pago_reportado_en,$2) WHERE id=$1', [socio.id, ahora]);
            return this.usuarios.findById(socio.id, tx);
        });
    }
    registrarPago(datos, administrador) {
        objeto(datos, ['socioId','tipoPlan','metodoPago','operacionId','aplicarDescuento','confirmarRequisitos']);
        id(datos.socioId);
        exigir(['Efectivo','Transferencia','Tarjeta'].includes(datos.metodoPago), 'El metodo de pago no es valido.');
        exigir(datos.aplicarDescuento === undefined || typeof datos.aplicarDescuento === 'boolean', 'La confirmacion de descuento debe ser booleana.');
        exigir(datos.confirmarRequisitos === undefined || typeof datos.confirmarRequisitos === 'boolean', 'La verificacion de requisitos debe ser booleana.');
        exigir(typeof datos.operacionId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(datos.operacionId), 'La operacion de pago requiere un UUID valido.');
        return this.estados.ejecutar(async (tx, ahora) => {
            const repetido = await this.repository.pagoPorOperacion(datos.operacionId, tx);
            if (repetido) {
                if (repetido.anuladoEn) throw new ConflictError('El pago de esta operacion fue anulado. Recarga la pagina antes de registrar un nuevo pago.');
                if (repetido.socioId !== datos.socioId || repetido.tipoPlan !== datos.tipoPlan || repetido.metodoPago !== datos.metodoPago || repetido.confirmacionDescuento !== (datos.aplicarDescuento === true) || repetido.confirmacionRequisitos !== (datos.confirmarRequisitos === true)) throw new ConflictError('La operacion ya se uso para otro pago.');
                return repetido;
            }
            const socio = await this.usuarios.findById(datos.socioId, tx);
            if (!socio || socio.rol !== 'Socio' || socio.estado === 'baja') throw new ConflictError('El socio no esta disponible.');
            const plan = await this.planContratable(datos.tipoPlan, socio.id, tx);
            if (!metodoAdmitido(plan, datos.metodoPago)) throw new ConflictError('El plan solo admite el metodo de pago indicado en sus condiciones.');
            exigir(!plan.requisitosAcceso || datos.confirmarRequisitos === true, 'Confirma que verificaste los requisitos de acceso del plan.');
            const condicionado = Boolean(plan.condicionesDescuento || plan.metodoDescuento);
            if (datos.aplicarDescuento && plan.metodoDescuento && plan.metodoDescuento !== datos.metodoPago) throw new ConflictError('El metodo de pago no cumple las condiciones del descuento.');
            const descuento = !condicionado || datos.aplicarDescuento ? plan.descuentoPorcentaje : 0;
            const anterior = await this.repository.actual(socio.id, tx);
            const vigente = anterior && new Date(anterior.fechaVencimiento) > ahora;
            const base = vigente ? new Date(anterior.fechaVencimiento) : ahora;
            const inicio = vigente ? new Date(anterior.fechaInicio) : ahora;
            const fin = sumarDuracion(base, plan);
            const monto = importeCobro(plan, datos.metodoPago, datos.aplicarDescuento === true);
            const membresia = await this.repository.create(socio.id, plan, inicio, fin, tx);
            const pago = await this.repository.registrarPago(datos, plan, descuento, membresia.id, monto, administrador.id, ahora, tx);
            await tx.query('UPDATE usuarios SET plan_solicitado=NULL,metodo_pago_solicitado=NULL,fecha_solicitud_plan=NULL,pago_reportado_en=NULL WHERE id=$1', [socio.id]);
            await this.estados.conciliar(tx, ahora);
            return pago;
        });
    }
    socios() {
        return this.estados.ejecutar(async (tx, ahora) => {
            const socios = await this.usuarios.findAll('Socio', tx);
            const resultado = [];
            for (const socio of socios) {
                const membresia = await this.repository.actual(socio.id, tx);
                resultado.push({ ...socio, membresia, proximaAVencer: Boolean(membresia && new Date(membresia.fechaVencimiento) > ahora && new Date(membresia.fechaVencimiento).getTime() - ahora.getTime() <= 7 * 86400000) });
            }
            return resultado;
        });
    }
    detalle(socioId) {
        return this.estados.ejecutar(async (tx) => {
            const socio = await this.usuarios.findById(id(socioId), tx);
            if (!socio || socio.rol !== 'Socio') throw new NotFoundError('El socio no existe.');
            return { ...socio, membresias: await this.repository.historial(socio.id, tx), pagos: await this.repository.pagos(socio.id, tx), cambiosPlan: await this.repository.cambios(socio.id, tx) };
        });
    }
}
import { randomUUID } from 'node:crypto';
