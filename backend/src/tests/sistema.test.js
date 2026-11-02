import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, migrate } from '../database/Database.js';
import { createApp } from '../app.js';
import AuthService from '../services/AuthService.js';

test('sistema completo: permisos, membresia, ultimo cupo, cancelacion e historial', async () => {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    await migrate(db);
    let ahora = new Date('2030-01-31T12:00:00-03:00');
    const auth = new AuthService(db, () => ahora);
    const base = { nombre: 'Prueba', apellido: 'Sintetica', password: 'PruebaSegura123!', dni: '90000001', telefono: '1100000000', fechaNacimiento: '2000-01-01' };
    const admin = await auth.registrar({ ...base, email: 'admin@example.test' }, 'Administrador');
    const instructor = await auth.registrar({ ...base, email: 'profesor@example.test', dni: '90000002', especialidad: 'Funcional' }, 'Instructor');
    const otroInstructor = await auth.registrar({ ...base, email: 'otro-profesor@example.test', dni: '90000005', especialidad: 'Funcional' }, 'Instructor');
    const socio1 = await auth.registrar({ ...base, email: 'socio1@example.test', dni: '90000003', tipoPlan: 'mensual' });
    const socio2 = await auth.registrar({ ...base, email: 'socio2@example.test', dni: '90000004', tipoPlan: 'mensual' });
    const app = createApp({ db, clock: () => ahora, sessionSecret: 'solo-pruebas-secreto-sintetico-de-64-caracteres-1234567890' });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}/api`;
    const usuario = () => {
        let cookie = '', csrf = '';
        return async (ruta, metodo = 'GET', datos) => {
            const res = await fetch(url + ruta, { method: metodo, headers: { cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: datos === undefined ? undefined : JSON.stringify(datos) });
            if (res.headers.get('set-cookie')) cookie = res.headers.get('set-cookie').split(';')[0];
            const body = await res.json();
            if (body.data?.csrfToken) csrf = body.data.csrfToken;
            return { status: res.status, ...body };
        };
    };
    try {
        const a = usuario(), s1 = usuario(), s2 = usuario(), i = usuario(), i2 = usuario(), anon = usuario();
        for (const [cliente, email] of [[a, admin.email], [s1, socio1.email], [s2, socio2.email], [i, instructor.email], [i2, otroInstructor.email]]) {
            await cliente('/auth/sesion');
            assert.equal((await cliente('/auth/login', 'POST', { email, password: base.password })).status, 200);
        }
        assert.equal((await anon('/clases', 'POST', {})).status, 403);
        assert.equal((await anon('/socios')).status, 401);
        assert.equal((await a('/auth/registro', 'POST', { ...base, email: 'escala@example.test', rol: 'Administrador' })).status, 400);
        for (const [cliente, ruta, metodo, body] of [[i,'/pagos','POST',{}],[s1,'/planes/mensual','PUT',{}],[s1,'/reportes','GET'],[i,'/clases','POST',{}]]) {
            assert.equal((await cliente(ruta, metodo, body)).status, 403);
        }
        const datos = { nombre: 'Funcional', tipo: 'Grupal', fecha: '2030-02-02', horaInicio: '18:00', cupoMaximo: 1, instructorId: instructor.id, duracionMinutos: 60 };
        assert.equal((await s1('/clases', 'POST', datos)).status, 403);
        const clase = (await a('/clases', 'POST', datos)).data;
        assert.ok(clase.id);
        assert.equal((await i2(`/clases/${clase.id}/participantes`)).status, 403);
        assert.equal((await s1(`/clases/${clase.id}/participantes`)).status, 403);
        assert.equal((await s1('/inscripciones', 'POST', { claseId: 999999 })).status, 404);
        assert.equal((await s1('/inscripciones', 'POST', { claseId: clase.id })).status, 409);
        assert.equal((await a('/planes/mensual', 'PUT', { precioCentavos: 1500000, descuentoPorcentaje: 0 })).status, 200);
        for (const socio of [socio1, socio2]) {
            assert.equal((await a('/pagos', 'POST', { socioId: socio.id, tipoPlan: 'mensual', metodoPago: 'Efectivo', operacionId: crypto.randomUUID() })).status, 201);
        }
        const miembro = (await s1('/mi-membresia')).data;
        assert.equal(miembro.fechaVencimiento.slice(0, 10), '2030-02-28');
        const reservas = await Promise.all([s1('/inscripciones', 'POST', { claseId: clase.id }), s2('/inscripciones', 'POST', { claseId: clase.id })]);
        assert.deepEqual(reservas.map(r => r.status).sort(), [201, 409]);
        assert.equal((await anon('/clases')).data[0].cupoDisponible, 0);
        const ganador = reservas[0].status === 201 ? s1 : s2;
        const perdedor = ganador === s1 ? s2 : s1;
        const reserva = reservas.find(r => r.status === 201).data;
        assert.equal((await perdedor(`/inscripciones/${reserva.id}/cancelar`, 'POST', {})).status, 403);
        assert.equal((await a(`/clases/${clase.id}`, 'PUT', { cupoMaximo: 2 })).status, 200);
        const otraReserva = (await perdedor('/inscripciones', 'POST', { claseId: clase.id })).data;
        assert.equal((await a(`/clases/${clase.id}`, 'PUT', { cupoMaximo: 1 })).status, 409);
        assert.equal((await perdedor(`/inscripciones/${otraReserva.id}/cancelar`, 'POST', {})).status, 200);
        assert.equal((await a(`/clases/${clase.id}`, 'PUT', { cupoMaximo: 1 })).status, 200);
        assert.equal((await ganador('/inscripciones', 'POST', { claseId: clase.id })).status, 409);
        assert.equal((await a(`/clases/${clase.id}`, 'PUT', { id: 999 })).status, 400);
        assert.equal((await i('/clases')).data.length, 1);
        assert.equal((await i('/socios')).status, 403);
        ahora = new Date('2030-02-02T16:00:00-03:00');
        assert.equal((await ganador(`/inscripciones/${reserva.id}/cancelar`, 'POST', {})).status, 200);
        assert.equal((await ganador(`/inscripciones/${reserva.id}/cancelar`, 'POST', {})).status, 200);
        assert.equal((await anon('/clases')).data[0].cupoDisponible, 1);
        const nueva = (await ganador('/inscripciones', 'POST', { claseId: clase.id })).data;
        ahora = new Date('2030-02-02T16:01:00-03:00');
        assert.equal((await ganador(`/inscripciones/${nueva.id}/cancelar`, 'POST', {})).status, 409);
        ahora = new Date('2030-02-02T18:01:00-03:00');
        assert.equal((await i2(`/inscripciones/${nueva.id}/asistencia`, 'PUT', { asistio: true })).status, 403);
        assert.equal((await ganador(`/inscripciones/${nueva.id}/asistencia`, 'PUT', { asistio: true })).status, 403);
        assert.equal((await i(`/inscripciones/${nueva.id}/asistencia`, 'PUT', { asistio: true })).status, 200);
        ahora = new Date('2030-02-02T19:01:00-03:00');
        assert.equal((await ganador('/mi-historial')).data.length, 1);
        assert.equal((await a('/reportes')).data[0].asistencias, 1);
        assert.equal((await a(`/clases/${clase.id}`, 'DELETE')).status, 200);
        assert.equal((await anon(`/clases/${clase.id}`)).status, 404);
        assert.equal((await ganador('/mi-historial')).data.length, 1);
    } finally {
        await new Promise(resolve => server.close(resolve));
        await db.close();
    }
});
