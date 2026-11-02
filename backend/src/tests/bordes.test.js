import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, migrate } from '../database/Database.js';
import { catalogoMensualDePrueba } from './catalogo-pruebas.js';
import { createApp } from '../app.js';
import AuthService from '../services/AuthService.js';
import EstadoService from '../services/EstadoService.js';
import MembresiaService from '../services/MembresiaService.js';
import ClaseService from '../services/ClaseService.js';
import InscripcionService from '../services/InscripcionService.js';
const base = { nombre: 'Prueba', apellido: 'Sintetica', password: 'PruebaSegura123!', telefono: '1100000000', fechaNacimiento: '2000-01-01' };
test('limites: gracia, renovacion, suspension, precios e idempotencia', async () => {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    await migrate(db);
    await catalogoMensualDePrueba(db);
    let ahora = new Date('2030-01-01T12:00:00-03:00');
    const auth = new AuthService(db, () => ahora), estados = new EstadoService(db, () => ahora);
    const membresias = new MembresiaService(db, estados), clases = new ClaseService(db, estados), reservas = new InscripcionService(db, estados);
    try {
        const admin = await auth.registrar({ ...base, dni: '90001000', email: 'admin@example.test' }, 'Administrador');
        const instructor = await auth.registrar({ ...base, dni: '90001001', email: 'i@example.test', especialidad: 'Funcional' }, 'Instructor');
        const socio = await auth.registrar({ ...base, dni: '90001002', email: 's@example.test' });
        await assert.rejects(() => auth.registrar({ ...base, dni: '90001003', email: 'menor@example.test', fechaNacimiento: '2014-01-02' }), /16/);
        const limite = await auth.registrar({ ...base, dni: '90001003', email: 'limite@example.test', fechaNacimiento: '2014-01-01' });
        assert.ok(limite);
        const pago = { socioId: socio.id, tipoPlan: 'mensual', metodoPago: 'Efectivo', operacionId: crypto.randomUUID() };
        await assert.rejects(() => membresias.registrarPago(pago, admin), /configurar/);
        await membresias.configurar('mensual', { precioCentavos: 1000000, descuentoPorcentaje: 0 });
        const primero = await membresias.registrarPago(pago, admin);
        await membresias.configurar('anual', { precioCentavos: 12000000, descuentoPorcentaje: 10 });
        const anual = await membresias.registrarPago({ ...pago, socioId: limite.id, tipoPlan: 'anual', operacionId: crypto.randomUUID() }, admin);
        assert.equal(anual.montoCentavos, 10800000);
        assert.equal(new Date((await membresias.actual(limite.id)).fechaVencimiento).toISOString(), '2031-01-01T15:00:00.000Z');
        const mensual = await membresias.registrarPago({ ...pago, socioId: limite.id, operacionId: crypto.randomUUID() }, admin);
        assert.equal(mensual.montoCentavos, 1000000);
        assert.equal((await membresias.registrarPago(pago, admin)).id, primero.id);
        assert.equal((await membresias.pagos(socio.id)).length, 1);
        await assert.rejects(() => membresias.registrarPago({ ...pago, metodoPago: 'Tarjeta' }, admin), /otro pago/);
        const clase = await clases.create({ nombre: 'Posterior', tipo: 'Funcional', fecha: '2030-02-08', horaInicio: '18:00', instructorId: instructor.id, duracionMinutos: 60, cupoMaximo: 2 });
        const reserva = await reservas.reservar({ claseId: clase.id }, socio);
        ahora = new Date('2030-01-25T12:00:00-03:00');
        assert.equal((await membresias.socios()).find(item => item.id === socio.id).proximaAVencer, true);
        ahora = new Date('2030-01-25T11:59:59-03:00');
        assert.equal((await membresias.socios()).find(item => item.id === socio.id).proximaAVencer, false);
        ahora = new Date('2030-02-01T12:00:00-03:00');
        assert.equal((await reservas.list(socio.id))[0].estado, 'Pendiente');
        assert.equal((await clases.getAll())[0].cupoDisponible, 1);
        ahora = new Date('2030-02-04T11:59:59-03:00');
        assert.equal((await reservas.list(socio.id))[0].estado, 'Pendiente');
        await membresias.registrarPago({ ...pago, operacionId: crypto.randomUUID() }, admin);
        assert.equal((await reservas.list(socio.id))[0].estado, 'Confirmada');
        const membresia = await membresias.actual(socio.id);
        await membresias.registrarPago({ ...pago, operacionId: crypto.randomUUID() }, admin);
        assert.ok(new Date((await membresias.actual(socio.id)).fechaVencimiento) > new Date(membresia.fechaVencimiento));
        await auth.actualizar(socio.id, { estado: 'suspendido' }, true);
        assert.equal((await reservas.list(socio.id)).find(item => item.id === reserva.id).estado, 'Cancelada');
        assert.equal((await clases.getAll())[0].cupoDisponible, 2);
        await assert.rejects(() => reservas.reservar({ claseId: clase.id }, socio), /activa/);
        await auth.actualizar(socio.id, { estado: 'baja' }, true);
        assert.ok((await membresias.detalle(socio.id)).pagos.length > 0);
    } finally { await db.close(); }
});
test('payload de contraseña invalido produce 400; historial valida id y existencia', async () => {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    await migrate(db);
    await catalogoMensualDePrueba(db);
    const auth = new AuthService(db);
    const admin = await auth.registrar({ ...base, email: 'a@example.test', dni: '90002000' }, 'Administrador');
    const app = createApp({ db, sessionSecret: 'secreto-sintetico-solo-pruebas-longitud-suficiente' });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api`;
    let cookie = '', csrf = '';
    async function request(path, method = 'GET', body) {
        const response = await fetch(url + path, { method, headers: { cookie, 'X-CSRF-Token': csrf, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
        if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
        const result = await response.json();
        if (result.data?.csrfToken) csrf = result.data.csrfToken;
        return { status: response.status, result };
    }
    try {
        await request('/auth/sesion');
        await request('/auth/login', 'POST', { email: admin.email, password: base.password });
        assert.equal((await request('/mi-cuenta', 'PUT', { password: 1234 })).status, 400);
        assert.equal((await request('/planes/anual', 'PUT', { precioCentavos: 1, descuentoPorcentaje: 99 })).status, 400);
        assert.equal((await request('/socios/no-es-id/historial')).status, 400);
        assert.equal((await request('/socios/999999/historial')).status, 404);
    } finally { await new Promise(resolve => server.close(resolve)); await db.close(); }
});
test('gracia termina a los tres dias exactos o al inicio de la clase, sin doble liberacion', async () => {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    await migrate(db);
    await catalogoMensualDePrueba(db);
    let ahora = new Date('2030-01-01T12:00:00-03:00');
    const auth = new AuthService(db, () => ahora), estados = new EstadoService(db, () => ahora);
    const membresias = new MembresiaService(db, estados), clases = new ClaseService(db, estados), reservas = new InscripcionService(db, estados);
    try {
        const admin = await auth.registrar({ ...base, dni: '90005000', email: 'a@example.test' }, 'Administrador');
        const instructor = await auth.registrar({ ...base, dni: '90005001', email: 'i@example.test', especialidad: 'Funcional' }, 'Instructor');
        const socio = await auth.registrar({ ...base, dni: '90005002', email: 's@example.test' });
        await membresias.configurar('mensual', { precioCentavos: 1000000, descuentoPorcentaje: 0 });
        await membresias.registrarPago({ socioId: socio.id, tipoPlan: 'mensual', metodoPago: 'Efectivo', operacionId: crypto.randomUUID() }, admin);
        const datos = { nombre: 'Gracia', tipo: 'Funcional', instructorId: instructor.id, horaInicio: '18:00', duracionMinutos: 60, cupoMaximo: 1 };
        const temprana = await clases.create({ ...datos, fecha: '2030-02-02' });
        const tardia = await clases.create({ ...datos, fecha: '2030-02-05' });
        await reservas.reservar({ claseId: temprana.id }, socio);
        await reservas.reservar({ claseId: tardia.id }, socio);
        ahora = new Date('2030-02-01T12:00:00-03:00');
        assert.ok((await reservas.list(socio.id)).every(item => item.estado === 'Pendiente'));
        ahora = new Date('2030-02-02T18:00:00-03:00');
        assert.equal((await reservas.list(socio.id)).find(item => item.claseId === temprana.id).estado, 'Cancelada');
        ahora = new Date('2030-02-04T11:59:59-03:00');
        assert.equal((await reservas.list(socio.id)).find(item => item.claseId === tardia.id).estado, 'Pendiente');
        ahora = new Date('2030-02-04T12:00:00-03:00');
        assert.ok((await reservas.list(socio.id)).every(item => item.estado === 'Cancelada'));
        await estados.mantenimiento(); await estados.mantenimiento();
        assert.ok((await clases.getAll()).every(item => item.cupoDisponible === 1));
    } finally { await db.close(); }
});
