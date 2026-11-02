import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createDatabase, migrate } from '../database/Database.js';
import AuthService from '../services/AuthService.js';
import MembresiaService from '../services/MembresiaService.js';
import EstadoService from '../services/EstadoService.js';
import ClaseService from '../services/ClaseService.js';
import InscripcionService from '../services/InscripcionService.js';
import { catalogoMensualDePrueba } from './catalogo-pruebas.js';

async function setup(t, fecha = '2030-01-01T12:00:00-03:00') {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    t.after(() => db.close());
    await migrate(db);
    await catalogoMensualDePrueba(db);
    let ahora = new Date(fecha);
    const clock = () => ahora, auth = new AuthService(db, clock);
    const admin = await auth.crearAdministrador({ nombre: 'Admin', apellido: 'Prueba', email: 'admin@example.test', password: 'PruebaSegura123!' });
    const persona = { nombre: 'Socio', apellido: 'Prueba', email: 'socio@example.test', password: 'PruebaSegura123!', dni: '90007001', telefono: '1100000000', fechaNacimiento: '2000-01-01' };
    const socio = await auth.registrar(persona), estados = new EstadoService(db, clock), service = new MembresiaService(db, estados);
    await service.configurar('mensual', { precioCentavos: 1500000 });
    const pagar = (extra = {}) => service.registrarPago({ socioId: socio.id, tipoPlan: 'mensual', metodoPago: 'Efectivo', operacionId: crypto.randomUUID(), ...extra }, admin);
    return { db, auth, persona, admin, socio, estados, service, pagar, clock, avanzar: fecha => { ahora = new Date(fecha); } };
}

test('anular un duplicado corrige vigencia, conserva auditoría e idempotencia y no permite resucitar el pago', async t => {
    const { service, pagar, socio, admin, avanzar } = await setup(t);
    const primero = await pagar(), operacionId = crypto.randomUUID(), segundo = await pagar({ operacionId });
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-03-01T15:00:00.000Z');
    avanzar('2030-01-02T12:00:00-03:00');
    assert.deepEqual(await service.anularPago(segundo.id, { motivo: 'Pago duplicado' }, admin), { anulado: true });
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-02-01T15:00:00.000Z');
    const pagos = await service.pagos(socio.id), anulado = pagos.find(pago => pago.id === segundo.id);
    assert.equal(pagos.length, 2);
    assert.equal(pagos.find(pago => pago.id === primero.id).anuladoEn, null);
    assert.equal(anulado.anuladoPor, 'Admin Prueba');
    assert.equal(anulado.motivoAnulacion, 'Pago duplicado');
    const historial = (await service.detalle(socio.id)).membresias;
    assert.equal(historial[0].anulada, true);
    assert.equal(historial[0].fechaVencimientoOriginal.toISOString(), '2030-03-01T15:00:00.000Z');
    assert.equal(historial[1].estado, 'activa');
    avanzar('2030-01-03T12:00:00-03:00');
    await service.anularPago(segundo.id, { motivo: 'Otro motivo' }, admin);
    const repetido = (await service.pagos(socio.id)).find(pago => pago.id === segundo.id);
    assert.equal(repetido.anuladoEn.toISOString(), anulado.anuladoEn.toISOString());
    assert.equal(repetido.motivoAnulacion, 'Pago duplicado');
    await assert.rejects(() => pagar({ operacionId }), { statusCode: 409 });
    await service.anularPago(primero.id, {}, admin);
    assert.equal(await service.actual(socio.id), null);
    await service.configurar('mensual', { habilitado: false });
    assert.equal((await service.planesParaSocio(socio.id)).some(plan => plan.tipo === 'mensual'), false);
    await assert.rejects(() => pagar(), { statusCode: 409 });
});

test('anular pagos antiguos recalcula meses calendario y cambios de plan sin usar precios o duraciones actuales', async t => {
    const { service, pagar, socio, admin, avanzar } = await setup(t, '2030-01-31T12:00:00-03:00');
    const primero = await pagar();
    avanzar('2030-02-01T12:00:00-03:00');
    const segundo = await pagar();
    avanzar('2030-02-05T12:00:00-03:00');
    const alternativo = await service.crearPlan({ nombre: 'Alternativo', meses: 2, precioCentavos: 2500000 });
    await service.cambiarPlan(socio.id, { tipoPlan: alternativo.tipo }, admin);
    avanzar('2030-03-01T12:00:00-03:00');
    const tercero = await pagar();
    await service.configurar('mensual', { meses: 12, precioCentavos: 9990000 });
    await service.anularPago(primero.id, {}, admin);
    const actual = await service.actual(socio.id);
    assert.equal(actual.fechaInicio.toISOString(), '2030-03-01T15:00:00.000Z');
    assert.equal(actual.fechaVencimiento.toISOString(), '2030-04-01T15:00:00.000Z');
    assert.equal(actual.fechaVencimientoOriginal.toISOString(), '2030-04-28T15:00:00.000Z');
    assert.equal((await service.pagos(socio.id)).every(pago => pago.montoCentavos === 1500000), true);
    await service.anularPago(segundo.id, {}, admin);
    const detalle = await service.detalle(socio.id);
    assert.equal(detalle.membresias.find(m => m.tipoPlan === alternativo.tipo).anulada, true);
    assert.equal((await service.actual(socio.id)).fechaVencimiento.toISOString(), '2030-04-01T15:00:00.000Z');
    const cuarto = await pagar();
    await Promise.all([service.anularPago(tercero.id, {}, admin), service.anularPago(cuarto.id, {}, admin)]);
    assert.equal(await service.actual(socio.id), null);
    assert.equal((await service.detalle(socio.id)).membresias.every(m => m.anulada), true);
});

test('anular el único pago libera reservas futuras sin borrar clases finalizadas ni su asistencia', async t => {
    const { db, auth, persona, estados, service, pagar, socio, admin, avanzar } = await setup(t);
    const instructor = await auth.registrar({ ...persona, email: 'instructor@example.test', dni: '90007002', especialidad: 'Funcional' }, 'Instructor');
    const clases = new ClaseService(db, estados), inscripciones = new InscripcionService(db, estados);
    const pago = await pagar();
    const crear = fecha => clases.create({ nombre: 'Funcional', tipo: 'Grupal', fecha, horaInicio: '10:00', duracionMinutos: 60, cupoMaximo: 2, instructorId: instructor.id });
    const pasada = await crear('2030-01-02'), futura = await crear('2030-01-04');
    const asistencia = await inscripciones.reservar({ claseId: pasada.id }, socio);
    await inscripciones.reservar({ claseId: futura.id }, socio);
    avanzar('2030-01-03T12:00:00-03:00');
    await inscripciones.asistencia(asistencia.id, { asistio: true }, admin);
    await service.anularPago(pago.id, {}, admin);
    assert.equal(await service.actual(socio.id), null);
    const historial = await inscripciones.list(socio.id);
    assert.equal(historial.find(i => i.claseId === pasada.id).estado, 'Finalizada');
    assert.equal(historial.find(i => i.claseId === pasada.id).asistio, true);
    assert.equal(historial.find(i => i.claseId === futura.id).estado, 'Cancelada');
    assert.equal((await clases.getById(futura.id)).cupoDisponible, 2);
    await assert.rejects(() => inscripciones.reservar({ claseId: futura.id }, socio), { statusCode: 409 });
});

test('migrar pagos antiguos conserva sus períodos aunque el catálogo ya haya cambiado', async t => {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    t.after(() => db.close());
    await db.exec(await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8'));
    await db.exec(`INSERT INTO usuarios(nombre,apellido,email,password_hash,rol) VALUES
    ('Admin','Prueba','admin@example.test','sintetico','Administrador'),('Socio','Prueba','socio@example.test','sintetico','Socio');
    UPDATE planes SET meses=12,precio_centavos=1000000 WHERE tipo='mensual';
    INSERT INTO membresias(socio_id,tipo_plan,fecha_inicio,fecha_vencimiento,estado) VALUES
    (2,'mensual','2030-01-31T12:00:00-03:00','2030-02-28T12:00:00-03:00','reemplazada'),
    (2,'mensual','2030-01-31T12:00:00-03:00','2030-03-28T12:00:00-03:00','activa');
    INSERT INTO pagos(socio_id,membresia_id,tipo_plan,monto_centavos,metodo_pago,operacion_id,fecha,administrador_id) VALUES
    (2,1,'mensual',900000,'Efectivo','90000000-0000-4000-8000-000000000001','2030-01-31T12:00:00-03:00',1),
    (2,2,'mensual',900000,'Efectivo','90000000-0000-4000-8000-000000000002','2030-02-01T12:00:00-03:00',1);`);
    await migrate(db);
    await migrate(db);
    assert.deepEqual((await db.query('SELECT meses_contratados FROM pagos ORDER BY id')).rows.map(p => p.meses_contratados), [1, 1]);
    const service = new MembresiaService(db, new EstadoService(db, () => new Date('2030-02-02T12:00:00-03:00')));
    await service.anularPago(1, {}, { id: 1 });
    assert.equal((await service.actual(2)).fechaVencimiento.toISOString(), '2030-03-01T15:00:00.000Z');
});
