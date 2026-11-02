import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase, migrate } from '../database/Database.js';
import { createApp } from '../app.js';
import AuthService from '../services/AuthService.js';

const base = { nombre: 'Socio', apellido: 'Sintetico', email: 'socio@example.test', password: 'Segura123!', dni: '90006001', telefono: '1100000000', fechaNacimiento: '2000-01-01' };
async function escenario(t) {
    const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
    await migrate(db);
    let ahora = new Date('2030-01-01T12:00:00-03:00');
    const auth = new AuthService(db, () => ahora);
    const admin = await auth.crearAdministrador({ nombre: 'Admin', apellido: 'Sintetico', email: 'admin@example.test', password: 'Administrador123!' });
    await db.query("UPDATE planes SET precio_centavos=1500000 WHERE tipo='mensual'");
    const server = createApp({ db, clock: () => ahora, sessionSecret: 'secreto-sintetico-exclusivo-pruebas-accesos-123456789' }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    t.after(async () => { await new Promise(resolve => server.close(resolve)); await db.close(); });
    function cliente() {
        let cookie = '', csrf = '';
        return async (path, method = 'GET', data) => {
            const res = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
                method, headers: { cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
                body: data === undefined ? undefined : JSON.stringify(data),
            });
            if (res.headers.get('set-cookie')) cookie = res.headers.get('set-cookie').split(';')[0];
            const body = await res.json();
            if (body.data?.csrfToken) csrf = body.data.csrfToken;
            return { status: res.status, ...body };
        };
    }
    const a = cliente(), s = cliente();
    await a('/auth/sesion'); await s('/auth/sesion');
    await a('/auth/login', 'POST', { email: admin.email, password: 'Administrador123!' });
    return { db, a, s, cliente, avanzar: dias => { ahora = new Date(ahora.getTime() + dias * 86400000); } };
}

test('asociarse exige plan con precio y método manual en el servidor', async t => {
    const { s, db } = await escenario(t);
    for (const datos of [base, { ...base, tipoPlan: 'mensual' }, { ...base, tipoPlan: 'mensual', metodoPago: 'Tarjeta' }]) {
        assert.equal((await s('/auth/registro', 'POST', datos)).status, 400);
    }
    assert.equal((await s('/auth/registro', 'POST', { ...base, tipoPlan: 'trimestral', metodoPago: 'Efectivo' })).status, 409);
    await db.query("UPDATE planes SET habilitado=FALSE WHERE tipo='mensual'");
    assert.equal((await s('/auth/registro', 'POST', { ...base, tipoPlan: 'mensual', metodoPago: 'Efectivo' })).status, 409);
    assert.equal((await db.query("SELECT COUNT(*)::INTEGER AS total FROM usuarios WHERE rol='Socio'")).rows[0].total, 0);
});

test('cuenta por transferencia queda pendiente; declarar pago no activa y confirmar sí', async t => {
    const { s, a, db } = await escenario(t);
    const alta = await s('/auth/registro', 'POST', { ...base, tipoPlan: 'mensual', metodoPago: 'Transferencia' });
    assert.equal(alta.status, 201);
    const socio = alta.data.usuario;
    assert.equal(socio.metodoPagoSolicitado, 'Transferencia');
    assert.equal((await s('/mi-membresia')).data, null);
    const instructor = await new AuthService(db).registrar({ ...base, dni: '90006002', email: 'instructor@example.test', especialidad: 'Funcional' }, 'Instructor');
    const clase = (await a('/clases', 'POST', { nombre: 'Funcional', tipo: 'Grupal', fecha: '2030-01-02', horaInicio: '18:00', duracionMinutos: 60, cupoMaximo: 2, instructorId: instructor.id })).data;
    assert.equal((await s('/inscripciones', 'POST', { claseId: clase.id })).status, 409);
    assert.equal((await s('/mi-membresia/pago-reportado', 'POST', {})).status, 200);
    const reportado = (await s('/auth/sesion')).data.usuario.pagoReportadoEn;
    assert.ok(reportado);
    assert.equal((await s('/mi-membresia/pago-reportado', 'POST', {})).data.pagoReportadoEn, reportado);
    assert.equal((await s('/mi-membresia')).data, null);
    assert.equal((await s('/pagos', 'POST', {})).status, 403);
    const operacionId = crypto.randomUUID();
    const pago = { socioId: socio.id, tipoPlan: 'mensual', metodoPago: 'Transferencia', operacionId };
    assert.equal((await a('/pagos', 'POST', pago)).status, 201);
    assert.equal((await a('/pagos', 'POST', pago)).status, 201);
    assert.equal((await s('/mi-membresia')).data.estado, 'activa');
    const actualizado = (await s('/auth/sesion')).data.usuario;
    assert.equal(actualizado.tipoPlan, null);
    assert.equal(actualizado.metodoPagoSolicitado, null);
    assert.equal(actualizado.pagoReportadoEn, null);
    assert.equal((await s('/inscripciones', 'POST', { claseId: clase.id })).status, 201);
    assert.equal((await db.query('SELECT COUNT(*)::INTEGER AS total FROM pagos')).rows[0].total, 1);
});

test('efectivo no permite declarar una transferencia ni elevar permisos', async t => {
    const { s, a } = await escenario(t);
    assert.equal((await s('/auth/registro', 'POST', { ...base, tipoPlan: 'mensual', metodoPago: 'Efectivo', rol: 'Administrador' })).status, 400);
    assert.equal((await s('/auth/registro', 'POST', { ...base, tipoPlan: 'mensual', metodoPago: 'Efectivo' })).status, 201);
    assert.equal((await s('/mi-membresia/pago-reportado', 'POST', {})).status, 409);
    assert.equal((await s('/socios/1/invitacion', 'POST', {})).status, 403);
    assert.equal((await a('/mi-membresia/pago-reportado', 'POST', {})).status, 403);
});

test('alta administrativa sin contraseña e invitación de un uso sin activar membresía', async t => {
    const { a, s, db } = await escenario(t);
    const { password, ...datos } = base;
    const alta = await a('/socios', 'POST', { ...datos, tipoPlan: 'mensual' });
    assert.equal(alta.status, 201);
    assert.equal(alta.data.accesoPendiente, true);
    const invitacion = (await a(`/socios/${alta.data.id}/invitacion`, 'POST', {})).data;
    assert.match(invitacion.token, /^[a-f0-9]{64}$/);
    const guardado = (await db.query('SELECT token_hash FROM invitaciones_acceso')).rows[0].token_hash;
    assert.notEqual(guardado, invitacion.token);
    assert.equal((await s('/auth/activar-acceso', 'POST', { token: invitacion.token, password: 'mala' })).status, 400);
    assert.equal((await s('/auth/activar-acceso', 'POST', { token: invitacion.token, password })).status, 200);
    assert.equal((await s('/mi-membresia')).data, null);
    assert.equal((await s('/auth/sesion')).data.usuario.accesoPendiente, false);
    assert.equal((await s('/auth/activar-acceso', 'POST', { token: invitacion.token, password })).status, 409);
    assert.equal((await a(`/socios/${alta.data.id}/invitacion`, 'POST', {})).status, 409);
});

test('renovar invitación invalida la anterior; expiración, baja y migración repetida', async t => {
    const { a, s, db, avanzar } = await escenario(t);
    const { password, ...datos } = base;
    const socio = (await a('/socios', 'POST', datos)).data;
    assert.ok(socio?.id, 'el administrador debe poder crear una cuenta sin contraseña');
    const primera = (await a(`/socios/${socio.id}/invitacion`, 'POST', {})).data;
    const segunda = (await a(`/socios/${socio.id}/invitacion`, 'POST', {})).data;
    assert.equal((await s('/auth/activar-acceso', 'POST', { token: primera.token, password })).status, 409);
    avanzar(3);
    assert.equal((await s('/auth/activar-acceso', 'POST', { token: segunda.token, password })).status, 409);
    const tercera = (await a(`/socios/${socio.id}/invitacion`, 'POST', {})).data;
    await db.query("UPDATE usuarios SET estado='baja' WHERE id=$1", [socio.id]);
    assert.equal((await s('/auth/activar-acceso', 'POST', { token: tercera.token, password })).status, 409);
    await migrate(db);
    assert.equal((await db.query('SELECT COUNT(*)::INTEGER AS total FROM invitaciones_acceso')).rows[0].total, 1);
});

test('altas e invitaciones rechazan cuerpos invalidos y campos ajenos al contrato', async t => {
    const { a } = await escenario(t);
    assert.equal((await a('/socios', 'POST', null)).status, 400);
    assert.equal((await a('/socios', 'POST', [])).status, 400);
    const { password, ...perfil } = base;
    const socio = (await a('/socios', 'POST', perfil)).data;
    assert.equal((await a(`/socios/${socio.id}/invitacion`, 'POST', { rol: 'Administrador' })).status, 400);
});
