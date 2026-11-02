import express from 'express';
import { createDatabase, migrate } from '../database/Database.js';
import { createApp } from '../app.js';
import AuthService from '../services/AuthService.js';
import { catalogoMensualDePrueba } from './catalogo-pruebas.js';
if (process.env.NODE_ENV !== 'test' || process.env.VERCEL) throw new Error('El servidor de pruebas solo se ejecuta localmente con NODE_ENV=test.');
const db = await createDatabase({ mode: 'local', dataDir: 'memory://' });
await migrate(db);
await catalogoMensualDePrueba(db);
let ahora = new Date('2030-01-01T12:00:00-03:00');
await new AuthService(db, () => ahora).registrar({
    nombre: 'Admin', apellido: 'Sintetico', email: 'admin@example.test', password: 'PruebaSegura123!',
    dni: '90003000', telefono: '1100000000', fechaNacimiento: '2000-01-01',
}, 'Administrador');
const app = express();
app.post('/__test__/clock', express.json(), (req, res) => {
    const fecha = req.body?.fecha;
    if (typeof fecha !== 'string' || !Number.isFinite(Date.parse(fecha))) return res.status(400).json({ message: 'Fecha de prueba invalida.' });
    ahora = new Date(fecha);
    res.json({ fecha: ahora.toISOString() });
});
app.use(createApp({ db, clock: () => ahora, sessionSecret: 'secreto-sintetico-solo-para-pruebas-de-navegador' }));
const server = app.listen(3011, '127.0.0.1', () => console.log('Servidor aislado E2E: 127.0.0.1:3011'));
async function cerrar() { await new Promise(resolve => server.close(resolve)); await db.close(); }
process.once('SIGTERM', cerrar);
process.once('SIGINT', cerrar);
