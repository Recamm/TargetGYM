import MembresiaRepository from '../repositories/MembresiaRepository.js';
import UsuarioRepository from '../repositories/UsuarioRepository.js';
import PlanRepository from '../repositories/PlanRepository.js';
import { objeto, exigir, entero, id, sumarMeses } from '../utils/validation.js';
import { ConflictError, NotFoundError } from '../exceptions/AppError.js';

export default class MembresiaService {
    constructor(db, estados) { this.repository = new MembresiaRepository(db); this.usuarios = new UsuarioRepository(db); this.planes = new PlanRepository(db); this.estados = estados; }
    actual(socioId) { return this.estados.ejecutar((tx) => this.repository.actual(id(socioId), tx)); }
    planesDisponibles() { return this.planes.findAll(); }
    configurar(tipo, datos) {
        objeto(datos, ['precioCentavos','descuentoPorcentaje']);
        entero(datos.precioCentavos, 'Precio en centavos', 100000000);
        exigir(Number.isInteger(datos.descuentoPorcentaje) && datos.descuentoPorcentaje >= 0 && datos.descuentoPorcentaje <= 99, 'El descuento debe ser de 0 a 99%.');
        exigir(tipo === 'anual' || datos.descuentoPorcentaje === 0, 'Solo el plan anual admite descuento.');
        exigir(Math.round(datos.precioCentavos * (100 - datos.descuentoPorcentaje) / 100) > 0, 'El precio final con descuento debe ser de al menos un centavo.');
        return this.estados.ejecutar(async (tx) => {
            if (!await this.planes.find(tipo, tx)) throw new NotFoundError('El plan no existe.');
            return this.planes.update(tipo, datos, tx);
        });
    }
    pagos(socioId) { return this.repository.pagos(socioId); }
    solicitar(datos, actor) {
        objeto(datos, ['tipoPlan']);
        return this.estados.ejecutar(async (tx, ahora) => {
            const plan = await this.planes.find(datos.tipoPlan, tx);
            if (!plan?.precioCentavos) throw new ConflictError('Este plan aun no tiene un precio configurado.');
            await tx.query('UPDATE usuarios SET plan_solicitado=$2 WHERE id=$1', [actor.id, plan.tipo]);
            return { tipoPlan: plan.tipo, solicitadoEn: ahora, pendienteDePago: true };
        });
    }
    registrarPago(datos, administrador) {
        objeto(datos, ['socioId','tipoPlan','metodoPago','operacionId']);
        id(datos.socioId);
        exigir(['Efectivo','Transferencia','Tarjeta'].includes(datos.metodoPago), 'El metodo de pago no es valido.');
        exigir(typeof datos.operacionId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(datos.operacionId), 'La operacion de pago requiere un UUID valido.');
        return this.estados.ejecutar(async (tx, ahora) => {
            const repetido = await this.repository.pagoPorOperacion(datos.operacionId, tx);
            if (repetido) {
                if (repetido.socioId !== datos.socioId || repetido.tipoPlan !== datos.tipoPlan || repetido.metodoPago !== datos.metodoPago) throw new ConflictError('La operacion ya se uso para otro pago.');
                return repetido;
            }
            const socio = await this.usuarios.findById(datos.socioId, tx);
            if (!socio || socio.rol !== 'Socio' || socio.estado === 'baja') throw new ConflictError('El socio no esta disponible.');
            const plan = await this.planes.find(datos.tipoPlan, tx);
            if (!plan?.precioCentavos) throw new ConflictError('El administrador debe configurar primero el precio del plan.');
            const anterior = await this.repository.actual(socio.id, tx);
            const vigente = anterior && new Date(anterior.fechaVencimiento) > ahora;
            const base = vigente ? new Date(anterior.fechaVencimiento) : ahora;
            const inicio = vigente ? new Date(anterior.fechaInicio) : ahora;
            const fin = sumarMeses(base, plan.meses);
            const monto = Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100);
            const membresia = await this.repository.create(socio.id, plan.tipo, inicio, fin, tx);
            const pago = await this.repository.registrarPago(datos, membresia.id, monto, administrador.id, ahora, tx);
            await tx.query('UPDATE usuarios SET plan_solicitado=NULL WHERE id=$1', [socio.id]);
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
            return { ...socio, membresias: await this.repository.historial(socio.id, tx), pagos: await this.repository.pagos(socio.id, tx) };
        });
    }
}
