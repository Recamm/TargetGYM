import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, migrate } from '../database/Database.js';
import AuthService from '../services/AuthService.js';
import MembresiaService from '../services/MembresiaService.js';
import EstadoService from '../services/EstadoService.js';

async function setup(t) {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    t.after(() => db.close());
    await migrate(db);
    const clock = () => new Date('2030-01-31T15:00:00Z'), auth = new AuthService(db, clock);
    const admin = await auth.crearAdministrador({ nombre: 'Admin', apellido: 'Prueba', email: 'admin@example.test', password: 'PruebaSegura123!' });
    const persona = { nombre: 'Socio', apellido: 'Prueba', email: 'socio@example.test', password: 'PruebaSegura123!',
        dni: '90008100', telefono: '1100000000', fechaNacimiento: '1960-01-01' };
    const socio = await auth.registrar(persona), service = new MembresiaService(db, new EstadoService(db, clock));
    const pagar = (tipoPlan, metodoPago = 'Efectivo', extra = {}) => service.registrarPago({
        socioId: socio.id, tipoPlan, metodoPago, operacionId: crypto.randomUUID(), ...extra,
    }, admin);
    return { db, auth, admin, persona, socio, service, pagar };
}

test('catálogo confirmado: seis planes, precios exactos, duraciones y oferta anterior conservada', async t => {
    const { db, service } = await setup(t);
    const planes = await service.planesDisponibles();
    assert.equal(planes.length, 6);
    const esperado = {
        mensual: [1, null, 8800000, 7800000],
        'pase-dia': [null, 1, 3000000, 2500000],
        'pase-semanal': [null, 7, 5000000, 4600000],
        'pase-quincena': [null, 15, 5900000, 5300000],
        jubilados: [1, null, 6200000, null],
        'full-target': [1, null, 9800000, null],
    };
    for (const plan of planes) assert.deepEqual([plan.meses, plan.dias, plan.precioCentavos, plan.precioDescuentoCentavos], esperado[plan.tipo]);
    assert.match(planes.find(p => p.tipo === 'full-target').descripcion, /San Fernando.*Tigre/);
    assert.equal(planes.find(p => p.tipo === 'jubilados').metodoExclusivo, 'Efectivo');
    assert.match(planes.find(p => p.tipo === 'jubilados').requisitosAcceso, /jubilad/i);
    assert.equal((await service.planesGestion()).find(p => p.tipo === 'anual').habilitado, false);
    await service.configurar('mensual', { precioCentavos: 9000000 });
    await migrate(db);
    assert.equal((await service.planesDisponibles()).find(p => p.tipo === 'mensual').precioCentavos, 9000000);
});

test('caja cobra los importes exactos por método y exige verificar jubilación', async t => {
    const { pagar, service, socio, admin } = await setup(t);
    for (const [tipo, efectivo, transferencia] of [['mensual', 7800000, 8800000], ['pase-dia', 2500000, 3000000],
        ['pase-semanal', 4600000, 5000000], ['pase-quincena', 5300000, 5900000]]) {
        assert.equal((await pagar(tipo)).montoCentavos, efectivo);
        assert.equal((await pagar(tipo, 'Transferencia')).montoCentavos, transferencia);
    }
    assert.equal((await pagar('mensual', 'Tarjeta')).montoCentavos, 8800000);
    await assert.rejects(() => pagar('pase-dia', 'Tarjeta'), { statusCode: 409 });
    await assert.rejects(() => pagar('jubilados'), { statusCode: 400 });
    await assert.rejects(() => pagar('jubilados', 'Transferencia', { confirmarRequisitos: true }), { statusCode: 409 });
    const operacionId = crypto.randomUUID();
    const jubilado = await pagar('jubilados', 'Efectivo', { confirmarRequisitos: true, operacionId });
    assert.equal(jubilado.montoCentavos, 6200000);
    assert.equal((await pagar('jubilados', 'Efectivo', { confirmarRequisitos: true, operacionId })).id, jubilado.id);
    await assert.rejects(() => pagar('jubilados', 'Efectivo', { operacionId }), { statusCode: 409 });
    await pagar('full-target');
    await assert.rejects(() => service.cambiarPlan(socio.id, { tipoPlan: 'jubilados' }, admin), { statusCode: 400 });
    await service.cambiarPlan(socio.id, { tipoPlan: 'jubilados', confirmarRequisitos: true }, admin);
});

test('pases de 1, 7 y 15 días: vencimientos exactos, renovación y anulación con duración histórica', async t => {
    const { pagar, service, socio, admin } = await setup(t);
    const operacionId = crypto.randomUUID(), dia = await pagar('pase-dia', 'Efectivo', { operacionId });
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-01T15:00:00.000Z');
    await pagar('pase-dia', 'Efectivo', { operacionId });
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-01T15:00:00.000Z');
    const semana = await pagar('pase-semanal');
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-08T15:00:00.000Z');
    await pagar('pase-quincena');
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-23T15:00:00.000Z');
    await service.configurar('pase-quincena', { dias: 20, precioCentavos: 9000000 });
    await service.anularPago(semana.id, {}, admin);
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-16T15:00:00.000Z');
    await service.anularPago(dia.id, {}, admin);
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-15T15:00:00.000Z');
    const historial = await service.pagos(socio.id);
    assert.equal(historial.find(p => p.tipoPlan === 'pase-quincena').montoCentavos, 5300000);
    assert.equal(historial.find(p => p.tipoPlan === 'pase-quincena').descuentoCentavos, 600000);
});

test('asociación con tarjeta es presencial y queda pendiente; requisitos de método se validan en servidor', async t => {
    const { auth, persona, service } = await setup(t);
    const crear = datos => auth.registrar({ ...persona, email: 'nuevo@example.test', dni: '90008101', tipoPlan: 'mensual', metodoPago: 'Tarjeta', ...datos }, 'Socio', { asociacion: true });
    const nuevo = await crear();
    assert.equal(nuevo.metodoPagoSolicitado, 'Tarjeta');
    assert.equal(await service.actual(nuevo.id), null);
    await assert.rejects(() => crear({ email: 'otro@example.test', dni: '90008102', tipoPlan: 'jubilados', metodoPago: 'Transferencia' }), { statusCode: 409 });
    await service.configurarMetodoPago('Tarjeta', { habilitado: false });
    await assert.rejects(() => crear({ email: 'otro@example.test', dni: '90008102' }), { statusCode: 409 });
});

test('administración valida unidades, precio promocional y condiciones sin perder compatibilidad mensual', async t => {
    const { service } = await setup(t);
    const base = { nombre: 'Pase de prueba', meses: null, dias: 7, precioCentavos: 5000000,
        precioDescuentoCentavos: 4600000, metodoDescuento: 'Efectivo' };
    const creado = await service.crearPlan(base);
    assert.equal(creado.dias, 7);
    for (const cambio of [{ meses: 1 }, { dias: 0 }, { dias: 1.5 }, { dias: 3661 }, { precioDescuentoCentavos: 5000001 },
        { descuentoPorcentaje: 10 }, { metodoExclusivo: 'Bitcoin' }, { requisitosAcceso: 'x'.repeat(501) }]) {
        await assert.rejects(async () => service.crearPlan({ ...base, ...cambio }), { statusCode: 400 });
    }
    const mensual = await service.crearPlan({ nombre: 'Mensual anterior', meses: 1, precioCentavos: 1000000 });
    assert.equal(mensual.meses, 1);
    assert.equal(mensual.dias, null);
});
