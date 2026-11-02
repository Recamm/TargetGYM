import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, migrate } from '../database/Database.js';
import AuthService from '../services/AuthService.js';
import MembresiaService from '../services/MembresiaService.js';
import EstadoService from '../services/EstadoService.js';
import { createApp } from '../app.js';
import { readFile } from 'node:fs/promises';
import { catalogoMensualDePrueba } from './catalogo-pruebas.js';

const datosPlan = { nombre: 'Plan flexible', meses: 2, precioCentavos: 100001, descuentoPorcentaje: 15, condicionesDescuento: 'Abonando en mostrador.', metodoDescuento: 'Efectivo', habilitado: true };
async function setup(t) {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    t.after(() => db.close());
    await migrate(db);
    await catalogoMensualDePrueba(db);
    const clock = () => new Date('2030-01-31T12:00:00-03:00');
    const auth = new AuthService(db, clock);
    const admin = await auth.crearAdministrador({ nombre: 'Admin', apellido: 'Prueba', email: 'admin@example.test', password: 'PruebaSegura123!' });
    const persona = { nombre: 'Socio', apellido: 'Prueba', email: 'socio@example.test', password: 'PruebaSegura123!', dni: '90004001', telefono: '1100000000', fechaNacimiento: '2000-01-01' };
    const socio = await auth.registrar(persona);
    const service = new MembresiaService(db, new EstadoService(db, clock));
    const pagar = (tipoPlan, extra = {}) => service.registrarPago({ socioId: socio.id, tipoPlan, metodoPago: 'Efectivo', operacionId: crypto.randomUUID(), ...extra }, admin);
    return { db, auth, admin, socio, persona, service, pagar, clock };
}

test('catálogo editable: descuentos en cualquier plan, validación y eliminación sin resurrección', async t => {
    const { db, service } = await setup(t);
    const plan = await service.crearPlan(datosPlan);
    assert.equal(plan.nombre, datosPlan.nombre);
    assert.equal(plan.meses, 2);
    assert.ok(plan.tipo);
    await service.configurar('mensual', { precioCentavos: 200000, descuentoPorcentaje: 10 });
    assert.equal((await service.planesDisponibles()).find(item => item.tipo === 'mensual').descuentoPorcentaje, 10);
    for (const body of [
        { ...datosPlan, meses: 0 }, { ...datosPlan, meses: 121 }, { ...datosPlan, precioCentavos: -1 },
        { ...datosPlan, descuentoPorcentaje: 100 }, { ...datosPlan, precioCentavos: 1, descuentoPorcentaje: 99 },
        { ...datosPlan, habilitado: 'false' }, { ...datosPlan, metodoDescuento: 'Otro' },
        { ...datosPlan, condicionesDescuento: 'x'.repeat(501) }, { ...datosPlan, eliminado: false },
    ]) await assert.rejects(async () => service.crearPlan(body), { statusCode: 400 });
    await service.configurar(plan.tipo, { nombre: 'Nuevo nombre', habilitado: false });
    assert.equal((await service.planesDisponibles()).some(item => item.tipo === plan.tipo), false);
    assert.equal((await service.planesGestion()).find(item => item.tipo === plan.tipo).nombre, 'Nuevo nombre');
    await service.configurar(plan.tipo, { habilitado: true });
    assert.ok((await service.planesDisponibles()).some(item => item.tipo === plan.tipo));
    await service.eliminarPlan(plan.tipo);
    await migrate(db);
    await migrate(db);
    assert.equal((await service.planesGestion()).some(item => item.tipo === plan.tipo), false);
    await assert.rejects(async () => service.configurar(plan.tipo, { habilitado: true }), { statusCode: 404 });
});

test('deshabilitar permite renovar a anteriores; eliminar conserva historia; cambio administrativo conserva fechas', async t => {
    const { auth, persona, socio, admin, service, pagar } = await setup(t);
    const plan = await service.crearPlan({ ...datosPlan, condicionesDescuento: '', metodoDescuento: null });
    await pagar(plan.tipo);
    await service.configurar(plan.tipo, { habilitado: false });
    assert.ok((await service.planesParaSocio(socio.id)).some(item => item.tipo === plan.tipo));
    const nuevo = await auth.registrar({ ...persona, email: 'nuevo@example.test', dni: '90004002' });
    await assert.rejects(async () => auth.registrar({ ...persona, email: 'otro@example.test', dni: '90004003', tipoPlan: plan.tipo }), { statusCode: 409 });
    await assert.rejects(async () => service.solicitar({ tipoPlan: plan.tipo, metodoPago: 'Efectivo' }, nuevo), { statusCode: 409 });
    await assert.rejects(async () => pagar(plan.tipo, { socioId: nuevo.id }), { statusCode: 409 });
    await service.solicitar({ tipoPlan: plan.tipo, metodoPago: 'Efectivo' }, socio);
    await pagar(plan.tipo);
    const anterior = await service.actual(socio.id);
    const otro = await service.crearPlan({ ...datosPlan, nombre: 'Plan nuevo', descuentoPorcentaje: 0, condicionesDescuento: '', metodoDescuento: null });
    const cambiado = await service.cambiarPlan(socio.id, { tipoPlan: otro.tipo }, admin);
    assert.equal(cambiado.fechaInicio.toISOString(), anterior.fechaInicio.toISOString());
    assert.equal(cambiado.fechaVencimiento.toISOString(), anterior.fechaVencimiento.toISOString());
    assert.equal(cambiado.tipoPlan, otro.tipo);
    assert.equal((await service.pagos(socio.id)).length, 2);
    await assert.rejects(async () => service.cambiarPlan(nuevo.id, { tipoPlan: otro.tipo }, admin), { statusCode: 409 });
    await assert.rejects(async () => service.cambiarPlan(socio.id, { tipoPlan: plan.tipo }, admin), { statusCode: 409 });
    await service.eliminarPlan(plan.tipo);
    await assert.rejects(async () => pagar(plan.tipo), { statusCode: 409 });
    const detalle = await service.detalle(socio.id);
    assert.equal(detalle.membresias.length, 3);
    assert.equal(detalle.pagos.length, 2);
    assert.ok(detalle.membresias.some(item => item.nombrePlan === 'Plan flexible'));
    assert.equal(detalle.cambiosPlan.length, 1);
    assert.equal(detalle.cambiosPlan[0].administrador, 'Admin Prueba');
    assert.equal(detalle.cambiosPlan[0].planAnterior, 'Plan flexible');
    assert.equal(detalle.cambiosPlan[0].planNuevo, 'Plan nuevo');
});

test('descuento condicionado requiere confirmación manual y método correcto; importes históricos e idempotencia', async t => {
    const { service, pagar, socio } = await setup(t);
    const plan = await service.crearPlan(datosPlan);
    assert.equal((await pagar(plan.tipo)).montoCentavos, 100001);
    await assert.rejects(async () => pagar(plan.tipo, { metodoPago: 'Tarjeta', aplicarDescuento: true }), { statusCode: 409 });
    await assert.rejects(async () => pagar(plan.tipo, { aplicarDescuento: 'sí' }), { statusCode: 400 });
    const operacionId = crypto.randomUUID();
    const pago = await pagar(plan.tipo, { aplicarDescuento: true, operacionId });
    assert.equal(pago.montoCentavos, 85001);
    assert.equal((await pagar(plan.tipo, { aplicarDescuento: true, operacionId })).id, pago.id);
    await assert.rejects(async () => pagar(plan.tipo, { aplicarDescuento: false, operacionId }), { statusCode: 409 });
    await service.configurar(plan.tipo, { precioCentavos: 500000, nombre: 'Precio nuevo' });
    const historico = (await service.pagos(socio.id)).find(item => item.id === pago.id);
    assert.equal(historico.montoCentavos, 85001);
    assert.equal(historico.precioBaseCentavos, 100001);
    assert.equal(historico.descuentoPorcentaje, 15);
    assert.equal(historico.nombrePlan, 'Plan flexible');
    assert.equal(historico.condicionesDescuento, datosPlan.condicionesDescuento);
});

test('las nuevas operaciones y el catálogo completo requieren administrador y CSRF', async t => {
    const { db, admin, socio, clock } = await setup(t);
    const app = createApp({ db, clock, sessionSecret: 'secreto-sintetico-de-pruebas-para-planes-1234567890123456789' });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    function cliente() {
        let cookie = '', csrf = '';
        return async (path, method = 'GET', body, enviarCsrf = true) => {
            const response = await fetch(base + path, { method, headers: { cookie, 'Content-Type': 'application/json', ...(enviarCsrf ? { 'X-CSRF-Token': csrf } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
            if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
            const json = await response.json();
            if (json.data?.csrfToken) csrf = json.data.csrfToken;
            return { status: response.status, ...json };
        };
    }
    const a = cliente(), s = cliente(), anon = cliente();
    for (const [client, email] of [[a, admin.email], [s, socio.email]]) {
        await client('/auth/sesion');
        await client('/auth/login', 'POST', { email, password: 'PruebaSegura123!' });
    }
    assert.equal((await anon('/gestion/planes')).status, 401);
    assert.equal((await s('/gestion/planes')).status, 403);
    assert.equal((await s('/planes', 'POST', datosPlan)).status, 403);
    assert.equal((await a('/planes', 'POST', datosPlan, false)).status, 403);
    assert.equal((await a('/metodos-pago/Efectivo', 'PUT', { habilitado: false }, false)).status, 403);
    assert.equal((await a('/metodos-pago')).data.some(metodo => metodo.codigo === 'Efectivo'), true);
    const creado = await a('/planes', 'POST', datosPlan);
    assert.equal(creado.status, 201);
    assert.equal((await s(`/planes/${creado.data.tipo}`, 'DELETE')).status, 403);
    assert.equal((await s(`/socios/${socio.id}/plan`, 'PUT', { tipoPlan: creado.data.tipo })).status, 403);
    const pago = (await a('/pagos', 'POST', { socioId: socio.id, tipoPlan: creado.data.tipo, metodoPago: 'Efectivo', operacionId: crypto.randomUUID() })).data;
    assert.ok(pago.id);
    assert.equal((await a(`/planes/${creado.data.tipo}`, 'DELETE')).status, 200);
    assert.equal((await a('/pagos/1', 'DELETE', {}, false)).status, 403);
    assert.equal((await s('/pagos/1', 'DELETE', {})).status, 403);
    await anon('/auth/sesion');
    assert.equal((await anon('/pagos/1', 'DELETE', {})).status, 401);
    assert.equal((await a('/pagos/invalido', 'DELETE', {})).status, 400);
    assert.equal((await a('/pagos/999999', 'DELETE', {})).status, 404);
    assert.equal((await a('/pagos/1', 'DELETE', { socioId: socio.id })).status, 400);
    assert.equal((await a('/pagos/1', 'DELETE', { motivo: 123 })).status, 400);
    assert.equal((await a('/pagos/1', 'DELETE', { motivo: 'x'.repeat(501) })).status, 400);
    assert.equal((await a(`/pagos/${pago.id}`, 'DELETE', { motivo: 'Duplicado' })).status, 200);
});

test('migra una base anterior sin modificar pagos ni vencimientos existentes', async t => {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    t.after(() => db.close());
    await db.exec(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO usuarios(nombre,apellido,email,password_hash,rol) VALUES('Admin','Prueba','admin@example.test','sintetico','Administrador'),('Socio','Prueba','socio@example.test','sintetico','Socio');
    UPDATE planes SET precio_centavos=1000000 WHERE tipo='mensual';
    INSERT INTO membresias(socio_id,tipo_plan,fecha_inicio,fecha_vencimiento,estado) VALUES(2,'mensual','2030-01-31T12:00:00-03:00','2030-02-28T12:00:00-03:00','activa');
    INSERT INTO pagos(socio_id,membresia_id,tipo_plan,monto_centavos,metodo_pago,operacion_id,fecha,administrador_id)
    VALUES(2,1,'mensual',900000,'Efectivo','90000000-0000-4000-8000-000000000001','2030-01-31T12:00:00-03:00',1);`);
    await migrate(db);
    await migrate(db);
    const pago = (await db.query('SELECT * FROM pagos')).rows[0];
    assert.equal(pago.monto_centavos, 900000);
    assert.equal(pago.precio_base_centavos, 900000);
    assert.equal(pago.nombre_plan, 'Plan mensual');
    const membresia = (await db.query('SELECT * FROM membresias')).rows[0];
    assert.equal(membresia.nombre_plan, 'Plan mensual');
    assert.equal(membresia.fecha_vencimiento.toISOString(), '2030-02-28T15:00:00.000Z');
    assert.equal((await db.query('SELECT * FROM planes')).rows.length, 8);
});
